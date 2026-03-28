/**
 * This is a combination of `koa-partial-content` and `@koa/send`.
 */

import { send } from "@koa/send";
import createError from "http-errors";
import type { Context, ParameterizedContext } from "koa";
import fs, { Stats } from "node:fs";
import { access, stat } from "node:fs/promises";
import path from "node:path";
import safeResolvePath from "resolve-path";

const rangeRe = /^bytes=(?:(?<start>\d+)-(?<end>\d+)?|-(?<length>\d+))$/;

type SetHeaders = (
  res: ParameterizedContext["res"],
  path: string,
  stats: Stats,
) => void;

type SendOptions = {
  root?: string;
  index?: string | false;
  maxage?: number;
  maxAge?: SendOptions["maxage"];
  immutable?: boolean;
  hidden?: boolean;
  format?: boolean;
  setHeaders?: SetHeaders;
  extensions?: string[] | false;
};

async function isPathExists(targetPath: string) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function isPathHidden(root: string, targetPath: string) {
  const pathParts = targetPath.slice(root.length).split(path.sep);

  for (const part of pathParts) {
    if (part.at(0) === ".") return true;
  }

  return false;
}

function getFileType(file: string, ext: string) {
  if (ext !== "") return path.extname(path.basename(file, ext));

  return path.extname(file);
}

export async function partialSend(
  ctx: Context,
  filePath: string,
  opts: SendOptions,
) {
  if (!ctx) throw new Error("koa context required");
  if (!filePath) throw new Error("file pathname required");

  const range = ctx.get("Range");
  let match;

  if (!(match = rangeRe.exec(range))) {
    return send(ctx, filePath, opts);
  }

  const start = match.groups!.start;
  const end = match.groups!.end;
  const length = match.groups!.length;

  const root = opts.root ? path.resolve(opts.root) : "";
  const trailingSlash = filePath.at(-1) === "/";

  filePath = filePath.slice(path.parse(filePath).root.length);

  const { index } = opts;
  const maxAge = opts.maxage || opts.maxAge || 0;
  const immutable = opts.immutable || false;
  const hidden = opts.hidden || false;
  const format = opts.format !== false;
  const extensions = Array.isArray(opts.extensions) ? opts.extensions : false;
  const { setHeaders } = opts;

  if (setHeaders && typeof setHeaders !== "function")
    throw new TypeError("option setHeaders must be function");

  try {
    filePath = decodeURIComponent(filePath);
  } catch {
    ctx.throw(400, "failed to decode");
  }

  if (index && trailingSlash) filePath += index;

  filePath = safeResolvePath(root, filePath);

  if (!hidden && isPathHidden(root, filePath)) return;

  if (extensions && !path.basename(filePath).includes(".")) {
    for (let ext of extensions) {
      if (typeof ext !== "string")
        throw new TypeError(
          "option extensions must be array of strings or false",
        );

      if (!ext.startsWith(".")) ext = `.${ext}`;

      if (await isPathExists(`${filePath}${ext}`)) {
        filePath = `${filePath}${ext}`;
        break;
      }
    }
  }

  let stats;

  try {
    stats = await stat(filePath);

    if (stats.isDirectory()) {
      if (!format || !index) return;

      filePath += `/${index}`;
      stats = await stat(filePath);
    }
  } catch (err) {
    if (typeof err === "object" && err && "code" in err && "status" in err) {
      const notfound = ["ENOENT", "ENAMETOOLONG", "ENOTDIR"];

      if (notfound.includes(err.code as any)) throw createError(404, err);

      err.status = 500;
    }

    throw err;
  }

  const ifRange = ctx.get("if-range");

  if (ifRange && ifRange !== stats.mtime.toUTCString()) {
    return send(ctx, filePath, opts);
  }

  let startByte;
  let endByte;

  if (length) {
    startByte = stats.size - +length;
    endByte = stats.size - 1;
  } else {
    startByte = +start;
    endByte = end ? +end : stats.size - 1;
  }

  if (
    !Number.isSafeInteger(startByte) ||
    !Number.isSafeInteger(endByte) ||
    startByte < 0 ||
    endByte < startByte ||
    stats.size <= startByte ||
    stats.size <= endByte
  ) {
    ctx.set("Content-Range", `bytes */${stats.size}`);
    throw createError(416, "Range Not Satisfiable");
  }

  setHeaders?.(ctx.res, filePath, stats);
  ctx.set("Content-Range", `bytes ${startByte}-${endByte}/${stats.size}`);
  ctx.set("Content-Length", endByte - startByte + 1 + "");

  if (!ctx.response.get("Last-Modified"))
    ctx.set("Last-Modified", stats.mtime.toUTCString());

  if (!ctx.response.get("Cache-Control")) {
    const directives = [`max-age=${(maxAge / 1e3) | 0}`];

    if (immutable) directives.push("immutable");

    ctx.set("Cache-Control", directives.join(","));
  }

  if (!ctx.type) ctx.type = path.extname(filePath);

  ctx.status = 206;
  ctx.body = fs.createReadStream(filePath, { start: startByte, end: endByte });

  return filePath;
}
