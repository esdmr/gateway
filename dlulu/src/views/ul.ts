import multer from "@koa/multer";
import Router from "@koa/router";
import { randomUUID } from "crypto";
import { mkdir, rename } from "fs/promises";
import { join } from "path";
import { fileURLToPath } from "url";

const ulDir =
  process.env.UL_DIR ?? fileURLToPath(new URL("../../ul", import.meta.url));

await mkdir(ulDir, { recursive: true });

const upload = multer({
  dest: ulDir,
});

export default new Router()
  .get("/", async (ctx) => {
    ctx.redirect(ctx.homepage);
  })
  .post("/", upload.single("body"), async (ctx) => {
    const body = ctx.file;
    const name = (ctx.request.body as any)?.name;

    if (
      !body ||
      typeof name !== "string" ||
      !name.match(/^[a-zA-Z0-9_.-]{1,256}$/)
    ) {
      ctx.status = 400;
      return ctx.render("error-csrf.pug");
    }

    const ext = body.originalname.match(/\.[a-zA-Z0-9]+$/)?.[0] ?? "";

    await rename(
      body.path,
      join(ulDir, name + "-" + randomUUID().split("-", 1)[0] + ext),
    );

    ctx.sendNotification("Successfully uploaded the file.");
    ctx.back(ctx.homepage);
  });
