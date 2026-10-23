import { expect, test } from "@playwright/test";
import { opened, prepare } from "./helpers";

// Shopping helpers added for phones: two-up grid, quick add with a confirmation,
// saving with the heart, the menu, the product buy bar, sharing, recently viewed.

test.describe("phone", () => {
  test.skip(({ isMobile }) => !isMobile, "phone layout");

  test("shop shows two products per row; '+' adds to cart with a confirmation", async ({ page }) => {
    await prepare(page, { lite: true });
    await page.goto("/shop/");
    const cards = page.locator("article");
    const [a, b] = [await cards.nth(0).boundingBox(), await cards.nth(1).boundingBox()];
    expect(Math.abs(a!.y - b!.y)).toBeLessThan(2);
    expect(b!.x).toBeGreaterThan(a!.x + a!.width - 1);

    await page.getByRole("button", { name: "Add Vortex Vase to cart" }).click();
    const toast = page.getByRole("status").filter({ hasText: "Added to cart" });
    await expect(toast).toContainText("Vortex Vase");
    await toast.getByRole("button", { name: "View cart" }).click();
    await expect(page.getByRole("dialog", { name: "Cart" })).toContainText("Vortex Vase");
  });

  test("product page: the buy bar is there while the main button is off screen", async ({ page }) => {
    await prepare(page, { lite: true });
    await page.goto("/shop/infinity-knot/");
    const bar = page.getByRole("button", { name: "Add to cart", exact: true });
    await expect(bar).toBeInViewport();
    await page.getByRole("button", { name: /^Add to cart ·/ }).scrollIntoViewIfNeeded();
    await expect(bar).not.toBeInViewport();
    await page.mouse.wheel(0, -3000);
    await expect(bar).toBeInViewport();
    await bar.click();
    await expect(page.getByRole("dialog", { name: "Cart" })).toContainText("Infinity Knot", { timeout: 15_000 });
  });

  test("checkout shows the order total at the top", async ({ page }) => {
    await prepare(page, { lite: true });
    await page.goto("/shop/infinity-knot/");
    await page.getByRole("button", { name: /^Add to cart ·/ }).click();
    await page.getByRole("dialog", { name: "Cart" }).getByRole("link", { name: /Checkout/ }).click();
    const summary = page.locator("details").filter({ hasText: "Order summary" });
    await expect(summary).toBeInViewport();
    await expect(summary).toContainText("₹");
    await summary.locator("summary").click();
    await expect(summary).toContainText("Infinity Knot");
  });
});

test("heart saves a product; it's listed under Menu → Saved", async ({ page }) => {
  await prepare(page, { lite: true });
  await page.goto("/shop/");
  await page.getByRole("button", { name: "Save Infinity Knot" }).click();
  await expect(page.getByRole("button", { name: "Remove Infinity Knot from saved" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Menu" }).click();
  const menu = page.getByRole("navigation", { name: "More" });
  await expect(menu.getByRole("link", { name: /Saved/ })).toContainText("1");
  await menu.getByRole("link", { name: /Saved/ }).click();
  await expect(page).toHaveURL(/\/saved\/$/);
  await expect(page.locator("article")).toHaveCount(1);
  await expect(page.locator("article")).toContainText("Infinity Knot");
});

test("menu opens and closes with Esc", async ({ page }) => {
  await prepare(page, { lite: true });
  await page.goto("/about/");
  const btn = page.getByRole("button", { name: "Menu" });
  await btn.click();
  await expect(btn).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("navigation", { name: "More" }).getByRole("link", { name: "Track an order" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("navigation", { name: "More" })).toHaveCount(0);
  await expect(btn).toBeFocused();
});

test("share falls back to WhatsApp where there's no share sheet", async ({ page }) => {
  await prepare(page, { lite: true });
  await page.addInitScript(() => Object.defineProperty(navigator, "share", { value: undefined }));
  await page.goto("/shop/vortex-vase/");
  await page.getByRole("button", { name: "Share" }).click();
  const url = (await opened(page))[0] ?? "";
  expect(url).toContain("wa.me");
  expect(decodeURIComponent(url)).toContain("/shop/vortex-vase/");
});

test("recently viewed products show on the shop page", async ({ page }) => {
  await prepare(page, { lite: true });
  const shelf = () => page.evaluate(() => localStorage.getItem("rk-shelf") ?? "");
  await page.goto("/shop/vortex-vase/");
  await expect.poll(shelf).toContain("vortex-vase"); // recorded once the page has loaded
  await page.goto("/shop/infinity-knot/");
  await expect.poll(shelf).toContain("infinity-knot");
  await page.goto("/shop/");
  const recent = page.getByRole("region", { name: "Recently viewed" });
  await expect(recent.getByRole("link")).toHaveCount(2);
  await expect(recent.getByRole("link").first()).toContainText("Infinity Knot");
});
