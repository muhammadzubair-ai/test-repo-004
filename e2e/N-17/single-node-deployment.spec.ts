import { test, expect } from "@playwright/test";

test("[U-29 AC-1] SPA HTML and health JSON are served on the same port", async ({ request }) => {
  const spa = await request.get("/", { maxRedirects: 0 });
  expect(spa.ok()).toBe(true);
  expect(spa.headers()["content-type"]).toMatch(/text\/html/i);
  expect(await spa.text()).toMatch(/<html(?:\s|>)/i);

  const health = await request.get("/api/health", { maxRedirects: 0 });
  expect(health.ok()).toBe(true);
  expect(health.headers()["content-type"]).toMatch(/application\/json/i);
  await health.json();

  expect(new URL(health.url()).origin).toBe(new URL(spa.url()).origin);
});
