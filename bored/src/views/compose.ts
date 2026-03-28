import Router from "@koa/router";
import * as v from "valibot";
import {
  insertMessage,
  MessageInit,
  type Privacy,
} from "../models/messages.ts";

export default new Router().post("/", async (ctx) => {
  let body = ctx.request.body as Record<string, any> | null | undefined;

  if (typeof body !== "object" || !body) {
    body = {};
  }

  const message = v.safeParse(MessageInit, {
    author: body.author,
    remote_address: ctx.get('X-Real-IP') || ctx.request.socket.remoteAddress || "0.0.0.0",
    user_agent: ctx.request.headers["user-agent"] || "Empty",
    body: body.body,
    privacy: Number(body.privacy) as Privacy,
  } satisfies MessageInit);

  if (!message.typed) {
    ctx.status = 400;
    await ctx.render("error-csrf.pug");
    return;
  }

  ctx.sendNotification(
    insertMessage(message.output)
      ? "Successfully drafted a message. It will be shown after a moderator approves it."
      : "You aren’t allowed to draft messages. Please go away.",
  );
  ctx.back(ctx.BASEURL);
});
