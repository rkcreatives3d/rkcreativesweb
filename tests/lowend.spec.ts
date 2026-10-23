import { expect, test } from "@playwright/test";

// A budget Android phone: 1 GB of memory, four slow cores. The site should
// pick Lite mode by itself (no 3D engine at all), show the headline without
// waiting for JavaScript, and show studio pictures of the products instead.
test.use({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });

test.beforeEach(async ({ page, context }) => {
  await context.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, "deviceMemory", { get: () => 1 });
    Object.defineProperty(Navigator.prototype, "hardwareConcurrency", { get: () => 4 });
  });
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
});

test("budget phone: Lite mode by itself, no 3D, cover readable at once", async ({ page }) => {
  const scripts: string[] = [];
  page.on("request", (r) => r.resourceType() === "script" && scripts.push(r.url()));
  await page.goto("/", { waitUntil: "load" });
  await expect(page.locator("html")).toHaveClass(/\blite\b/);
  await expect(page.locator("#intro")).toBeHidden();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /shop the collection/i })).toBeInViewport();
  await page.waitForTimeout(1500);
  expect(await page.locator("canvas").count()).toBe(0);
  // the 3D engine is never even downloaded
  const chunks = await Promise.all(scripts.map((u) => page.request.get(u).then((r) => r.text())));
  expect(chunks.some((js) => js.includes("WebGLRenderer"))).toBe(false);
});

test("budget phone: products show as studio pictures, in the chosen colour", async ({ page }) => {
  await page.goto("/shop/vortex-vase/", { waitUntil: "load" });
  const main = page.locator("img[src*='/renders/vortex-vase/']").first();
  await expect(main).toBeVisible();
  await page.getByRole("button", { name: "Matte Black", exact: true }).click();
  await expect(page.locator("img[src*='/renders/vortex-vase/onyx']").first()).toBeVisible();

  await page.goto("/shop/", { waitUntil: "load" });
  await page.mouse.wheel(0, 600);
  await expect(page.locator("article img[src*='/renders/']").first()).toBeVisible();
});
