import Router from "@koa/router";
import type { Middleware } from "koa";
import admin from "./admin/index.ts";
import assets from "./assets.ts";
import dl, { dir } from "./dl.ts";
import login from "./login.ts";
import ul from "./ul.ts";

const accessKeyRequired: Middleware = (ctx, next) => {
  const userAccessKey = ctx.query?.key ?? ctx.body?.key ?? ctx.get("key");

  if (typeof userAccessKey !== "string" || !ctx.checkAccessKey(userAccessKey)) {
    ctx.status = 401;
    ctx.state.withAccessToken = false;
    return ctx.render("error-401.pug");
  }

  ctx.state.withAccessToken = true;
  return next();
};

export default new Router()
  .get("/", accessKeyRequired, async (ctx) => {
    await ctx.render("index.pug", {
      dls: dir,
    });
  })
  .use("/assets", assets.routes())
  .use("/dl", accessKeyRequired, dl.routes())
  .use("/ul", accessKeyRequired, ul.routes())
  .use("/login", accessKeyRequired, login.routes())
  .use(
    "/admin",
    accessKeyRequired,
    (ctx, next) => {
      if (!ctx.session?.admin) {
        ctx.status = 401;
        return ctx.render("error-401.pug");
      }

      return next();
    },
    admin.routes(),
  );
