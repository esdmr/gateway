import { spawn } from "node:child_process";
import { createServer } from "node:http";

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
          data.title.trim() + "\n" + data.message.trim() + "\n\n---\n\n",
        );

        spawn(
          "notify-send",
          ["-a", "Gateway Alert", "--", data.title.trim(), data.message.trim()],
          { stdio: "inherit" },
        );

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
