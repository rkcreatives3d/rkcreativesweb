import fs from "node:fs";
import { expect, test } from "@playwright/test";
import { prepare } from "./helpers";
import { cubeSTL, mockGitHub } from "./github-mock";

// The owner's shop manager, against a pretend GitHub (tests/github-mock.ts).

test.describe.configure({ mode: "serial" });

for (const mode of ["3D", "Lite"] as const) {
  test(`5 taps on the home page logo open the shop manager (${mode})`, async ({ page }) => {
    await prepare(page, { lite: mode === "Lite" });
    await page.addInitScript(() => localStorage.setItem("rk-gpu", "ok"));
    await page.goto("/");
    if (mode === "3D") await expect(page.locator("canvas")).toHaveCount(1, { timeout: 15_000 });
    // a real tap in the middle of the logo, whatever is drawn over it
    const box = (await page.locator("#cover-logo").boundingBox())!;
    for (let i = 0; i < 5; i++) await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page).toHaveURL(/\/owner\/$/);
    await expect(page.getByRole("heading", { name: "Shop manager" })).toBeVisible();
    await expect(page.getByLabel("Owner key")).toBeVisible();
  });
}

test("5 taps on the small logo in the top bar work too, on the home page only", async ({ page }) => {
  await prepare(page, { lite: true });
  await page.goto("/");
  const logo = page.getByRole("link", { name: /home$/ }).first();
  for (let i = 0; i < 5; i++) await logo.click();
  await expect(page).toHaveURL(/\/owner\/$/);
});

test("fewer than 5 taps don't open it", async ({ page }) => {
  await prepare(page, { lite: true });
  await page.goto("/");
  const box = (await page.locator("#cover-logo").boundingBox())!;
  for (let i = 0; i < 4; i++) await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(500);
  await expect(page).not.toHaveURL(/owner/);
});

test("a key that can't write to the repo is refused", async ({ page }) => {
  await prepare(page, { lite: true });
  await mockGitHub(page, { canWrite: false });
  await page.goto("/owner/");
  await page.getByLabel("Owner key").fill("github_pat_test");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "can't change" })).toBeVisible();
});

test("owner edits a price, adds a product with a 3D file, a colour and settings, and publishes it all as one commit", async ({ page }) => {
  test.slow(); // makes real studio pictures in WebGL
  await prepare(page, { lite: true });
  const gh = await mockGitHub(page);
  await page.goto("/owner/");
  await page.getByLabel("Owner key").fill("github_pat_test");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Signed in as rkcreatives3d")).toBeVisible();

  // quick price change from the list
  await page.getByLabel("Price of Vortex Vase").fill("999");

  // a new product with a 3D file
  await page.getByLabel("Add a new product").fill("Lotus Lamp");
  await page.getByRole("button", { name: "+ Add product" }).click();
  await expect(page.getByRole("heading", { name: "Lotus Lamp" })).toBeVisible();
  await page.getByLabel("Short line").fill("A lotus that glows.");
  await page.getByLabel("Starting price").fill("1199");
  await page.locator('input[type="file"][accept=".stl,.3mf,.obj,.glb"]').setInputFiles({ name: "lotus.stl", mimeType: "model/stl", buffer: cubeSTL() });
  await expect(page.getByText("New file: lotus.stl")).toBeVisible();
  await page.getByRole("switch").check(); // visible in the shop
  await page.getByRole("button", { name: "Done" }).click();

  // a new colour, and a settings change
  await page.getByRole("button", { name: "Colours" }).click();
  await page.getByLabel("Name").first().fill("Ocean Blue");
  await page.getByRole("button", { name: "+ Add colour" }).click();
  await page.getByRole("button", { name: "Shop settings" }).click();
  await page.getByLabel("WhatsApp number").fill("919876543210");

  // publish
  await page.getByRole("button", { name: "Publish changes" }).click();
  const dialog = page.getByRole("dialog", { name: "Publish to the website" });
  await expect(dialog).toContainText("Vortex Vase: price ₹899 → ₹999");
  await expect(dialog).toContainText("New product: Lotus Lamp");
  await dialog.getByRole("button", { name: "Publish" }).click();
  await expect(dialog).toContainText("Published", { timeout: 90_000 });
  expect(gh.rec.refUpdated).toBe(true);

  const products = JSON.parse(gh.written("content/products.json")!);
  expect(products[0]).toMatchObject({ slug: "lotus-lamp", name: "Lotus Lamp", price: 1199, tagline: "A lotus that glows." });
  expect(products[0].hidden).toBe(false);
  expect(products.find((p: { slug: string }) => p.slug === "vortex-vase").price).toBe(999);
  expect(gh.written("models/lotus-lamp.stl")).toContain("solid cube");
  const renders = JSON.parse(gh.written("lib/renders.generated.json")!);
  expect(renders["lotus-lamp"]).toEqual(products[0].finishes);
  for (const f of products[0].finishes) expect(gh.rec.tree.some((t) => t.path === `public/renders/lotus-lamp/${f}.webp`)).toBe(true);
  expect(JSON.parse(gh.written("content/finishes.json")!).some((f: { name: string }) => f.name === "Ocean Blue")).toBe(true);
  expect(JSON.parse(gh.written("content/shop.json")!).whatsapp).toBe("919876543210");
  expect(gh.rec.message).toContain("Owner:");
  await expect(page.getByRole("button", { name: "All published" })).toBeDisabled();
  // OWNER_SHOTS=<folder> saves the studio pictures it made, to look at
  if (process.env.OWNER_SHOTS) for (const f of products[0].finishes) fs.writeFileSync(`${process.env.OWNER_SHOTS}/${f}.webp`, gh.raw(`public/renders/lotus-lamp/${f}.webp`)!);
});

test("deleting a product removes its files in the same commit", async ({ page }) => {
  await prepare(page, { lite: true });
  const gh = await mockGitHub(page);
  page.on("dialog", (d) => d.accept());
  await page.goto("/owner/");
  await page.getByLabel("Owner key").fill("github_pat_test");
  await page.getByRole("button", { name: "Sign in" }).click();
  const row = page.getByRole("listitem").filter({ hasText: "Vortex Vase" });
  await row.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Publish changes" }).click();
  const dialog = page.getByRole("dialog", { name: "Publish to the website" });
  await expect(dialog).toContainText("Deleted: Vortex Vase");
  await dialog.getByRole("button", { name: "Publish" }).click();
  await expect(dialog).toContainText("Published", { timeout: 30_000 });
  expect(gh.rec.tree).toEqual(expect.arrayContaining([{ path: "models/vortex-vase.stl", mode: "100644", type: "blob", sha: null }]));
  expect(gh.rec.tree.some((t) => t.path === "public/renders/vortex-vase/amber.webp" && t.sha === null)).toBe(true);
  expect(JSON.parse(gh.written("content/products.json")!).some((p: { slug: string }) => p.slug === "vortex-vase")).toBe(false);
});
