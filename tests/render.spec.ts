import { expect, test } from "@playwright/test";
import { draws, pages, prepare } from "./helpers";

test.describe("3D", () => {
  test("only pages with a 3D spot load the 3D engine; the product page draws its model, then idles", async ({ page }) => {
    await prepare(page);
    const chunks: string[] = [];
    page.on("response", (r) => r.url().includes("/_next/static/chunks/") && chunks.push(r.url()));
    for (const p of ["/", "/shop/", "/collections/"]) {
      await page.goto(p);
      await page.waitForTimeout(2500);
      await expect(page.locator("canvas")).toHaveCount(0);
    }
    for (const url of new Set(chunks)) {
      const body = await (await page.request.get(url)).text();
      expect(body.includes("WebGLRenderer"), url).toBe(false);
    }

    await page.goto("/shop/vortex-vase/");
    await expect(page.locator("canvas")).toHaveCount(1, { timeout: 15_000 });
    await expect.poll(() => draws(page), { timeout: 20_000 }).toBeGreaterThan(5);
    // it prints in, then settles: the canvas must stop drawing completely
    await expect
      .poll(
        async () => {
          const a = await draws(page);
          await page.waitForTimeout(1500);
          return (await draws(page)) - a;
        },
        { timeout: 30_000, intervals: [0] },
      )
      .toBe(0);
  });

  test("Lite mode loads no 3D at all", async ({ page }) => {
    await prepare(page, { lite: true });
    const chunks: string[] = [];
    page.on("response", (r) => r.url().includes("/_next/static/chunks/") && chunks.push(r.url()));
    for (const p of ["/", "/shop/vortex-vase/", "/personalise/"]) {
      await page.goto(p);
      await page.waitForTimeout(1500);
      await expect(page.locator("canvas")).toHaveCount(0);
    }
    // the 3D engine is the only chunk that contains WebGLRenderer
    for (const url of new Set(chunks)) {
      const body = await (await page.request.get(url)).text();
      expect(body.includes("WebGLRenderer"), url).toBe(false);
    }
  });
});

test("no page logs an error", async ({ page }) => {
  test.setTimeout(180_000); // 13 pages, some with 3D, on a slow shared test machine
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await prepare(page);
  for (const p of pages) {
    await page.goto(p, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");
    await page.waitForTimeout(800);
  }
  expect(errors).toEqual([]);
});
