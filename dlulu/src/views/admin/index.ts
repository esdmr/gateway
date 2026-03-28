import Router from "@koa/router";
import refresh from "./refresh.ts";

export default new Router()
  .get("/", async (ctx) => {
    ctx.redirect(ctx.homepage);
  })
  .use("/refresh", refresh.routes());
