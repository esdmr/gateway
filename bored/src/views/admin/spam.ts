import Router from "@koa/router";
import { Directory, listMessages } from "../../models/messages.ts";

export default new Router().get("/", (ctx) => {
  return ctx.render("spam.pug", {
    messages: listMessages(Directory.enum.SPAM),
  });
});
