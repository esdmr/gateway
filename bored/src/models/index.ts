import { readFileSync } from "node:fs";
import process from "node:process";
import { DatabaseSync } from "node:sqlite";
import * as v from "valibot";

const initSql = readFileSync(new URL("init.sql", import.meta.url), "utf8");

const DB_PATH =
  process.env.DB_PATH ?? new URL("../../bored.db", import.meta.url);
export const db = new DatabaseSync(DB_PATH);

db.exec(initSql);

export const sql = (template: TemplateStringsArray, ...args: any[]) =>
  String.raw({ raw: template }, ...args);

export const RowId = v.pipe(
  v.number(),
  v.integer(),
  v.minValue(1),
  v.maxValue(2 ** 31 - 1),
);
export type RowId = v.InferInput<typeof RowId>;

export const Timestamp = v.number();
export type Timestamp = v.InferInput<typeof Timestamp>;

export const NonEmptyString = v.pipe(v.string(), v.nonEmpty());
export type NonEmptyString = v.InferInput<typeof NonEmptyString>;

export const Boolean01 = v.picklist([0, 1]);
export type Boolean01 = v.InferInput<typeof Boolean01>;
