import Router from "@koa/router";
import * as v from "valibot";
import { Directory, moveMessage } from "../../models/messages.ts";
import { DEV } from "../compose.ts";

export default new Router().post("/", (ctx) => {
  let body = ctx.request.body as Record<string, any> | null | undefined;

  if (typeof body !== "object" || !body) {
    body = {};
  }

  const directory = v.safeParse(Directory, Number(body.dir));

  if (typeof body.mid !== "string" || !directory.typed) {
    ctx.status = 400;
    return ctx.render("error-csrf.pug");
  }

  if (!moveMessage(Number(body.mid), directory.output)) {
    ctx.status = 404;
    return ctx.render("error-404.pug");
  }

  ctx.sendNotification("Successfully moved a message.");
  ctx.redirect(body.return || (DEV ? "/admin" : "/bored/admin"));
});
