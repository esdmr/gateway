import accessLog from "@koa/access-log";
import bodyParser from "@koa/bodyparser";
import { send } from "@koa/send";
import Koa from "koa";
import csrf from "koa-csrf";
import helmet from "koa-helmet";
import KoaPug from "koa-pug";
import session from "koa-session-jwt/es/index.js";
import { timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { formatSize } from "./size.ts";
import views from "./views/index.ts";

const PORT = Number(process.env.PORT) || 9075;

const DEV = process.env.NODE_ENV === "development";

const BASEURL = DEV
  ? "/"
  : process.env.BASEURL?.endsWith("/")
    ? process.env.BASEURL
    : (process.env.BASEURL ?? "") + "/";

const secKey = process.env.SECKEY_FILE
  ? readFileSync(process.env.SECKEY_FILE, "utf8").trim()
  : process.env.SECKEY;

if (!secKey) throw new Error("Missing sec key");

const accessKey = process.env.ACCESSKEY_FILE
  ? readFileSync(process.env.ACCESSKEY_FILE, "utf8").trim()
  : process.env.ACCESSKEY;

if (!accessKey) throw new Error("Missing access key");

const accessKeyBuffer = Buffer.from(accessKey);

const adminKey = process.env.ADMINKEY_FILE
  ? readFileSync(process.env.ADMINKEY_FILE, "utf8").trim()
  : process.env.ADMINKEY;

if (!adminKey) throw new Error("Missing admin key");

const adminKeyBuffer = Buffer.from(adminKey);

const app = new Koa({ proxy: !DEV, proxyIpHeader: "x-real-ip" });

new KoaPug.default({
  viewPath: fileURLToPath(new URL("templates", import.meta.url)),
  locals: {
    DEV,
    BASEURL,
    accessKey,
    homepage:
      BASEURL + "?" + new URLSearchParams({ key: accessKey }).toString(),
    formatSize,
  },
}).use(app);

declare module "koa" {
  interface BaseContext {
    DEV: boolean;
    BASEURL: string;
    accessKey: string;
    homepage: string;
    checkAccessKey(key: string): boolean;
    checkAdminKey(key: string): boolean;
    getNotifications(): string[];
    sendNotification(message: string): boolean;
  }
}

app.context.checkAccessKey = function (key) {
  const buffer = Buffer.from(key);
  const accessBuffer = Buffer.alloc(buffer.length);

  for (let i = 0; i < buffer.length; i++) {
    accessBuffer[i] = accessKeyBuffer[i % accessKeyBuffer.length];
  }

  return (
    timingSafeEqual(buffer, accessBuffer) && key.length === accessKey.length
  );
};

app.context.checkAdminKey = function (key) {
  const buffer = Buffer.from(key);
  const adminBuffer = Buffer.alloc(buffer.length);

  for (let i = 0; i < buffer.length; i++) {
    adminBuffer[i] = adminKeyBuffer[i % adminKeyBuffer.length];
  }

  return timingSafeEqual(buffer, adminBuffer) && key.length === adminKey.length;
};

app.context.getNotifications = function () {
  if (!this.session) return [];
  const notifications = this.session.notifications;
  delete this.session.notifications;
  return Array.isArray(notifications)
    ? notifications.filter((i) => typeof i === "string")
    : [];
};

app.context.sendNotification = function (message: string) {
  if (!this.session) return false;

  if (Array.isArray(this.session.notifications)) {
    this.session.notifications.push(message);
  } else {
    this.session.notifications = [message];
  }

  return true;
};

app.context.DEV = DEV;
app.context.BASEURL = BASEURL;
app.context.accessKey = accessKey;
app.context.homepage =
  BASEURL + "?" + new URLSearchParams({ key: accessKey }).toString();

app
  .use(accessLog())
  .use(helmet())
  .use(
    session(secKey, {
      cookie: "dlulu-session",
    }),
  )
  .use(
    bodyParser({
      enableTypes: ["form"],
    }),
  )
  .use((ctx, next) => {
    ctx.state.getNotifications = () => ctx.getNotifications();
    ctx.state.admin = Boolean(ctx.session?.admin);
    ctx.state.path =
      BASEURL +
      (ctx.path.startsWith("/") ? ctx.path.slice(1) : ctx.path) +
      "?" +
      new URLSearchParams({ key: accessKey }).toString();
    return next();
  })
  .use(
    csrf({
      async errorHandler(ctx) {
        ctx.status = 400;
        await ctx.render("error-csrf.pug");
      },
    }),
  )
  .use(views.routes())
  .use(async (ctx) => {
    if (ctx.routeMatched) return;

    if (DEV) {
      try {
        await send(ctx, ctx.path, {
          root: fileURLToPath(new URL("../../public", import.meta.url)),
          gzip: false,
          brotli: false,
        });

        return;
      } catch {
        // Fallthrough.
      }
    }

    ctx.status = 404;
    await ctx.render("error-404.pug");
  })
  .listen(PORT)
  .on("listening", () => {
    console.log(`Listening at http://localhost:${PORT}.`);
  });
