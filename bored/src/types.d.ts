declare module "@koa/access-log" {
  import { type Middleware } from "koa";
  function accessLog(stream?: WritableStream): Middleware;
  export default accessLog;
}

declare module "koa-csrf" {
  module "koa" {
    interface DefaultState {
      _csrf: string;
    }
  }

  import { Context, Middleware } from "koa";

  const csrf: (opts?: {
    [x: string]: unknown;
    errorHandler?(ctx: Context): any;
    excludedMethods?: string[];
    disableQuery?: boolean;
    ignoredPathGlobs?: unknown[];
  }) => Middleware;

  export default csrf;
}

declare module "koa-session-jwt/es/index.js" {
  module "koa" {
    interface BaseContext {
      session: Record<string, unknown>;
    }
  }

  import { Middleware } from "koa";

  const koaSessionJwt: (
    secret: string,
    opts?: {
      expiresIn?: string;
      cookie?: string;
    },
  ) => Middleware;

  export default koaSessionJwt;
}
