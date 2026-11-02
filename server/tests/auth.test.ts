import { afterAll, beforeAll, describe, expect, it } from "vitest";
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

  it("logs in with the right password and refuses the wrong one", async () => {
    const ok = await api.call("/api/auth/login", { body: { email: "ada@example.com", password: ada.password } });
    expect(ok.status).toBe(200);
    const bad = await api.call("/api/auth/login", { body: { email: "ada@example.com", password: "wrong password" } });
    expect(bad.status).toBe(401);
  });

  it("returns the signed-in user from /me and refuses a missing or bad token", async () => {
    const { body } = await api.call("/api/auth/login", { body: { email: "ada@example.com", password: ada.password } });
    const me = await api.call("/api/auth/me", { token: body.token });
    expect(me.body.user.email).toBe("ada@example.com");
    expect((await api.call("/api/auth/me")).status).toBe(401);
    expect((await api.call("/api/auth/me", { token: "garbage" })).status).toBe(401);
  });
});
