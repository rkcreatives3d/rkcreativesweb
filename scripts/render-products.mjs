// Studio pictures of every product, one per colour, taken from the site's own
// 3D product cards (shown live only in this "studio" mode, on a transparent
// stage): public/renders/<slug>/<finish>.webp (720 px), <finish>-sm.webp
// (200 px), <main colour>-xl.webp (1200 px, for the home page) — all
// transparent, with the floor shadow — and cover.jpg (share cards, on the
// stage), plus the list in lib/renders.generated.json.
//
// Run it whenever products, colours or 3D models change, with the site running:
//   npm run dev            (in another terminal)
//   npm run renders        (or: node scripts/render-products.mjs http://localhost:3000)

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const base = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const out = "public/renders";
// products with real photos show those everywhere instead, so they get no studio pictures
const photographed = new Set(
  JSON.parse(await readFile("content/products.json", "utf8"))
    .filter((p) => p.images?.length)
    .map((p) => p.slug),
);

const browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader", "--use-angle=swiftshader", "--ignore-gpu-blocklist"] });
// reduced motion: models appear already printed and colour changes simply fade
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 3.5, reducedMotion: "reduce" });
await ctx.addInitScript(() => {
  try {
    sessionStorage.setItem("rk-intro", "1");
    localStorage.setItem("rk-lite-v2", "0");
    localStorage.setItem("rk-studio", "1"); // cards show the live model (lib/studio.ts)
  } catch {}
});
const page = await ctx.newPage();
await page.goto(`${base}/shop/`, { waitUntil: "networkidle" });
// only the stage itself: no badges, no hover light, nothing fixed over the card
await page.addStyleTag({
  content: `article [data-save], header, #intro { display: none !important; }
    html, body, main, .stage { background: transparent !important; }`,
});
// the 3D engine downloads and compiles before the first card can be photographed
await page.locator("canvas").waitFor({ state: "attached", timeout: 60_000 });
await page.waitForTimeout(4000);

// encode in the browser (Chromium writes WebP and JPEG), so this needs no image libraries.
// WebP keeps the transparency; the JPEG share card is drawn on the stage (as .stage in globals.css).
async function encode(png, size, type, quality) {
  return page.evaluate(
    async ({ b64, size, type, quality }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const g = c.getContext("2d");
      if (type === "image/jpeg") {
        g.save();
        g.translate(size * 0.5, size * 0.42);
        g.scale(0.7, 0.6);
        const bg = g.createRadialGradient(0, 0, 0, 0, 0, size);
        bg.addColorStop(0, "#fcfcfd");
        bg.addColorStop(0.58, "#f5f5f7");
        bg.addColorStop(1, "#ececef");
        g.fillStyle = bg;
        g.fillRect(-size * 2, -size * 2, size * 4, size * 4);
        g.restore();
      }
      g.imageSmoothingQuality = "high";
      g.drawImage(img, 0, 0, size, size);
      const url = c.toDataURL(type, quality);
      return url.slice(url.indexOf(",") + 1);
    },
    { b64: png.toString("base64"), size, type, quality },
  );
}

const made = {};
const cards = page.locator("article");
const count = await cards.count();
for (let i = 0; i < count; i++) {
  const card = cards.nth(i);
  const href = await card.locator("a[href^='/shop/']").first().getAttribute("href");
  const slug = href.replace(/^\/shop\/|\/$/g, "");
  if (photographed.has(slug)) continue;
  const stage = card.locator(".stage");
  await stage.scrollIntoViewIfNeeded();
  await page.mouse.move(5, 5); // keep the cursor off the card (hover lifts the model)
  await page.waitForTimeout(2500); // the model loads and settles

  const swatches = card.getByRole("radio");
  const n = await swatches.count();
  made[slug] = [];
  await mkdir(join(out, slug), { recursive: true });
  for (let j = 0; j < n; j++) {
    const sw = swatches.nth(j);
    const label = await sw.getAttribute("aria-label");
    // pick the colour without moving the mouse onto the card
    await sw.dispatchEvent("click");
    await page.waitForTimeout(1400);
    const finish = await card.evaluate((el, label) => {
      const btn = [...el.querySelectorAll("[role=radio]")].find((b) => b.getAttribute("aria-label") === label);
      return btn?.dataset.finish ?? null;
    }, label);
    if (!finish) throw new Error(`no data-finish on the ${label} swatch of ${slug}`);
    const png = await stage.screenshot({ animations: "disabled", omitBackground: true });
    await writeFile(join(out, slug, `${finish}.webp`), Buffer.from(await encode(png, 720, "image/webp", 0.82), "base64"));
    await writeFile(join(out, slug, `${finish}-sm.webp`), Buffer.from(await encode(png, 200, "image/webp", 0.8), "base64"));
    if (j === 0) {
      await writeFile(join(out, slug, `${finish}-xl.webp`), Buffer.from(await encode(png, 1200, "image/webp", 0.86), "base64"));
      await writeFile(join(out, slug, "cover.jpg"), Buffer.from(await encode(png, 630, "image/jpeg", 0.85), "base64"));
    }
    made[slug].push(finish);
    console.log(`${slug} · ${finish}`);
  }
}

await writeFile("lib/renders.generated.json", JSON.stringify(made, null, 2) + "\n");
console.log(`\n${Object.values(made).flat().length} pictures of ${Object.keys(made).length} products in ${out}/`);
await browser.close();
