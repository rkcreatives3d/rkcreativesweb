// ─────────────────────────────────────────────────────────────
//  Product catalogue. The data lives in content/*.json, which the owner page
//  (/owner/) edits and publishes; you can also edit those files by hand.
//    content/products.json   the products, in shop order
//    content/finishes.json   the filament colours customers can pick
//    content/shop.json       contact, payment and shipping settings, categories
//  `shape` picks the procedural 3D placeholder shown when a product has
//  neither a 3D model (models/<slug>.stl …) nor photos.
// ─────────────────────────────────────────────────────────────

import productData from "@/content/products.json";
import finishData from "@/content/finishes.json";
import shopData from "@/content/shop.json";

export type Shape =
  | "vase"
  | "knot"
  | "lattice"
  | "gear"
  | "planter"
  | "mobius"
  | "serpent"
  | "crystal"
  | "saturn"
  | "stand"
  | "keychain"
  | "nameplate";

/** One of shop.json `categories` (the owner page can add more). */
export type Category = string;

/** Quick-filter tags on the shop page. */
export type Tag = "bestseller" | "gift" | "festive" | "birthday" | "desk" | "car";

/** How a filament looks; the owner page works out the material settings from it. */
export type FinishKind = "matte" | "silk" | "glossy";

export type Finish = {
  id: string;
  name: string;
  kind?: FinishKind;
  /** CSS background for the swatch chip */
  swatch: string;
  color: string;
  metalness: number;
  roughness: number;
  iridescence: number;
  clearcoat: number;
  emissive: string;
  emissiveIntensity: number;
};

export type Size = {
  id: string;
  label: string;
  dims: string;
  priceDelta: number;
};

export type Product = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  category: Category;
  shape: Shape;
  finishes: string[];
  sizes: Size[];
  material: string;
  printTime: string;
  badge?: string;
  tags?: Tag[];
  /** e.g. ["/products/vortex-vase-1.jpg", "/products/vortex-vase-2.jpg"] — first one is the cover */
  images?: string[];
  /** which finish the `images` show (defaults to the first finish) */
  photoFinish?: string;
  /** real photos per colour, e.g. { gold: ["/products/vase-gold.jpg"], onyx: ["/products/vase-black.jpg"] } */
  colorPhotos?: Partial<Record<string, string[]>>;
  /** a photo of it in someone's hand or on a desk, shown in the size guide, e.g. "/products/vase-in-hand.jpg" */
  scalePhoto?: string;
  /** extra questions for this product, shown above the standard ones: [["Is it waterproof?", "Yes, …"]] */
  faq?: [string, string][];
  /**
   * Real 3D model. Usually leave this out: drop `<slug>.stl` / `.3mf` / `.obj`
   * into models/ and it's converted and picked up automatically (lib/models.ts).
   */
  model?: string;
  /**
   * "optional": customers can add a name / message for site.engravingPrice.
   * "included": the product IS the name (keychains, nameplates) — text required, no extra charge.
   */
  personalisation?: "optional" | "included";
  /** hidden from the shop (a draft, or out of stock for now) */
  hidden?: boolean;
};

// The filaments you stock (content/finishes.json). Customers can only pick these.
// `color` is what the 3D preview renders and what photos are recoloured to,
// so match it to the real spool.
export const finishes = finishData as Finish[];

const finishMap = new Map(finishes.map((f) => [f.id, f]));
export const getFinish = (id: string) => finishMap.get(id) ?? finishes[0];

/** Every product, including hidden ones (the owner page needs them all). */
export const allProducts = productData as Product[];

/** What the shop shows, in the owner's order. */
export const products = allProducts.filter((p) => !p.hidden);

export const categories: Category[] = shopData.categories;

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);

/**
 * Photos to show for a product in a finish. `recolor` is true when they're the
 * generic photos and should be colour-previewed into that finish.
 */
export function photosFor(p: Product, finish: string): { list: string[]; recolor: boolean } {
  const own = p.colorPhotos?.[finish];
  if (own?.length) return { list: own, recolor: false };
  const list = p.images ?? [];
  return { list, recolor: list.length > 0 && finish !== (p.photoFinish ?? p.finishes[0]) };
}

export const unitPrice = (p: Product, sizeId: string) =>
  p.price + (p.sizes.find((s) => s.id === sizeId)?.priceDelta ?? 0);
