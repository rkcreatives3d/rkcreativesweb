import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { pages, prepare } from "./helpers";

for (const p of pages) {
  test(`accessibility: ${p}`, async ({ page }) => {
    await prepare(page, { lite: true });
    await page.goto(p);
    await page.waitForTimeout(1200); // let entrance animations finish
    const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes.length} × ${v.help}`)).toEqual([]);
  });

  test(`search basics: ${p}`, async ({ page }) => {
    await prepare(page, { lite: true });
    await page.goto(p);
    await expect(page.locator("h1")).toHaveCount(1);
    expect((await page.title()).length).toBeGreaterThan(10);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.{40,}/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${p.replace(/\//g, "\\/")}$`));
  });
}

test("keyboard: skip link, then the main nav, then into the page", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard test");
  await prepare(page, { lite: true });
  await page.goto("/shop/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  const inMain = await page.evaluate(() => !!document.activeElement?.closest("main"));
  expect(inMain).toBe(true);
});
