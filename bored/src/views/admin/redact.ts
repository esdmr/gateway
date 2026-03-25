import Router from "@koa/router";
import { getMessage, redactMessage } from "../../models/messages.ts";

export default new Router()
  .get("/", (ctx) => {
    const mid = ctx.query.mid;
    const message =
      typeof mid === "string" ? getMessage(Number(mid)) : undefined;

    if (!message) {
      ctx.status = 400;
      return ctx.render("error-csrf.pug");
    }

    return ctx.render("redact.pug", { message, returnPath: ctx.query.return });
  })
  .post("/", (ctx) => {
    let body = ctx.request.body as Record<string, any> | null | undefined;

    if (typeof body !== "object" || !body) {
      body = {};
    }

    if (
      typeof body.mid !== "string" ||
      typeof body.author !== "string" ||
      typeof body.body !== "string"
    ) {
      ctx.status = 400;
      return ctx.render("error-csrf.pug");
    }

    if (!redactMessage(Number(body.mid), body.author, body.body)) {
      ctx.status = 404;
      return ctx.render("error-404.pug");
    }

    ctx.sendNotification("Successfully redacted a message.");
    ctx.redirect(body.return || ctx.BASEURL + "admin");
  });
