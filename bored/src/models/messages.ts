import * as v from "valibot";
import {
  Boolean01,
  db,
  NonEmptyString,
  RowId,
  sql,
  Timestamp,
} from "./index.ts";
import { Behavior, WantedBy } from "./wanted.ts";

export const Directory = v.enum({
  INBOX: 0,
  BORED: 1,
  SPAM: 2,
});
export type Directory = v.InferInput<typeof Directory>;

export const Privacy = v.enum({
  PUBLIC: 0,
  ANONYMOUS: 1,
  PRIVATE: 2,
});
export type Privacy = v.InferInput<typeof Privacy>;

export const MessageInit = v.object({
  author: NonEmptyString,
  remote_address: NonEmptyString,
  user_agent: NonEmptyString,
  body: NonEmptyString,
  privacy: Privacy,
});
export type MessageInit = v.InferInput<typeof MessageInit>;

export const Message = v.object({
  rowid: RowId,
  directory: Directory,
  ...MessageInit.entries,
  is_redacted: Boolean01,
  created_at: Timestamp,
  modified_at: Timestamp,
});
export type Message = v.InferInput<typeof Message>;

export const sqlListMessages = db.prepare(sql`
  SELECT rowid, *
    FROM messages
    WHERE directory = ? AND privacy <= ?
    ORDER BY rowid DESC
    LIMIT ? OFFSET ?;
`);

export function* listMessages(
  directory: Directory,
  {
    privacyThreshold = Privacy.enum.PRIVATE,
    limit = 50,
    offset = 0,
  }: {
    privacyThreshold?: Privacy;
    limit?: number;
    offset?: number;
  } = {},
) {
  yield* sqlListMessages.iterate(
    directory,
    privacyThreshold,
    limit,
    offset,
  ) as Iterable<Message>;
}

const sqlTriggerWanted = db.prepare(sql`
  UPDATE wanted
    SET trigger_count = trigger_count + 1, modified_at = unixepoch()
    WHERE (name = ${WantedBy.enum.AUTHOR} AND value = ?)
      OR (name = ${WantedBy.enum.REMOTE_ADDRESS} AND value = ?)
      OR (name = ${WantedBy.enum.USER_AGENT} AND value = ?)
    RETURNING behavior;
`);

function getDefaultDirectory(
  message: Pick<MessageInit, "author" | "remote_address" | "user_agent">,
) {
  const wanted = sqlTriggerWanted.all(
    message.author,
    message.remote_address,
    message.user_agent,
  ) as { behavior: Behavior }[];

  if (wanted.some((i) => i.behavior === Behavior.enum.BLOCK)) return undefined;
  if (wanted.length > 0) return Directory.enum.SPAM;
  return Directory.enum.INBOX;
}

const sqlInsertMessage = db.prepare(sql`
  INSERT INTO messages (directory, author, remote_address, user_agent, body, privacy)
    VALUES (?, ?, ?, ?, ?, ?);
`);

export function insertMessage(message: MessageInit) {
  const directory = getDefaultDirectory(message);
  if (directory === undefined) return false;

  sqlInsertMessage.run(
    directory,
    message.author,
    message.remote_address,
    message.user_agent,
    message.body,
    message.privacy,
  );

  return true;
}

const sqlGetMessage = db.prepare(sql`
  SELECT rowid, *
    FROM messages
    WHERE rowid = ?;
`);

export function getMessage(rowid: number) {
  return sqlGetMessage.get(rowid) as Message | undefined;
}

const sqlDeleteMessage = db.prepare(sql`
  DELETE FROM messages
    WHERE rowid = ?;
`);

export function deleteMessage(rowid: number) {
  return sqlDeleteMessage.run(rowid).changes > 0;
}

const sqlMoveMessage = db.prepare(sql`
  UPDATE messages
    SET directory = ?, modified_at = unixepoch()
    WHERE rowid = ?;
`);

export function moveMessage(rowid: number, directory: Directory) {
  return sqlMoveMessage.run(directory, rowid).changes > 0;
}

const sqlRedactMessage = db.prepare(sql`
  UPDATE messages
    SET author = ?, body = ?, is_redacted = 1, modified_at = unixepoch()
    WHERE rowid = ?;
`);

export function redactMessage(rowid: number, author: string, body: string) {
  return sqlRedactMessage.run(author, body, rowid).changes > 0;
}

const sqlPurgeMessage = db.prepare(sql`
  DELETE FROM messages
    WHERE author = ? OR remote_address = ? OR user_agent = ?;
`);

export function purgeMessage(message: {
  author?: string | null | undefined;
  remote_address?: string | null | undefined;
  user_agent?: string | null | undefined;
}) {
  return sqlPurgeMessage.run(
    message.author ?? null,
    message.remote_address ?? null,
    message.user_agent ?? null,
  ).changes;
}
