import { describe, expect, it } from "vitest";
import { checkHealth } from "../src/lib/health.js";

describe("checkHealth", () => {
  const now = new Date("2026-01-01T00:00:00Z");

  it("reports ok when the database answers", async () => {
    expect(await checkHealth(async () => {}, now)).toEqual({ status: "ok", database: "up", checkedAt: now.toISOString() });
  });

  it("reports degraded when the database does not answer", async () => {
    const down = async () => {
      throw new Error("refused");
    };
    expect(await checkHealth(down, now)).toEqual({ status: "degraded", database: "down", checkedAt: now.toISOString() });
  });
});
