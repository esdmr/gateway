import Router from "@koa/router";
import { updateDir } from "../dl.ts";

export default new Router().post("/", async (ctx) => {
  await updateDir();
  ctx.sendNotification("Refreshed the download list.");
  ctx.back(ctx.homepage);
});
