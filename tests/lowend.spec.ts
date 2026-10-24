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

test("budget phone: Lite mode by itself, opening animation, no 3D", async ({ page }) => {
  const scripts: string[] = [];
  page.on("request", (r) => r.resourceType() === "script" && scripts.push(r.url()));
  await page.goto("/", { waitUntil: "load" });
  await expect(page.locator("html")).toHaveClass(/\blite\b/);
  // the opening animation is plain CSS, so budget phones get it too, and it's over in about 3 s
  await expect(page.locator("#intro")).toBeVisible();
  await expect(page.locator("#intro")).toHaveCount(0, { timeout: 6000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /explore the collection/i })).toBeInViewport();
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

// A typical 4 GB Android phone gets the real 3D: 360° product views and the print-in animations.
test.describe("4 GB phone", () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, "deviceMemory", { get: () => 4, configurable: true });
      Object.defineProperty(Navigator.prototype, "hardwareConcurrency", { get: () => 8, configurable: true });
      // test machines draw WebGL in software, which the site would treat as "no graphics chip"
      localStorage.setItem("rk-gpu", "ok");
    });
  });

  test("gets the 3D site: the studio picture stands in, then the live 360° model takes over", async ({ page }) => {
    await page.goto("/shop/vortex-vase/", { waitUntil: "load" });
    await expect(page.locator("html")).not.toHaveClass(/\blite\b/);
    await expect(page.getByText("Swipe to turn it around")).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(1, { timeout: 15_000 });
    // the stand-in fades away once the model has been drawn
    await expect(page.locator("main .transition-opacity.opacity-0 img[src*='/renders/']").first()).toBeAttached({ timeout: 20_000 });
  });
});

test("budget phone: 'View in 3D' loads the 360° view for that product", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("rk-gpu", "ok"));
  await page.goto("/shop/vortex-vase/", { waitUntil: "load" });
  await expect(page.locator("html")).toHaveClass(/\blite\b/);
  expect(await page.locator("canvas").count()).toBe(0);
  await page.getByRole("button", { name: /view in 3d/i }).click();
  await expect(page.locator("canvas")).toHaveCount(1, { timeout: 15_000 });
});
