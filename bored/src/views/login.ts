import Router from "@koa/router";

export default new Router().post("/", async (ctx) => {
  let body = ctx.request.body as Record<string, any> | null | undefined;

  if (typeof body !== "object" || !body) {
    body = {};
  }

  if (typeof body.key !== "string") {
    ctx.status = 400;
    await ctx.render("error-csrf.pug");
    return;
  }

  if (!ctx.checkAdminKey(body.key)) {
    ctx.status = 403;
    await ctx.render("error-403.pug");
    return;
  }

  ctx.session.admin = true;
  ctx.sendNotification("You’ve logged in.");
  ctx.back(ctx.BASEURL);
});
