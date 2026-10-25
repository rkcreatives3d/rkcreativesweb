import fs from "node:fs";
import { expect, type Page, test } from "@playwright/test";
import { prepare } from "./helpers";
import { bigSTL, cubeSTL, mockGitHub, TINY_JPEG } from "./github-mock";

// The owner's shop manager, against a pretend GitHub (tests/github-mock.ts).

test.describe.configure({ mode: "serial" });

for (const mode of ["3D", "Lite"] as const) {
  test(`5 taps on the home page logo open the shop manager (${mode})`, async ({ page }) => {
    await prepare(page, { lite: mode === "Lite" });
    await page.addInitScript(() => localStorage.setItem("rk-gpu", "ok"));
    await page.goto("/");
    // the logo in the brand story, near the end of the home page
    await page.locator("#brand-logo").scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    // nothing (like a 3D layer) may sit on top of the logo and catch the taps
    const box = (await page.locator("#brand-logo").boundingBox())!;
    const [x, y] = [box.x + box.width / 2, box.y + box.height / 2];
    expect(await page.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.closest("[data-owner-tap]"), [x, y])).toBe(true);
    if (mode === "Lite") for (let i = 0; i < 5; i++) await page.mouse.click(x, y);
    // with 3D on, a busy test machine can handle real taps slowly: tap the element under that point
    // 5 times in quick succession
    else
      await page.evaluate(([x, y]) => {
        const el = document.elementFromPoint(x, y)!;
        for (let i = 0; i < 5; i++) el.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: x, clientY: y }));
      }, [x, y]);
    // the owner page's code (with its 3D editor) loads on the way: give a busy test machine time
    await expect(page).toHaveURL(/\/owner\/$/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "Shop manager" })).toBeVisible();
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
  await page.locator("#brand-logo").scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const box = (await page.locator("#brand-logo").boundingBox())!;
  for (let i = 0; i < 4; i++) await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(500);
  await expect(page).not.toHaveURL(/owner/);
});

test("a key that can't write to the repo is refused", async ({ page }) => {
  await prepare(page, { lite: true });
  await mockGitHub(page, { canWrite: false });
  await page.goto("/owner/");
  await page.getByLabel("GitHub key").fill("github_pat_test");
  await page.getByRole("button", { name: "Sign in with key" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "can't change" })).toBeVisible();
});

test("owner edits a price, adds a product with a 3D file, a colour and settings, and publishes it all as one commit", async ({ page }) => {
  test.slow(); // makes real studio pictures in WebGL
  await prepare(page, { lite: true });
  const gh = await mockGitHub(page);
  await page.goto("/owner/");
  await page.getByLabel("GitHub key").fill("github_pat_test");
  await page.getByRole("button", { name: "Sign in with key" }).click();
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
  await page.getByRole("switch", { name: /Hidden from customers/ }).check(); // visible in the shop
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
  // the main colour also gets the big picture the home page uses
  expect(gh.rec.tree.some((t) => t.path === `public/renders/lotus-lamp/${products[0].finishes[0]}-xl.webp`)).toBe(true);
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
  await page.getByLabel("GitHub key").fill("github_pat_test");
  await page.getByRole("button", { name: "Sign in with key" }).click();
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

test("password sign-in: wrong tries count down; the right password opens the manager, and publishing goes through the sign-in server", async ({ page }) => {
  await prepare(page, { lite: true });
  const gh = await mockGitHub(page, { password: "open sesame" });
  await page.goto("/owner/");
  const pw = page.getByLabel("Password");
  await pw.fill("guess");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Wrong password" })).toContainText("4 tries left");
  await pw.fill("open sesame");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("Signed in as owner")).toBeVisible();
  // the GitHub key never reached the browser: there wasn't one
  await page.getByLabel("Price of Infinity Knot").fill("700");
  await page.getByRole("button", { name: "Publish changes" }).click();
  const dialog = page.getByRole("dialog", { name: "Publish to the website" });
  await dialog.getByRole("button", { name: "Publish" }).click();
  await expect(dialog).toContainText("Published", { timeout: 30_000 });
  expect(JSON.parse(gh.written("content/products.json")!).find((p: { slug: string }) => p.slug === "infinity-knot").price).toBe(700);
  // signed in on this device: a reload goes straight back in
  await page.reload();
  await expect(page.getByText("Signed in as owner")).toBeVisible();
});

test("without a sign-in server (a static-only host), the page offers the GitHub key", async ({ page }) => {
  await prepare(page, { lite: true });
  await page.route("**/api/owner/**", (r) => r.fulfill({ status: 404, body: "" }));
  await page.goto("/owner/");
  await expect(page.getByText("Password sign-in isn't switched on yet")).toBeVisible();
  await expect(page.getByLabel("GitHub key")).toBeVisible();
});

test("the built-in password signs in through the real sign-in server", async ({ page }) => {
  await prepare(page, { lite: true });
  // the shop's files: served by the pretend GitHub, so the test doesn't need the internet
  const gh = await mockGitHub(page, { password: "unused" });
  await page.unroute("**/api/owner/**");
  await page.route("**/api/owner/github/**", (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^.*\/api\/owner\/github\//, "").replace(/\/$/, "");
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ content: fs.readFileSync(path.replace(/^contents\//, "")).toString("base64"), sha: "x" }) });
  });
  await page.goto("/owner/");
  await page.getByLabel("Password").fill("wrong");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Wrong password" })).toBeVisible();
  await page.getByLabel("Password").fill("rkcreatives3d");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("Signed in as owner")).toBeVisible();
  await expect(page.getByText("Vortex Vase").first()).toBeVisible();
  // no GitHub key on this server: editing yes, publishing explains
  await expect(page.getByText("You can edit, but Publish is off")).toBeVisible();
  expect(gh.rec.refUpdated).toBe(false);
});

test("a big 3D file is sent in pieces under 4.5 MB each (the most a Vercel function takes)", async ({ page }) => {
  test.setTimeout(240_000); // studio pictures of a big model, drawn in software on the test machine
  await prepare(page, { lite: true });
  const gh = await mockGitHub(page, { password: "open sesame" });
  await page.goto("/owner/");
  await page.getByLabel("Password").fill("open sesame");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("listitem").filter({ hasText: "Gear Spinner" }).getByRole("button", { name: "Edit" }).click();
  const file = bigSTL(70_000); // ~3.5 MB: two pieces
  await page.locator('input[type="file"][accept=".stl,.3mf,.obj,.glb"]').setInputFiles({ name: "gear.stl", mimeType: "model/stl", buffer: file });
  await expect(page.getByText("New file: gear.stl")).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Publish changes" }).click();
  const dialog = page.getByRole("dialog", { name: "Publish to the website" });
  await dialog.getByRole("button", { name: "Publish" }).click();
  await expect(dialog).toContainText("Published", { timeout: 180_000 });
  const parts = gh.rec.tree.filter((t) => t.path.startsWith("models/gear-spinner.stl.part") && t.sha).map((t) => t.path);
  expect(parts).toEqual(["models/gear-spinner.stl.part1", "models/gear-spinner.stl.part2"]);
  const joined = Buffer.concat(parts.map((p) => gh.raw(p)!));
  expect(joined.equals(file)).toBe(true);
  for (const p of parts) expect(gh.raw(p)!.length).toBeLessThanOrEqual(3_000_000);
});

test("a password typed into the GitHub key box gets a clear hint, and isn't sent anywhere", async ({ page }) => {
  await prepare(page, { lite: true });
  let sent = false;
  await page.route("https://api.github.com/**", (r) => ((sent = true), r.abort()));
  await page.goto("/owner/");
  await page.getByRole("button", { name: "Sign in with a GitHub key instead" }).click();
  await page.getByLabel("GitHub key").fill("mypassword123");
  await page.getByRole("button", { name: "Sign in with key" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "not a GitHub key" })).toBeVisible();
  expect(sent).toBe(false);
});

test("password set but no GitHub key on the host: signs in and edits; Publish explains what's missing", async ({ page }) => {
  await prepare(page, { lite: true });
  const gh = await mockGitHub(page, { password: "open sesame", canPublish: false });
  await page.goto("/owner/");
  await page.getByLabel("Password").fill("open sesame");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("You can edit, but Publish is off")).toBeVisible();
  await page.getByLabel("Price of Infinity Knot").fill("700");
  await page.getByRole("button", { name: "Publish changes" }).click();
  const dialog = page.getByRole("dialog", { name: "Publish to the website" });
  await dialog.getByRole("button", { name: "Publish" }).click();
  await expect(dialog.getByRole("alert")).toContainText("add GITHUB_TOKEN");
  expect(gh.rec.refUpdated).toBe(false);
});

test("owner approves one waiting review (with its photo) and rejects another; publishing puts it live and clears the inbox", async ({ page }) => {
  await prepare(page, { lite: true });
  page.on("dialog", (d) => d.accept());
  const gh = await mockGitHub(page, {
    password: "open sesame",
    inbox: [
      { id: "r1", name: "Asha", city: "Pune", rating: 5, text: "Lovely finish, looks even better in person.", product: "vortex-vase", date: "2026-10-20", photo: TINY_JPEG },
      { id: "r2", name: "Spam Bot", rating: 1, text: "buy cheap followers here now", date: "2026-10-21" },
    ],
  });
  await page.goto("/owner/");
  await page.getByLabel("Password").fill("open sesame");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("button", { name: "Reviews" }).click();
  const waiting = page.getByRole("list", { name: "Waiting reviews" });
  await expect(waiting.getByRole("listitem")).toHaveCount(2);
  await expect(waiting.getByAltText("Asha's photo")).toBeVisible();
  await waiting.getByRole("listitem").filter({ hasText: "Asha" }).getByRole("button", { name: "Approve" }).click();
  await waiting.getByRole("listitem").filter({ hasText: "Spam Bot" }).getByRole("button", { name: "Reject" }).click();
  await expect(page.getByRole("list", { name: "Published reviews" })).toContainText("Lovely finish");

  await page.getByRole("button", { name: "Publish changes" }).click();
  const dialog = page.getByRole("dialog", { name: "Publish to the website" });
  await expect(dialog).toContainText("1 review approved");
  await dialog.getByRole("button", { name: "Publish" }).click();
  await expect(dialog).toContainText("Published", { timeout: 30_000 });

  const reviews = JSON.parse(gh.written("content/reviews.json")!);
  expect(reviews).toEqual([
    { id: "r1", name: "Asha", city: "Pune", product: "vortex-vase", rating: 5, text: "Lovely finish, looks even better in person.", date: "2026-10-20", image: "/reviews/r1.jpg" },
  ]);
  expect(gh.raw("public/reviews/r1.jpg")!.equals(TINY_JPEG)).toBe(true);
  // both decided reviews leave the inbox, on the inbox branch
  expect(gh.rec.branches).toEqual(["main", "reviews-inbox"]);
  for (const p of ["inbox/r1.json", "inbox/r1.jpg", "inbox/r2.json"]) expect(gh.rec.tree.some((t) => t.path === p && t.sha === null)).toBe(true);
});

/** The background clean-up's ONNX runtime, served from node_modules instead of the CDN, so tests work offline. */
const localRuntime = (page: Page) =>
  page.route("https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/**", (route) => {
    const file = new URL(route.request().url()).pathname.split("/").pop()!;
    return route.fulfill({ path: `node_modules/onnxruntime-web/dist/${file}`, contentType: file.endsWith(".wasm") ? "application/wasm" : "text/javascript" });
  });

test("✨ cleans up a product photo: the product, cut out, on the shop's studio background", async ({ page }) => {
  test.setTimeout(180_000); // runs a real (small) AI model in the test browser
  // any product the owner has photographed
  const shot = (JSON.parse(fs.readFileSync("content/products.json", "utf8")) as { slug: string; name: string; images?: string[] }[]).find(
    (p) => p.images?.length,
  );
  test.skip(!shot, "no product has a photo yet");
  await prepare(page, { lite: true });
  await localRuntime(page);
  const gh = await mockGitHub(page, { password: "open sesame" });
  await page.goto("/owner/");
  await page.getByLabel("Password").fill("open sesame");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("listitem").filter({ hasText: shot!.name }).getByRole("button", { name: "Edit" }).click();
  await page.getByRole("button", { name: "Clean up the background of photo 1" }).click();
  await expect(page.getByText("Cleaning up the background")).toBeHidden({ timeout: 120_000 });
  await expect(page.getByRole("alert").filter({ hasText: "Couldn't find" })).toHaveCount(0);
  await page.getByRole("button", { name: "Publish changes" }).click();
  const dialog = page.getByRole("dialog", { name: "Publish to the website" });
  await dialog.getByRole("button", { name: "Publish" }).click();
  await expect(dialog).toContainText("Published", { timeout: 60_000 });
  const product = JSON.parse(gh.written("content/products.json")!).find((p: { slug: string }) => p.slug === shot!.slug);
  expect(product.images[0]).toMatch(new RegExp(`^/products/${shot!.slug}/\\w+-c\\.jpg$`));
  const photo = gh.raw(`public${product.images[0]}`)!;
  expect(photo.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))).toBe(true); // a JPEG
  // the old photo goes
  expect(gh.rec.tree.some((t) => t.path === `public${shot!.images![0]}` && t.sha === null)).toBe(true);
  if (process.env.OWNER_SHOTS) fs.writeFileSync(`${process.env.OWNER_SHOTS}/${shot!.slug}-clean.jpg`, photo);
});

test("new photos are cleaned up as they're added; a price typed meanwhile stays, and a broken file is reported", async ({ page }) => {
  test.setTimeout(180_000);
  await prepare(page, { lite: true });
  await localRuntime(page);
  const gh = await mockGitHub(page, { password: "open sesame" });
  const first = (JSON.parse(fs.readFileSync("content/products.json", "utf8")) as { slug: string; name: string; images?: string[] }[])[0];
  await page.goto("/owner/");
  await page.getByLabel("Password").fill("open sesame");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("listitem").filter({ hasText: first.name }).getByRole("button", { name: "Edit" }).first().click();
  await expect(page.getByRole("switch", { name: /Clean up the background/ })).toBeChecked();
  await page.locator('input[type="file"][accept="image/*"]').setInputFiles([
    { name: "piece.webp", mimeType: "image/webp", buffer: fs.readFileSync("tests/fixtures/product.webp") },
    { name: "broken.jpg", mimeType: "image/jpeg", buffer: Buffer.from("not a picture") },
  ]);
  await expect(page.getByText("Cleaning up the backgrounds")).toBeVisible();
  await page.getByLabel("Starting price").fill("1234"); // while it works
  await expect(page.getByText("Cleaning up the backgrounds")).toBeHidden({ timeout: 120_000 });
  await expect(page.getByLabel("Starting price")).toHaveValue("1234");
  await expect(page.getByRole("alert").filter({ hasText: "1 file couldn't be opened" })).toBeVisible();

  await page.getByRole("button", { name: "Publish changes" }).click();
  const dialog = page.getByRole("dialog", { name: "Publish to the website" });
  await dialog.getByRole("button", { name: "Publish" }).click();
  await expect(dialog).toContainText("Published", { timeout: 60_000 });
  const product = JSON.parse(gh.written("content/products.json")!).find((p: { slug: string }) => p.slug === first.slug);
  expect(product.price).toBe(1234);
  expect(product.images).toHaveLength((first.images?.length ?? 0) + 1);
  const photo = gh.raw(`public${product.images.at(-1)}`)!;
  expect(photo.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))).toBe(true);
});

test("owner sets the home page cover: another product and a photo of it, published together", async ({ page }) => {
  await prepare(page, { lite: true });
  const gh = await mockGitHub(page);
  await page.goto("/owner/");
  await page.getByLabel("GitHub key").fill("github_pat_test");
  await page.getByRole("button", { name: "Sign in with key" }).click();
  await page.getByRole("button", { name: "Shop settings" }).click();

  await page.getByLabel("Product on the cover").selectOption("infinity-knot");
  await page.getByRole("switch", { name: /Clean up the background/ }).uncheck(); // keep the photo as taken
  await page.getByLabel("Cover photo").setInputFiles({ name: "knot.jpg", mimeType: "image/jpeg", buffer: TINY_JPEG });
  await expect(page.getByAltText("Cover photo")).toBeVisible();

  await page.getByRole("button", { name: "Publish changes" }).click();
  const dialog = page.getByRole("dialog", { name: "Publish to the website" });
  await dialog.getByRole("button", { name: "Publish" }).click();
  await expect(dialog).toContainText("Published", { timeout: 60_000 });
  const home = JSON.parse(gh.written("content/shop.json")!).home;
  expect(home.heroProduct).toBe("infinity-knot");
  expect(home.heroImage).toMatch(/^\/home\/cover-\w+\.jpg$/);
  expect(home.heroImageCut).toBe(false);
  expect(gh.raw(`public${home.heroImage}`)!.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))).toBe(true);
});
