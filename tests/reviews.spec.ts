import { expect, test } from "@playwright/test";
import { prepare } from "./helpers";
import { TINY_JPEG } from "./github-mock";

// Customers' reviews: the page, writing one with a photo, and what happens when
// the site can't take it right now.

test("a customer writes a review with a photo; it's sent for approval", async ({ page }) => {
  await prepare(page, { lite: true });
  let sent: Record<string, unknown> = {};
  await page.route("**/api/owner/review/", async (route) => {
    sent = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
  });
  await page.goto("/reviews/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Reviews");
  await page.getByLabel("What did you buy?").selectOption("vortex-vase");
  await page.getByRole("radio", { name: "5 stars" }).click();
  await page.getByLabel("Your review").fill("Lovely finish, looks even better in person.");
  await page.locator('input[type="file"][accept="image/*"]').setInputFiles({ name: "vase.jpg", mimeType: "image/jpeg", buffer: TINY_JPEG });
  await expect(page.getByAltText("Your photo")).toBeVisible();
  await page.getByLabel("Your name").fill("Asha");
  await page.getByLabel(/City/).fill("Pune");
  await page.getByRole("button", { name: "Send review" }).click();
  await expect(page.getByRole("status")).toContainText("Thank you");
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
  await page.getByRole("link", { name: "Write a review" }).click();
  await expect(page).toHaveURL(/\/reviews\/\?product=infinity-knot#write$/);
  await expect(page.getByLabel("What did you buy?")).toHaveValue("infinity-knot");
});
