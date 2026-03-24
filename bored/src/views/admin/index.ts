import Router from "@koa/router";
import block from './block.ts';
import delete_ from './delete.ts';
import inbox from './inbox.ts';
import move from './move.ts';
import redact from './redact.ts';
import spam from './spam.ts';
import unblock from './unblock.ts';
import wanted from './wanted.ts';

export default new Router()
  .get("/", (ctx) => {
    return ctx.render("admin.pug");
  })
  .use("/block", block.routes())
  .use("/delete", delete_.routes())
  .use("/inbox", inbox.routes())
  .use("/move", move.routes())
  .use("/redact", redact.routes())
  .use("/spam", spam.routes())
  .use("/unblock", unblock.routes())
  .use("/wanted", wanted.routes());
