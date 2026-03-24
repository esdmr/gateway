import * as v from "valibot";
import { db, NonEmptyString, RowId, sql, Timestamp } from "./index.ts";

export const WantedBy = v.enum({
  AUTHOR: 0,
  REMOTE_ADDRESS: 1,
  USER_AGENT: 2,
});
export type WantedBy = v.InferInput<typeof WantedBy>;

export const Behavior = v.enum({
  BLOCK: 0,
  QUARANTINE: 1,
});
export type Behavior = v.InferInput<typeof Behavior>;

export const Wanted = v.object({
  rowid: RowId,
  name: WantedBy,
  value: NonEmptyString,
  behavior: Behavior,
  trigger_count: v.pipe(v.number(), v.safeInteger(), v.minValue(0)),
  created_at: Timestamp,
  modified_at: Timestamp,
});
export type Wanted = v.InferInput<typeof Wanted>;

const sqlListWanted = db.prepare(sql`
  SELECT rowid, *
    FROM wanted
    ORDER BY rowid DESC
    LIMIT ? OFFSET ?;
`);

export function* listWanted({
  limit = 50,
  offset = 0,
}: {
  limit?: number;
  offset?: number;
} = {}) {
  yield* sqlListWanted.iterate(limit, offset) as Iterable<Wanted>;
}

const sqlInsertWanted = db.prepare(sql`
  INSERT INTO wanted (name, value, behavior, trigger_count)
    VALUES (?, ?, ?, ?)
    ON CONFLICT DO UPDATE
      SET behavior = ?, trigger_count = trigger_count + ?, modified_at = unixepoch();
`);

export function insertWanted(
  name: WantedBy,
  value: string,
  behavior: Behavior = Behavior.enum.BLOCK,
  triggerCount = 0,
) {
  return (
    sqlInsertWanted.run(
      name,
      value,
      behavior,
      triggerCount,
      behavior,
      triggerCount,
    ).lastInsertRowid > 0
  );
}

const sqlDeleteWanted = db.prepare(sql`
  DELETE FROM wanted
    WHERE rowid = ?;
`);

export function deleteWanted(rowid: number) {
  return sqlDeleteWanted.run(rowid).changes > 0;
}
