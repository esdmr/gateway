import { readableStreamToFormData } from "bun";
import { createReadStream, readFileSync } from "node:fs";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { createServer, IncomingMessage, ServerResponse } from "node:http";

const secKey = process.env.SECKEY_FILE
  ? readFileSync(process.env.SECKEY_FILE, "utf8").trim()
  : process.env.SECKEY;

if (!secKey) throw new Error("Missing sec key");

/** @type {import('node:fs').Dirent[]} */
let dir = [];
let dirRes = "[]";
const ts = new Set();
const prefix = process.env.BASEURL ?? "";
updateDir();

const index = String.raw`
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>DLULU</title>
		<link rel="stylesheet" href="/index.css">
		<style>label {display: block;} input {width: 32ch;} :link {color: #faa;}</style>
	</head>
	<body>
    <main>
      <h1>DLULU (Download/Upload Utility)</h1>
      <h2>Download</h2>
      <ul>{{DL}}</ul>
      <h2>Upload</h2>
      <form action="ul/?key={{KEY}}" method="post" enctype="multipart/form-data">
        <input name="t" type="hidden" value="{{T}}" />
        <label>File name: <input
          id="name"
          name="name"
          autocomplete="off"
          autocapitalize="off"
          pattern="[a-zA-Z0-9_.-]+"
          required
          maxlength="256"
        /></label>
        <label>File: <input id="body" name="body" type="file" autocomplete="off" required /></label>
        <button>Submit</button>
      </form>
    </main>
	</body>
</html>
`;

async function updateDir() {
  await mkdir(new URL("dl", import.meta.url), { recursive: true });
  await mkdir(new URL("ul", import.meta.url), { recursive: true });
  dir = (
    await readdir(new URL("dl", import.meta.url), { withFileTypes: true })
  ).filter((i) => i.isFile());
  dirRes = JSON.stringify(dir.map((i) => i.name));
  console.log(
    "Dirs Updated.",
    dir.map((i) => i.name),
  );
}

/**
 *
 * @param {ServerResponse<IncomingMessage> & { req: IncomingMessage; }} res
 */
function parmDenied(res, why = "unknown") {
  res.writeHead(403, "Parmesan Denied");
  res.end('{"ok":0}');
  logRes(res, "PD:" + why);
}

/**
 * @param {ServerResponse<IncomingMessage> & { req: IncomingMessage; }} res
 */
function logRes(res, why = "unknown") {
  console.log(
    `Access [${new Date().toISOString()}]: ${
      res.req.headers["x-real-ip"] ?? res.req.socket.remoteAddress
    } - ${res.req.url?.replaceAll("key=" + secKey, "key=...")} - ${
      res.statusCode
    } - ${res.req.headers.referer} - ${res.req.headers["user-agent"]} - ${why}`,
  );
}

const app = createServer(async (req, res) => {
  try {
    res.setHeader("content-type", "application/json");
    res.setHeader("content-encoding", "utf8");
    res.setHeader("server", "dlulu/0.0");

    const url = new URL(`https://${process.env.HOST || "localhost"}${req.url}`);

    if (url.searchParams.get("key") !== secKey) {
      parmDenied(res, "key");
      return;
    }

    if (url.pathname.startsWith(prefix)) {
      url.pathname = url.pathname.slice(prefix.length);
    }

    /**
     * @type {RegExpMatchArray | null}
     */
    let match = null;

    if (req.method === "GET" && url.pathname.match(/^\/dl\/?$/)) {
      res.writeHead(200, "Ok");
      res.end(dirRes);
      logRes(res, "dli");
      return;
    } else if (
      req.method === "GET" &&
      (match = url.pathname.match(/^\/dl\/([^/\\]{1,1020})$/))
    ) {
      if (!dir.find((i) => i.name === match[1])) parmDenied(res, "fnd");
      const file = createReadStream(
        new URL("dl/" + encodeURIComponent(match[1]), import.meta.url),
      );
      res.setHeader("content-type", "application/octet-stream");
      res.writeHead(200, "Ok");
      file.pipe(res);
      logRes(res, "dlg");
      return;
    } else if (
      req.method === "POST" &&
      (match = url.pathname.match(/^\/ul\/?$/))
    ) {
      const match = req.headers["content-type"]?.match(
        /^multipart\/form-data; ?boundary=(.*)$/,
      );
      if (!match) {
        parmDenied(res, "typ");
        return;
      }
      const formData = await readableStreamToFormData(
        IncomingMessage.toWeb(req),
        match[1],
      );
      console.log(formData);
      const t = formData.get("t");
      let name = formData.get("name");
      const body = formData.get("body");

      if (!ts.has(t)) {
        parmDenied(res, "not");
        return;
      }

      ts.delete(t);

      if (typeof name !== "string" || !name.match(/^[a-zA-Z0-9_.-]{1,256}$/)) {
        parmDenied(res, "nom");
        return;
      }

      if (!body || !(body instanceof Blob)) {
        parmDenied(res, "bdy");
        return;
      }

      const i = body.name.split(".").filter(Boolean).at(-1);
      if (i) name += "." + i;

      if (!name.includes(".")) {
        parmDenied(res, "nox");
        return;
      }

      await writeFile(
        new URL("ul/" + encodeURIComponent(name), import.meta.url),
        body.stream(),
      );

      res.writeHead(200, "Ok");
      res.end('{"ok":1}');
      logRes(res, "upl");
      return;
    } else if (req.method === "GET" && url.pathname.match(/^\/$/)) {
      res.setHeader("content-type", "text/html");
      res.writeHead(200, "Ok");
      const t = Math.random().toFixed(19).replace("0.", "");
      ts.add(t);
      res.end(
        index
          .replaceAll("{{KEY}}", secKey)
          .replaceAll(
            "{{DL}}",
            dir
              .map(
                (i) =>
                  `<li><a href="dl/${encodeURIComponent(
                    i.name,
                  )}?key=${secKey}">${encodeURIComponent(i.name)}</a>`,
              )
              .join(""),
          )
          .replaceAll("{{T}}", t),
      );
      logRes(res, "idx");
      return;
    }

    parmDenied(res, "pth " + url.pathname);
  } catch (error) {
    console.error(error);
    parmDenied(res, "err");
  }
});

app.listen(9075, () => {
  console.log("Listening at", app.address());
});
