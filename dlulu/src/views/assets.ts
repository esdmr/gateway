import Router from "@koa/router";
import { send } from "@koa/send";
import { fileURLToPath } from "node:url";

export default new Router().get("{/*path}", async (ctx, next) => {
  try {
    await send(ctx, ctx.params.path, {
      root: fileURLToPath(new URL("../assets", import.meta.url)),
      gzip: false,
      brotli: false,
    });
  } catch {
    await next();
  }
});
