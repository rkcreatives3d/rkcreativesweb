import { expect, test } from "@playwright/test";
import { opened, prepare, shopProducts, somePiece } from "./helpers";

// a piece other than the Vortex Vase (which some tests open first)
const piece = somePiece("vortex-vase");

// Shopping helpers: the two-up grid on phones, saving with the heart, the
// menu, search, the product buy bar, sharing, recently viewed.

test.describe("phone", () => {
  test.skip(({ isMobile }) => !isMobile, "phone layout");

  test("shop shows two products per row; a card leads to its product page", async ({ page }) => {
    await prepare(page, { lite: true });
    await page.goto("/shop/");
    const cards = page.locator("article");
    const [a, b] = [await cards.nth(0).boundingBox(), await cards.nth(1).boundingBox()];
    expect(Math.abs(a!.y - b!.y)).toBeLessThan(2);
    expect(b!.x).toBeGreaterThan(a!.x + a!.width - 1);

    await page.getByRole("link", { name: "Vortex Vase", exact: true }).first().click();
    await expect(page).toHaveURL(/\/shop\/vortex-vase\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Vortex Vase");
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

  test("product page: the buy bar is there while the main button is off screen", async ({ page }) => {
    await prepare(page, { lite: true });
    await page.goto(`/shop/${piece.slug}/`);
    const bar = page.getByRole("button", { name: "Add to cart", exact: true });
    await expect(bar).toBeInViewport();
    await page.getByRole("button", { name: /^Add to cart ·/ }).scrollIntoViewIfNeeded();
    await expect(bar).not.toBeInViewport();
    await page.mouse.wheel(0, -3000);
    await expect(bar).toBeInViewport();
    await bar.click();
    await expect(page.getByRole("dialog", { name: "Cart" })).toContainText(piece.name, { timeout: 15_000 });
  });

  test("checkout shows the order total at the top", async ({ page }) => {
    await prepare(page, { lite: true });
    await page.goto(`/shop/${piece.slug}/`);
    await page.getByRole("button", { name: /^Add to cart ·/ }).click();
    await page.getByRole("dialog", { name: "Cart" }).getByRole("link", { name: /Checkout/ }).click();
    const summary = page.locator("details").filter({ hasText: "Order summary" });
    await expect(summary).toBeInViewport();
    await expect(summary).toContainText("₹");
    await summary.locator("summary").click();
    await expect(summary).toContainText(piece.name);
  });
});

test("heart saves a product; it's listed under Saved (phone menu, or the footer)", async ({ page, isMobile }) => {
  await prepare(page, { lite: true });
  await page.goto("/shop/");
  await page.getByRole("button", { name: `Save ${piece.name}` }).click();
  await expect(page.getByRole("button", { name: `Remove ${piece.name} from saved` })).toHaveAttribute("aria-pressed", "true");
  if (isMobile) {
    await page.getByRole("button", { name: "Menu" }).click();
    const menu = page.getByRole("navigation", { name: "More" });
    await expect(menu.getByRole("link", { name: /Saved/ })).toContainText("1");
    await menu.getByRole("link", { name: /Saved/ }).click();
  } else await page.getByRole("contentinfo").getByRole("link", { name: "Saved" }).click();
  await expect(page).toHaveURL(/\/saved\/$/);
  await expect(page.locator("article")).toHaveCount(1);
  await expect(page.locator("article")).toContainText(piece.name);
});

test("search in the nav finds products as you type; Enter opens the first, Esc closes", async ({ page }) => {
  await prepare(page, { lite: true });
  await page.goto("/about/");
  await page.getByRole("button", { name: "Search" }).click();
  const dialog = page.getByRole("dialog", { name: "Search" });
  const box = dialog.getByRole("textbox", { name: "Search products" });
  await expect(box).toBeFocused();
  await box.fill("lamp");
  await expect(dialog.getByRole("link", { name: /Geodesic Orb Lamp/ })).toBeVisible();
  await expect(dialog.getByRole("link", { name: /Saturn Night Lamp/ })).toBeVisible();
  await box.fill("zzzz");
  await expect(dialog).toContainText("No products match");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);

  await page.getByRole("button", { name: "Search" }).click();
  await page.getByRole("textbox", { name: "Search products" }).fill(piece.name);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(`/shop/${piece.slug}/$`));
});

test("the shop reads a search from the address: /shop/?q=", async ({ page }) => {
  await prepare(page, { lite: true });
  await page.goto(`/shop/?q=${encodeURIComponent(piece.name)}`);
  await expect(page.getByRole("searchbox", { name: "Search products" })).toHaveValue(piece.name);
  await expect(page.locator("article").first()).toContainText(piece.name);
  expect(await page.locator("article").count()).toBeLessThan(shopProducts.length); // filtered
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
  await page.goto(`/shop/${piece.slug}/`);
  await expect.poll(shelf).toContain(piece.slug);
  await page.goto("/shop/");
  const recent = page.getByRole("region", { name: "Recently viewed" });
  await expect(recent.getByRole("link")).toHaveCount(2);
  await expect(recent.getByRole("link").first()).toContainText(piece.name);
});
