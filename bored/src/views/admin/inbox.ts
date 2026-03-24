import Router from "@koa/router";
import { Directory, listMessages } from "../../models/messages.ts";

export default new Router().get("/", (ctx) => {
  return ctx.render("inbox.pug", {
    messages: listMessages(Directory.enum.INBOX),
  });
});
