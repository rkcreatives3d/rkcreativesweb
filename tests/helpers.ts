import fs from "node:fs";
import type { Page } from "@playwright/test";

type ShopProduct = { slug: string; name: string; hidden?: boolean; personalisation?: string };

/** The shop's products as the owner left them: they add and delete pieces, so tests pick from what's there. */
export const shopProducts = (JSON.parse(fs.readFileSync("content/products.json", "utf8")) as ShopProduct[]).filter((p) => !p.hidden);

/** An ordinary piece (bought as it is, no name to type), other than the `not` slugs. */
export const somePiece = (...not: string[]) => {
  const p = shopProducts.find((x) => !x.personalisation && !not.includes(x.slug));
  if (!p) throw new Error("no ordinary product in content/products.json to test with");
  return p;
};

export const pages = [
  "/",
  "/shop/",
  "/collections/",
  "/shop/vortex-vase/",
  "/shop/name-keychain/",
  "/personalise/",
  "/custom/",
  "/about/",
  "/contact/",
  "/track/",
  "/saved/",
  "/reviews/",
  "/guides/",
  "/guides/pla-vs-petg/",
  "/policies/shipping/",
  "/policies/returns/",
];

/**
 * Before any page script runs: skip the intro (unless asked), choose the full
 * 3D site or Lite mode explicitly (test machines often have no GPU), stub
 * window.open, and count WebGL draw calls.
 */
export async function prepare(page: Page, { intro = false, lite = false } = {}) {
  await page.addInitScript(
    ({ intro, lite }) => {
      try {
        if (!intro) sessionStorage.setItem("rk-intro", "1");
        localStorage.setItem("rk-lite-v2", lite ? "1" : "0");
      } catch {}
      const w = window as unknown as { __opened: string[]; __draws: number };
      w.__opened = [];
      window.open = ((u: string) => {
        w.__opened.push(String(u));
        return null;
      }) as typeof window.open;
      w.__draws = 0;
      for (const C of [window.WebGL2RenderingContext, window.WebGLRenderingContext]) {
        if (!C) continue;
        for (const fn of ["drawElements", "drawArrays"] as const) {
          const orig = C.prototype[fn] as (...a: unknown[]) => void;
          (C.prototype as unknown as Record<string, unknown>)[fn] = function (this: unknown, ...a: unknown[]) {
            w.__draws++;
            return orig.apply(this, a);
          };
        }
      }
    },
    { intro, lite },
  );
}

export const draws = (page: Page) => page.evaluate(() => (window as unknown as { __draws: number }).__draws);
export const opened = (page: Page) => page.evaluate(() => (window as unknown as { __opened: string[] }).__opened);
