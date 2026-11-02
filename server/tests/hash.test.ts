import { describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import { readEnv } from "../src/env.js";
import { hashPassword, hashSecret } from "../src/lib/password.js";

const valid = { JWT_SECRET: "test-secret-test-secret" };

describe("BCRYPT_ROUNDS", () => {
  it("refuses to start when the cost is below 10", () => {
    expect(() => readEnv({ ...valid, BCRYPT_ROUNDS: "9" })).toThrow(/at least 10/);
  });

  it("defaults to 12 when BCRYPT_ROUNDS is unset", () => {
    expect(readEnv(valid).BCRYPT_ROUNDS).toBe(12);
  });
});

describe("hashSecret", () => {
  it("hashes with cost 12 and verifies with bcrypt compare when rounds are unset", async () => {
    const hash = await hashPassword("correct horse");
    expect(hash.split("$")[2]).toBe("12");
    expect(await bcrypt.compare("correct horse", hash)).toBe(true);
  });

  it("stores a security answer as an answerHash, not the plaintext", async () => {
    const answer = "blue bicycle";
    const answerHash = await hashSecret(answer);
    expect(answerHash).not.toBe(answer);
    expect(answerHash.split("$")[2]).toBe("12");
    expect(await bcrypt.compare(answer, answerHash)).toBe(true);
  });
});
