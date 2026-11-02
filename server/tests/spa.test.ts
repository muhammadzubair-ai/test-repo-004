import { execFileSync } from "node:child_process";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { createApp } from "../src/app.js";
import { connectDb, disconnectDb } from "../src/db.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

let base: string;
let close: () => Promise<void>;

beforeAll(async () => {
  execFileSync("pnpm", ["--filter", "@app/client", "build"], { cwd: root, stdio: "inherit" });
  await connectDb();
  await mongoose.connection.dropDatabase();
  const server = createApp().listen(0);
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  close = () => new Promise((resolve) => server.close(() => resolve()));
}, 120_000);

afterAll(async () => {
  await close();
  await mongoose.connection.dropDatabase();
  await disconnectDb();
});

describe("built SPA on the API origin", () => {
  it("returns the SPA html and the health JSON on the same port", async () => {
    const page = await fetch(`${base}/`);
    expect(page.status).toBe(200);
    expect(page.headers.get("content-type")).toMatch(/html/);
    expect(await page.text()).toContain('id="root"');

    const health = await fetch(`${base}/api/health`);
    expect(health.status).toBe(200);
    expect(health.headers.get("content-type")).toMatch(/json/);
    await expect(health.json()).resolves.toMatchObject({ status: "ok", database: "up" });
  });

  it("falls back to the SPA for client routes and keeps unknown API routes as JSON", async () => {
    const clientRoute = await fetch(`${base}/memos`);
    expect(clientRoute.status).toBe(200);
    expect(await clientRoute.text()).toContain('id="root"');

    const missing = await fetch(`${base}/api/not-a-route`);
    expect(missing.status).toBe(404);
    expect(missing.headers.get("content-type")).toMatch(/json/);
    await expect(missing.json()).resolves.toEqual({ error: "Not found" });
  });
});
