import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hashPassword } from "../src/lib/password.js";
import { verifyToken } from "../src/lib/token.js";
import { User } from "../src/models/user.js";
import { startTestServer } from "./helpers.js";

let api: Awaited<ReturnType<typeof startTestServer>>;
beforeAll(async () => {
  api = await startTestServer();
});
afterAll(() => api.stop());

const ada = { name: "Ada", email: "Ada@Example.com", password: "correct horse" };

describe("auth", () => {
  it("registers a user and returns a token", async () => {
    const res = await api.call("/api/auth/register", { body: ada });
    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ name: "Ada", email: "ada@example.com" });
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("refuses a second registration with the same email", async () => {
    expect((await api.call("/api/auth/register", { body: ada })).status).toBe(409);
  });

  it("rejects invalid input", async () => {
    const res = await api.call("/api/auth/register", { body: { name: "", email: "nope", password: "short" } });
    expect(res.status).toBe(400);
  });

  it("logs in with an email identifier and returns the user and a JWT", async () => {
    const ok = await api.call("/api/auth/login", { body: { identifier: "Ada@Example.com", password: ada.password } });
    expect(ok.status).toBe(200);
    expect(ok.body.token).toEqual(expect.any(String));
    expect(ok.body.user).toEqual({ id: expect.any(String), username: null, email: "ada@example.com" });
    expect(await verifyToken(ok.body.token)).toBe(ok.body.user.id);
  });

  it("logs in with a username identifier and returns a JWT", async () => {
    await User.create({
      name: "Grace",
      username: "grace",
      email: "grace@example.com",
      passwordHash: await hashPassword(ada.password),
    });
    const ok = await api.call("/api/auth/login", { body: { identifier: "grace", password: ada.password } });
    expect(ok.status).toBe(200);
    expect(ok.body.token).toEqual(expect.any(String));
    expect(ok.body.user).toMatchObject({ username: "grace", email: "grace@example.com" });
    expect(await verifyToken(ok.body.token)).toBe(ok.body.user.id);
  });

  it("returns the same 401 INVALID_CREDENTIALS for an unknown identifier and a wrong password", async () => {
    const unknown = await api.call("/api/auth/login", { body: { identifier: "missing@example.com", password: ada.password } });
    const wrongEmail = await api.call("/api/auth/login", { body: { identifier: "ada@example.com", password: "wrong password" } });
    const wrongUsername = await api.call("/api/auth/login", { body: { identifier: "grace", password: "wrong password" } });
    const unknownName = await api.call("/api/auth/login", { body: { identifier: "nobody", password: "wrong password" } });
    expect(unknown).toEqual({ status: 401, body: { error: "INVALID_CREDENTIALS" } });
    expect(wrongEmail).toEqual(unknown);
    expect(wrongUsername).toEqual(unknown);
    expect(unknownName).toEqual(unknown);
  });

  it("returns the signed-in user from /me and refuses a missing or bad token", async () => {
    const { body } = await api.call("/api/auth/login", { body: { identifier: "ada@example.com", password: ada.password } });
    const me = await api.call("/api/auth/me", { token: body.token });
    expect(me.body.user.email).toBe("ada@example.com");
    expect((await api.call("/api/auth/me")).status).toBe(401);
    expect((await api.call("/api/auth/me", { token: "garbage" })).status).toBe(401);
  });
});
