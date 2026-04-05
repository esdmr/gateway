import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { createInterface } from "node:readline";

function notify(title: string, message: string) {
  spawn(
    "notify-send",
    ["-a", "Gateway Alert", "--", title.trim(), message.trim()],
    { stdio: "inherit" },
  );
}

createServer((req, res) => {
  try {
    const chunks: Uint8Array[] = [];

    req.on("readable", () => {
      try {
        let chunk: Uint8Array;
        while (null !== (chunk = req.read())) {
          chunks.push(chunk);
        }
      } catch (error) {
        console.error(error);
      }
    });

    req.on("end", () => {
      try {
        const data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        data.message = data.message.replaceAll(":3000", ":4000");
        console.log(
          data.title.trim() + "\n" + data.message.trim() + "\n\n---\n",
        );

        notify(data.title, data.message);

        res.writeHead(204);
        res.end();
      } catch (error) {
        console.error(error);
      }
    });
  } catch (error) {
    console.error(error);
  }
}).listen(10101);

const filterRe = / 172\.172\.172\.| 172\.19\.0\.| 192\.168\.1\./g;

const ch = spawn(
  "docker",
  ["compose", "logs", "nginx", "--since", new Date().toISOString(), "--follow"],
  { cwd: new URL(".", import.meta.url) },
);

let shouldNotifyOnForeignActivity = true;

for await (const i of createInterface(ch.stdout)) {
  filterRe.lastIndex = 0;
  if (filterRe.test(i)) continue;

  console.log(i);

  if (shouldNotifyOnForeignActivity) {
    shouldNotifyOnForeignActivity = false;

    notify("Foreign Activity Detected", i);

    setTimeout(() => {
      shouldNotifyOnForeignActivity = true;
    }, 30_000);
  }
}
