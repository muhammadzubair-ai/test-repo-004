import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startTestServer } from "./helpers.js";

let api: Awaited<ReturnType<typeof startTestServer>>;
let ada: string;
let grace: string;

beforeAll(async () => {
  api = await startTestServer();
  ada = (await api.call("/api/auth/register", { body: { name: "Ada", email: "ada@example.com", password: "correct horse" } })).body.token;
  grace = (await api.call("/api/auth/register", { body: { name: "Grace", email: "grace@example.com", password: "correct horse" } })).body.token;
});
afterAll(() => api.stop());

describe("notes", () => {
  it("needs a token", async () => {
    expect((await api.call("/api/notes")).status).toBe(401);
  });

  it("creates and lists a user's own notes only", async () => {
    const created = await api.call("/api/notes", { token: ada, body: { title: "First", body: "hello" } });
    expect(created.status).toBe(201);
    expect((await api.call("/api/notes", { token: ada })).body.notes).toHaveLength(1);
    expect((await api.call("/api/notes", { token: grace })).body.notes).toHaveLength(0);
  });

  it("deletes only the owner's note", async () => {
    const { body } = await api.call("/api/notes", { token: ada, body: { title: "Second" } });
    const id = body.note.id as string;
    expect((await api.call(`/api/notes/${id}`, { token: grace, method: "DELETE" })).status).toBe(404);
    expect((await api.call(`/api/notes/${id}`, { token: ada, method: "DELETE" })).status).toBe(204);
  });

  it("rejects an empty title", async () => {
    expect((await api.call("/api/notes", { token: ada, body: { title: " " } })).status).toBe(400);
  });
});
