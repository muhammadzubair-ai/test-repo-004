import type { AddressInfo } from "node:net";
import mongoose from "mongoose";
import { createApp } from "../src/app.js";
import { connectDb, disconnectDb } from "../src/db.js";

/** Connects to the test database, empties it and serves the app on a free port. */
export async function startTestServer() {
  await connectDb();
  await mongoose.connection.dropDatabase();
  const server = createApp().listen(0);
  const base = `http://localhost:${(server.address() as AddressInfo).port}`;

  async function call(path: string, init: { method?: string; token?: string; body?: unknown } = {}) {
    const res = await fetch(base + path, {
      method: init.method ?? (init.body ? "POST" : "GET"),
      headers: {
        ...(init.body ? { "content-type": "application/json" } : {}),
        ...(init.token ? { authorization: `Bearer ${init.token}` } : {}),
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
    });
    const text = await res.text();
    return { status: res.status, body: text ? (JSON.parse(text) as Record<string, any>) : {} };
  }

  async function stop() {
    await new Promise((resolve) => server.close(resolve));
    await mongoose.connection.dropDatabase();
    await disconnectDb();
  }

  return { call, stop };
}
