import generated from "./renders.generated.json";
import type { Product } from "./products";

// Studio pictures of each product's 3D model, one per colour, made by
// `npm run renders` (scripts/render-products.mjs). Used wherever live 3D is
// too heavy or too small: the cart, checkout, Lite mode, share cards.
// Real photos (lib/products.ts `images`) always win over these.

const made = generated as Record<string, string[]>;
/** bump when the pictures are re-made in a different style, so browsers don't keep showing cached old ones */
const V = "?v=3";

export type RenderSize = "sm" | "lg" | "xl";

/**
 * A studio picture of the product in this colour, if one has been made:
 * sm ≈ 200 px, lg ≈ 720 px, xl ≈ 1200 px (the main colour only, for big
 * pictures on the home page). Transparent, so they sit on any background.
 */
export function renderFor(p: Product | string, finish: string, size: RenderSize = "lg"): string | undefined {
  const slug = typeof p === "string" ? p : p.slug;
  if (!made[slug]?.includes(finish)) return undefined;
  if (size === "xl" && made[slug][0] !== finish) size = "lg";
  return `/renders/${slug}/${finish}${size === "sm" ? "-sm" : size === "xl" ? "-xl" : ""}.webp${V}`;
}

/** srcset for a studio picture: every size made for this colour. */
export function renderSrcSet(p: Product, finish: string): string | undefined {
  if (!renderFor(p, finish)) return undefined;
  const sizes = [`${renderFor(p, finish, "sm")} 200w`, `${renderFor(p, finish)} 720w`];
  if (made[p.slug][0] === finish) sizes.push(`${renderFor(p, finish, "xl")} 1200w`);
  return sizes.join(", ");
}
