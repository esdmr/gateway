import Router from "@koa/router";
import { deleteWanted } from "../../models/wanted.ts";
import { DEV } from "../compose.ts";

export default new Router().post("/", (ctx) => {
  let body = ctx.request.body as Record<string, any> | null | undefined;

  if (typeof body !== "object" || !body) {
    body = {};
  }

  if (typeof body.wid !== "string") {
    ctx.status = 400;
    return ctx.render("error-csrf.pug");
  }

  if (!deleteWanted(Number(body.wid))) {
    ctx.status = 404;
    return ctx.render("error-404.pug");
  }

  ctx.sendNotification("Successfully removed an item from the wanted list.");
  ctx.redirect(body.return || (DEV ? "/admin" : "/bored/admin"));
});
