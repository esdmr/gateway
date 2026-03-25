import Router from "@koa/router";
import { deleteMessage } from "../../models/messages.ts";

export default new Router().post("/", (ctx) => {
  let body = ctx.request.body as Record<string, any> | null | undefined;

  if (typeof body !== "object" || !body) {
    body = {};
  }

  if (typeof body.mid !== "string") {
    ctx.status = 400;
    return ctx.render("error-csrf.pug");
  }

  if (!deleteMessage(Number(body.mid))) {
    ctx.status = 404;
    return ctx.render("error-404.pug");
  }

  ctx.sendNotification("Successfully deleted a message.");
  ctx.redirect(body.return || ctx.BASEURL + "admin");
});
