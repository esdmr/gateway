import Router from "@koa/router";
import { Directory, listMessages, Privacy } from "../models/messages.ts";
import { roundTimestampToDay } from "../timestamp.ts";
import admin from "./admin/index.ts";
import assets from "./assets.ts";
import compose from "./compose.ts";
import login from "./login.ts";

export default new Router()
  .get("/", async (ctx) => {
    await ctx.render("index.pug", {
      messages: ctx.session.admin
        ? listMessages(Directory.enum.BORED)
        : listMessages(Directory.enum.BORED, {
            privacyThreshold: Privacy.enum.ANONYMOUS,
          }).map((i) => {
            if (i.privacy >= Privacy.enum.ANONYMOUS) {
              i.author = "";
            }

            i.rowid = 0;
            i.remote_address = "";
            i.user_agent = "";
            i.modified_at = 0;
            i.created_at = roundTimestampToDay(i.created_at);
            return i;
          }),
    });
  })
  .use("/assets", assets.routes())
  // For development:
  .use("/bored/assets", assets.routes())
  .use("/compose", compose.routes())
  .use("/login", login.routes())
  .use(
    "/admin",
    (ctx, next) => {
      if (!ctx.session?.admin) {
        ctx.status = 401;
        return ctx.render("error-401.pug");
      }

      return next();
    },
    admin.routes(),
  );
