import { expect, test } from "@playwright/test";
import { prepare } from "./helpers";
import { TINY_JPEG } from "./github-mock";

// Customers' reviews: the page, writing one with a photo, and what happens when
// the site can't take it right now.

test("a customer writes a review with a photo; it's posted straight away and shown to them", async ({ page }) => {
  await prepare(page, { lite: true });
  let sent: Record<string, unknown> = {};
  await page.route("**/api/owner/review/", async (route) => {
    sent = route.request().postDataJSON();
    const review = { id: "r9", name: sent.name, city: sent.city, product: sent.product, rating: sent.rating, text: sent.text, date: "2026-10-25", image: "/reviews/r9.jpg" };
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, review }) });
  });
  await page.goto("/reviews/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Customer reviews");
  // no approved reviews yet: the page opens on the form
  await expect(page.getByRole("tab", { name: "Write a new review" })).toHaveAttribute("aria-selected", "true");
  await page.getByLabel("What did you buy?").selectOption("vortex-vase");
  await page.getByRole("radio", { name: "5 stars" }).click();
  await page.getByLabel("Your review").fill("Lovely finish, looks even better in person.");
  await page.locator('input[type="file"][accept="image/*"]').setInputFiles({ name: "vase.jpg", mimeType: "image/jpeg", buffer: TINY_JPEG });
  await expect(page.getByAltText("Your photo")).toBeVisible();
  await page.getByLabel("Your name").fill("Asha");
  await page.getByLabel(/City/).fill("Pune");
  await page.getByRole("button", { name: "Send review" }).click();
  await expect(page.getByRole("status")).toContainText("Your review is posted");
  // they see it right away, with their own photo (the site's copy appears after the rebuild)
  const card = page.locator("figure").filter({ hasText: "Lovely finish" });
  await expect(card).toContainText("Asha");
  await expect(card.locator("img")).toHaveAttribute("src", /^blob:/);
  expect(sent).toMatchObject({ name: "Asha", city: "Pune", product: "vortex-vase", rating: 5, text: "Lovely finish, looks even better in person." });
  // the photo was shrunk to a JPEG in the browser
  expect(String(sent.photo).startsWith("/9j/")).toBe(true);
});

test("if reviews can't be received right now, the customer can send it on WhatsApp", async ({ page }) => {
  await prepare(page, { lite: true });
  await page.route("**/api/owner/review/", (route) => route.fulfill({ status: 503, contentType: "application/json", body: '{"error":"no-github-token"}' }));
  await page.goto("/reviews/");
  await page.getByRole("radio", { name: "4 stars" }).click();
  await page.getByLabel("Your review").fill("Great keychain, arrived quickly.");
  await page.getByLabel("Your name").fill("Ravi");
  await page.getByRole("button", { name: "Send review" }).click();
  const alert = page.getByRole("alert").filter({ hasText: "WhatsApp" });
  await expect(alert.getByRole("link", { name: "Send on WhatsApp" })).toHaveAttribute("href", /wa\.me.*Great%20keychain/);
});

test("a product page links to writing a review of that product", async ({ page }) => {
  await prepare(page, { lite: true });
  await page.goto("/shop/infinity-knot/");
  await page.getByRole("link", { name: "Write a new review" }).click();
  await expect(page).toHaveURL(/\/reviews\/\?product=infinity-knot#write$/);
  await expect(page.getByLabel("What did you buy?")).toHaveValue("infinity-knot");
});

test("Customer reviews has two tabs: write a new review, and view all customer reviews (linkable)", async ({ page }) => {
  await prepare(page, { lite: true });
  await page.goto("/reviews/#all");
  const all = page.getByRole("tab", { name: /View all customer reviews/ });
  const write = page.getByRole("tab", { name: "Write a new review" });
  await expect(all).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel", { name: /View all customer reviews/ })).toContainText("No customer reviews yet");
  await expect(page.getByLabel("Your review")).toBeHidden();

  await write.click();
  await expect(page).toHaveURL(/#write$/);
  await expect(page.getByLabel("Your review")).toBeVisible();
  // the arrow keys move between the tabs
  await page.keyboard.press("ArrowRight");
  await expect(all).toBeFocused();
  await expect(all).toHaveAttribute("aria-selected", "true");

  // the empty list offers the form
  await page.getByRole("tabpanel", { name: /View all customer reviews/ }).getByRole("button", { name: "Write a new review" }).click();
  await expect(write).toHaveAttribute("aria-selected", "true");
});

test("product pages link to both: write a new review, view all customer reviews", async ({ page }) => {
  await prepare(page, { lite: true });
  await page.goto("/shop/vortex-vase/");
  await expect(page.getByRole("heading", { name: "Customer reviews" })).toBeVisible();
  await page.getByRole("link", { name: "View all customer reviews" }).click();
  await expect(page).toHaveURL(/\/reviews\/#all$/);
  await expect(page.getByRole("tab", { name: /View all customer reviews/ })).toHaveAttribute("aria-selected", "true");
});
