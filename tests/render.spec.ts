import { expect, test } from "@playwright/test";
import { draws, pages, prepare } from "./helpers";

test.describe("3D", () => {
  test("cover animates; the shop grid idles until a card is hovered", async ({ page, isMobile }) => {
    test.skip(isMobile, "hover is a desktop interaction");
    await prepare(page);
    await page.goto("/");
    await expect(page.locator("canvas")).toHaveCount(1, { timeout: 15_000 });
    await expect.poll(() => draws(page), { timeout: 15_000 }).toBeGreaterThan(30);

    await page.goto("/shop/");
    await expect(page.locator("canvas")).toHaveCount(1, { timeout: 15_000 });
    // cards pop in, then settle: the canvas must stop drawing completely
    let idle = -1;
    await expect
      .poll(
        async () => {
          const a = await draws(page);
          await page.waitForTimeout(1500);
          const b = await draws(page);
          idle = b;
          return b - a;
        },
        { timeout: 30_000, intervals: [0] },
      )
      .toBe(0);

    await page.locator("article").first().hover();
    await expect.poll(() => draws(page), { timeout: 5000 }).toBeGreaterThan(idle + 10);
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
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await prepare(page);
  for (const p of pages) {
    await page.goto(p);
    await page.waitForTimeout(800);
  }
  expect(errors).toEqual([]);
});
