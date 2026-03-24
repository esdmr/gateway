import Router from "@koa/router";
import * as v from "valibot";
import { getMessage } from "../../models/messages.ts";
import { Behavior, insertWanted, WantedBy } from "../../models/wanted.ts";
import { DEV } from "../compose.ts";

const plural = new Intl.PluralRules("en");

export default new Router()
  .get("/", (ctx) => {
    const mid = ctx.query.mid;
    const message =
      typeof mid === "string" ? getMessage(Number(mid)) : undefined;
    return ctx.render("block.pug", { message, returnPath: ctx.query.return });
  })
  .post("/", (ctx) => {
    let body = ctx.request.body as Record<string, any> | null | undefined;

    if (typeof body !== "object" || !body) {
      body = {};
    }

    const behavior = v.safeParse(Behavior, Number(body.behavior));

    if (!behavior.typed) {
      ctx.status = 400;
      return ctx.render("error-csrf.pug");
    }

    let n = 0;

    if (typeof body.author === "string" && body.author) {
      if (insertWanted(WantedBy.enum.AUTHOR, body.author, behavior.output)) n++;
    }

    if (typeof body.remote_address === "string" && body.remote_address) {
      if (
        insertWanted(
          WantedBy.enum.REMOTE_ADDRESS,
          body.remote_address,
          behavior.output,
        )
      )
        n++;
    }

    if (typeof body.user_agent === "string" && body.user_agent) {
      if (
        insertWanted(WantedBy.enum.USER_AGENT, body.user_agent, behavior.output)
      )
        n++;
    }

    ctx.sendNotification(
      `Added ${n} ${plural.select(n) === "one" ? "item" : "items"} to the wanted list.`,
    );
    ctx.redirect(body.return || (DEV ? "/admin" : "/bored/admin"));
  });
