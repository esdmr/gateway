import Router from "@koa/router";
import { listWanted } from "../../models/wanted.ts";

export default new Router().get("/", (ctx) => {
  return ctx.render("wanted.pug", {
    wanted: listWanted(),
  });
});
