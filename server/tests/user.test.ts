import { afterAll, beforeAll, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { connectDb, disconnectDb } from "../src/db.js";
import { User } from "../src/models/user.js";

const questions = (count: number) =>
  Array.from({ length: count }, (_, index) => ({ question: `q${index}`, answerHash: `h${index}` }));

const user = (overrides: Record<string, unknown> = {}) => ({
  name: "Ann",
  username: "ann",
  email: "ann@example.com",
  passwordHash: "hash",
  securityQuestions: questions(4),
  ...overrides,
});

beforeAll(async () => {
  await connectDb();
  await mongoose.connection.dropDatabase();
  await User.createIndexes();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await disconnectDb();
});

describe("User model", () => {
  it("rejects a second user with the same username on the unique index", async () => {
    await User.create(user());
    await expect(User.create(user({ email: "other@example.com" }))).rejects.toMatchObject({ code: 11000 });
  });

  it("rejects a second user with the same email on the unique index", async () => {
    await User.create(user({ username: "ada", email: "ada@example.com" }));
    await expect(User.create(user({ username: "ada2", email: "ada@example.com" }))).rejects.toMatchObject({ code: 11000 });
  });

  it("rejects 3 security questions and accepts exactly 4", async () => {
    await expect(User.create(user({ username: "bee", email: "bee@example.com", securityQuestions: questions(3) }))).rejects.toThrow(
      /exactly 4 entries/,
    );
    const saved = await User.create(user({ username: "bee", email: "bee@example.com", securityQuestions: questions(4) }));
    expect(saved.securityQuestions).toHaveLength(4);
  });

  it("sets createdAt when a valid user is read back", async () => {
    const created = await User.create(user({ username: "cy", email: "cy@example.com" }));
    const found = await User.findById(created.id);
    expect(found?.createdAt).toBeInstanceOf(Date);
  });
});
