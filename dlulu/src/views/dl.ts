import Router from "@koa/router";
import { mkdir, readdir, stat } from "fs/promises";
import { join } from "path";
import { fileURLToPath } from "url";
import { partialSend } from "../partial-send.ts";

const dlDir =
  process.env.DL_DIR ?? fileURLToPath(new URL("../../dl", import.meta.url));

await mkdir(dlDir, { recursive: true });

export let dir: readonly { readonly name: string; readonly size: number }[] =
  [];

await updateDir();

export async function updateDir() {
  const newDir = (await readdir(dlDir, { withFileTypes: true }))
    .filter((i) => i.isFile())
    .map((i) => ({ name: i.name, size: 0 }))
    .sort((a, b) => a.name.localeCompare(b.name, "en"));

  for (const i of newDir) {
    const s = await stat(join(dlDir, encodeURIComponent(i.name)));

    i.size = s.size;
  }

  dir = newDir;
  console.log(
    "Dirs Updated.",
    dir.map((i) => i.name),
  );
}

export default new Router()
  .get("/", async (ctx) => {
    ctx.redirect(ctx.homepage);
  })
  .get("/:name", (ctx) => {
    if (!dir.some((i) => i.name)) {
      ctx.status = 404;
      return ctx.render("error-404.pug");
    }

    ctx.set("content-disposition", "attachment");

    return partialSend(ctx, ctx.params.name, {
      root: dlDir,
    });
  });
