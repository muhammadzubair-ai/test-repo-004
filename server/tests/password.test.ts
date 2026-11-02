import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { User } from "../src/models/user.js";
import { startTestServer } from "./helpers.js";

let api: Awaited<ReturnType<typeof startTestServer>>;
beforeAll(async () => {
  api = await startTestServer();
});
afterAll(() => api.stop());

async function register(email: string) {
  const body = { name: "Ada", email, password: "correct horse" };
  const res = await api.call("/api/auth/register", { body });
  expect(res.status).toBe(201);
  return { ...body, token: res.body.token as string };
}

describe("PUT /api/users/me/password", () => {
  it("replaces the password so only the new one can log in", async () => {
    const ada = await register("ada@example.com");
    const changed = await api.call("/api/users/me/password", {
      method: "PUT",
      token: ada.token,
      body: { oldPassword: ada.password, newPassword: "a brand new secret" },
    });
    expect(changed.status).toBe(204);

    const oldLogin = await api.call("/api/auth/login", { body: { email: ada.email, password: ada.password } });
    const newLogin = await api.call("/api/auth/login", { body: { email: ada.email, password: "a brand new secret" } });
    expect(oldLogin.status).toBe(401);
    expect(newLogin.status).toBe(200);
    expect(newLogin.body.token).toEqual(expect.any(String));
  });

  it("returns 401 OLD_PASSWORD_INVALID and leaves passwordHash unchanged", async () => {
    const ada = await register("bea@example.com");
    const before = await User.findOne({ email: ada.email }).select("+passwordHash");
    const res = await api.call("/api/users/me/password", {
      method: "PUT",
      token: ada.token,
      body: { oldPassword: "wrong password", newPassword: "a brand new secret" },
    });
    const after = await User.findOne({ email: ada.email }).select("+passwordHash");
    expect(res).toEqual({ status: 401, body: { error: "OLD_PASSWORD_INVALID" } });
    expect(after?.passwordHash).toBe(before?.passwordHash);
    expect(after?.passwordHash).not.toBe("wrong password");
  });
});
