import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // The integration tests share one test database, so files run one after another.
    fileParallelism: false,
    env: {
      NODE_ENV: "test",
      MONGODB_URI: process.env.MONGODB_URI ?? "mongodb://localhost:27017/app_test",
      JWT_SECRET: "test-secret-test-secret",
    },
  },
});
