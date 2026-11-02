import { test, expect } from "@playwright/test";

test("[U-30 AC-1] SPA loads in browser with all local assets succeeding and no external requests", async ({ page }, testInfo) => {
  const baseURL = testInfo.project.use.baseURL;
  expect(baseURL, "A configured baseURL is required").toBeTruthy();
  const configuredOrigin = new URL(baseURL!).origin;
  const assetTypes = new Set(["stylesheet", "script", "image", "font", "media", "manifest", "texttrack"]);
  const externalRequests: string[] = [];
  const unsuccessfulAssets: string[] = [];
  const failedAssets: string[] = [];
  const pendingAssets = new Set<object>();

  page.on("request", request => {
    const origin = new URL(request.url()).origin;
    if (!request.isNavigationRequest() && origin !== configuredOrigin) {
      externalRequests.push(request.url());
    }
    if (origin === configuredOrigin && assetTypes.has(request.resourceType())) {
      pendingAssets.add(request);
    }
  });

  page.on("response", response => {
    const request = response.request();
    if (new URL(request.url()).origin === configuredOrigin && assetTypes.has(request.resourceType())) {
      if (!response.ok()) {
        unsuccessfulAssets.push(`${response.status()} ${response.url()}`);
      }
    }
  });

  page.on("requestfinished", request => {
    pendingAssets.delete(request);
  });

  page.on("requestfailed", request => {
    pendingAssets.delete(request);
    if (new URL(request.url()).origin === configuredOrigin && assetTypes.has(request.resourceType())) {
      failedAssets.push(`${request.url()}: ${request.failure()?.errorText}`);
    }
  });

  const response = await page.goto("/", { waitUntil: "load" });
  expect(response, "The SPA navigation must return a response").not.toBeNull();
  expect(response!.ok()).toBe(true);
  await expect(page).toHaveTitle("MERN app");
  await expect.poll(() => pendingAssets.size, { message: "All requested local assets must finish loading" }).toBe(0);

  expect(externalRequests, "No non-navigation requests may leave the configured application origin").toEqual([]);
  expect(unsuccessfulAssets, "Every local asset response must succeed").toEqual([]);
  expect(failedAssets, "No local asset request may fail").toEqual([]);
});
