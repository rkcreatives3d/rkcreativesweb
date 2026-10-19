import { expect, test } from "@playwright/test";
import { opened, prepare } from "./helpers";

test("intro plays once per visit, and finishes on its own", async ({ page }) => {
  await prepare(page, { intro: true });
  await page.goto("/", { waitUntil: "commit" });
  await expect(page.locator("#intro")).toBeVisible();
  // ends by itself: when the print finishes, or after 7 s at most on a very slow machine
  await expect(page.locator("#intro")).toHaveCount(0, { timeout: 20_000 });
  await page.reload();
  await expect(page.locator("#intro")).toBeHidden();
});

test("intro never plays off the home page", async ({ page }) => {
  await prepare(page, { intro: true });
  await page.goto("/shop/");
  await expect(page.locator("#intro")).toBeHidden();
});

test("checkout can't be opened from a typed link", async ({ page }) => {
  await prepare(page);
  await page.goto("/checkout/");
  await expect(page).toHaveURL(/\/$/);
});

test("personalise → product → checkout → order page, with the full order in the message", async ({ page }) => {
  await prepare(page);

  // a personalised keychain from the studio, with lettering and an icon
  await page.goto("/personalise/?name=Ravi");
  await expect(page.getByPlaceholder("Type here…")).toHaveValue("Ravi");
  await page.getByRole("button", { name: /^Script/ }).click();
  await page.getByRole("button", { name: "Heart" }).click();
  await page.getByRole("button", { name: /^Add to cart/ }).click();
  const drawer = page.getByRole("dialog", { name: "Cart" });
  await expect(drawer).toBeVisible({ timeout: 15_000 }); // opens after the fly-to-cart animation
  await expect(drawer).toContainText("Script letters, heart icon");
  await page.keyboard.press("Escape");

  // a vase with an engraving, PIN checked on the product page
  await page.goto("/shop/vortex-vase/");
  await page.getByRole("checkbox").check();
  await page.getByLabel("Text to print").fill("Happy Birthday Ria");
  await page.locator("#pin-check").fill("500032");
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(page.locator("#pin-result")).toContainText("Same city");
  await page.getByRole("button", { name: /^Add to cart/ }).click();
  await expect(drawer).toContainText("Happy Birthday Ria", { timeout: 15_000 });
  await drawer.getByRole("link", { name: /Checkout/ }).click();

  await expect(page).toHaveURL(/checkout/);
  await expect(page.getByLabel(/PIN code/)).toHaveValue("500032");
  await page.getByLabel(/Full name/).fill("Test Buyer");
  await page.getByLabel(/Phone/).fill("9876543210");
  await page.getByLabel(/^Address/).fill("12 Test Street");
  await page.getByLabel(/City/).fill("Hyderabad");
  await page.getByRole("button", { name: /Order on WhatsApp/ }).click();

  await expect(page).toHaveURL(/\/order\//);
  const msg = decodeURIComponent((await opened(page))[0]?.split("text=")[1] ?? "");
  expect(msg).toContain('print "Ravi" (Script letters, heart icon)');
  expect(msg).toContain('print "Happy Birthday Ria"');
  expect(msg).toContain("₹998");
  expect(msg).toContain("Estimated delivery:");
  expect(msg).toContain("Payment: UPI");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/thanks, test/i);
  await expect(page.getByRole("link", { name: "Open WhatsApp again" })).toBeVisible();
  const left = await page.evaluate(() => JSON.parse(localStorage.getItem("rk-cart") || "{}").state?.items?.length ?? 0);
  expect(left).toBe(0);
});

test("track page sends the courier tracking number to the courier site", async ({ page }) => {
  await prepare(page);
  await page.goto("/track/");
  await page.getByLabel(/tracking number/).fill("AWB123");
  await page.getByRole("button", { name: /^Track on/ }).click();
  expect((await opened(page))[0]).toContain("AWB123");
});
