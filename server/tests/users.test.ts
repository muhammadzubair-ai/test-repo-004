import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { signToken } from "../src/lib/token.js";
import { User } from "../src/models/user.js";
import { startTestServer } from "./helpers.js";

let api: Awaited<ReturnType<typeof startTestServer>>;
beforeAll(async () => {
  api = await startTestServer();
});
afterAll(() => api.stop());

describe("GET /api/users/me", () => {
  it("returns username, email and createdAt from the user record", async () => {
    const created = await User.create({
      name: "Ada",
      username: "ada",
      email: "ada@example.com",
      passwordHash: "not-used",
    });
    const token = await signToken(created.id);
    const res = await api.call("/api/users/me", { token });
    const stored = await User.findById(created.id);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      username: "ada",
      email: "ada@example.com",
      createdAt: stored?.createdAt.toISOString(),
    });
  });

  it("returns 401 when no token is sent", async () => {
    expect((await api.call("/api/users/me")).status).toBe(401);
  });
});
