import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";
import { loadMemoWithAccess, type MemoNeed } from "../src/lib/memo-access.js";
import { connectDb, disconnectDb } from "../src/db.js";
import { Memo } from "../src/models/memo.js";

const id = () => new mongoose.Types.ObjectId().toString();

let memoId: string;
let ownerId: string;
let readId: string;
let writeId: string;
let outsiderId: string;

beforeAll(async () => {
  await connectDb();
  await mongoose.connection.dropDatabase();
  ownerId = id();
  readId = id();
  writeId = id();
  outsiderId = id();
  const memo = await Memo.create({
    owner: ownerId,
    title: "Shared memo",
    content: "body",
    sharedWith: [
      { user: readId, permission: "read" },
      { user: writeId, permission: "write" },
    ],
  });
  memoId = memo.id;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await disconnectDb();
});

afterEach(() => {
  vi.restoreAllMocks();
});

const needs: MemoNeed[] = ["read", "write", "owner"];

describe("loadMemoWithAccess", () => {
  it("returns the memo to the owner and a read recipient when need is read", async () => {
    const asOwner = await loadMemoWithAccess(memoId, ownerId, "read");
    const asReader = await loadMemoWithAccess(memoId, readId, "read");
    expect(asOwner.id).toBe(memoId);
    expect(asReader.id).toBe(memoId);
  });

  it("returns 404 for an outsider on every need without loading the memo", async () => {
    const findOne = vi.spyOn(Memo, "findOne");
    const findById = vi.spyOn(Memo, "findById");
    for (const need of needs) {
      findOne.mockClear();
      findById.mockClear();
      await expect(loadMemoWithAccess(memoId, outsiderId, need)).rejects.toMatchObject({ status: 404 });
      expect(findById).not.toHaveBeenCalled();
      expect(findOne).toHaveBeenCalledTimes(1);
      expect(findOne.mock.calls[0]?.[0]).toEqual({
        _id: memoId,
        $or: [{ owner: outsiderId }, { "sharedWith.user": outsiderId }],
      });
    }
  });

  it("returns 403 FORBIDDEN when a read recipient asks to write", async () => {
    await expect(loadMemoWithAccess(memoId, readId, "write")).rejects.toMatchObject({ status: 403, message: "FORBIDDEN" });
  });

  it("allows a write recipient to write and rejects need owner", async () => {
    const memo = await loadMemoWithAccess(memoId, writeId, "write");
    expect(memo.id).toBe(memoId);
    await expect(loadMemoWithAccess(memoId, writeId, "owner")).rejects.toMatchObject({ status: 403, message: "FORBIDDEN" });
  });

  it("allows the owner to write and to pass the owner check", async () => {
    expect((await loadMemoWithAccess(memoId, ownerId, "write")).id).toBe(memoId);
    expect((await loadMemoWithAccess(memoId, ownerId, "owner")).id).toBe(memoId);
  });

  it("covers owner, read, write and outsider for each need", async () => {
    const allow = async (userId: string, need: MemoNeed) => {
      expect((await loadMemoWithAccess(memoId, userId, need)).id).toBe(memoId);
    };
    const deny = async (userId: string, need: MemoNeed, status: number) => {
      await expect(loadMemoWithAccess(memoId, userId, need)).rejects.toMatchObject({ status });
    };

    await allow(ownerId, "read");
    await allow(ownerId, "write");
    await allow(ownerId, "owner");
    await allow(readId, "read");
    await deny(readId, "write", 403);
    await deny(readId, "owner", 403);
    await allow(writeId, "read");
    await allow(writeId, "write");
    await deny(writeId, "owner", 403);
    await deny(outsiderId, "read", 404);
    await deny(outsiderId, "write", 404);
    await deny(outsiderId, "owner", 404);
  });
});
