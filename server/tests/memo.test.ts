import { afterAll, beforeAll, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { connectDb, disconnectDb } from "../src/db.js";
import { Memo } from "../src/models/memo.js";

const owner = () => new mongoose.Types.ObjectId();

beforeAll(async () => {
  await connectDb();
  await mongoose.connection.dropDatabase();
  await Memo.createIndexes();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await disconnectDb();
});

describe("Memo model", () => {
  it("rejects a memo without a title", async () => {
    await expect(Memo.create({ owner: owner(), content: "hello" })).rejects.toThrow(/title/);
  });

  it("rejects permission admin and accepts read or write", async () => {
    const user = owner();
    await expect(
      Memo.create({ owner: owner(), title: "Shared", sharedWith: [{ user, permission: "admin" }] }),
    ).rejects.toThrow(/admin/);
    const read = await Memo.create({ owner: owner(), title: "Read", sharedWith: [{ user, permission: "read" }] });
    const write = await Memo.create({ owner: owner(), title: "Write", sharedWith: [{ user: owner(), permission: "write" }] });
    expect(read.sharedWith[0]?.permission).toBe("read");
    expect(write.sharedWith[0]?.permission).toBe("write");
  });

  it("updates updatedAt when content changes", async () => {
    const memo = await Memo.create({ owner: owner(), title: "Notes", content: "first" });
    const before = memo.updatedAt.getTime();
    await new Promise((resolve) => setTimeout(resolve, 20));
    memo.content = "second";
    await memo.save();
    expect(memo.updatedAt.getTime()).toBeGreaterThan(before);
  });

  it("sets createdAt so memos can be sorted by date created", async () => {
    const created = await Memo.create({ owner: owner(), title: "Dated", content: "body" });
    const found = await Memo.findById(created.id).sort({ createdAt: 1 });
    expect(found?.createdAt).toBeInstanceOf(Date);
  });

  it("indexes owner and sharedWith.user", () => {
    const paths = Memo.schema.indexes().map(([fields]) => fields);
    expect(paths).toEqual(expect.arrayContaining([{ "sharedWith.user": 1 }]));
    expect(Memo.schema.path("owner").options.index).toBe(true);
  });
});
