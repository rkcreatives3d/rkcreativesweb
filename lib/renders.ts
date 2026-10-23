import generated from "./renders.generated.json";
import type { Product } from "./products";

// Studio pictures of each product's 3D model, one per colour, made by
// `npm run renders` (scripts/render-products.mjs). Used wherever live 3D is
// too heavy or too small: the cart, checkout, Lite mode, share cards.
// Real photos (lib/products.ts `images`) always win over these.

const made = generated as Record<string, string[]>;

export type RenderSize = "sm" | "lg";

/** A studio picture of the product in this colour (sm ≈ 200 px, lg ≈ 720 px), if one has been made. */
export function renderFor(p: Product | string, finish: string, size: RenderSize = "lg"): string | undefined {
  const slug = typeof p === "string" ? p : p.slug;
  if (!made[slug]?.includes(finish)) return undefined;
  return `/renders/${slug}/${finish}${size === "sm" ? "-sm" : ""}.webp`;
}

/** The share-card picture (default colour, JPEG for the share-image renderer). */
export const renderCoverFor = (p: Product): string | undefined =>
  made[p.slug]?.includes(p.finishes[0]) ? `/renders/${p.slug}/cover.jpg` : undefined;
