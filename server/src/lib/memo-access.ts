import { isValidObjectId } from "mongoose";
import { HttpError } from "./http-error.js";
import { Memo, type MemoDoc } from "../models/memo.js";

export type MemoNeed = "read" | "write" | "owner";

/** Loads a memo the caller may access. Inaccessible memos are excluded by the query, so they are never loaded. */
export async function loadMemoWithAccess(memoId: string, userId: string, need: MemoNeed): Promise<MemoDoc> {
  if (!isValidObjectId(memoId) || !isValidObjectId(userId)) throw new HttpError(404, "Not found");

  const memo = await Memo.findOne({
    _id: memoId,
    $or: [{ owner: userId }, { "sharedWith.user": userId }],
  });
  if (!memo) throw new HttpError(404, "Not found");

  if (need === "read") return memo;

  const isOwner = String(memo.owner) === String(userId);
  if (need === "owner") {
    if (!isOwner) throw new HttpError(403, "FORBIDDEN");
    return memo;
  }

  const canWrite =
    isOwner || memo.sharedWith.some((entry) => String(entry.user) === String(userId) && entry.permission === "write");
  if (!canWrite) throw new HttpError(403, "FORBIDDEN");
  return memo;
}
