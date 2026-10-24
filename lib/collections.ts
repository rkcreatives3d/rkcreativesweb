import { categories, photosFor, products, type Product } from "./products";
import { renderFor } from "./renders";

export type Collection = { name: string; items: Product[]; cover?: string; href: string };

/** The owner's collections (domains) that have something in them, each with a picture of one of its pieces. */
export function collections(): Collection[] {
  return categories
    .map((name) => {
      const items = products.filter((p) => p.category === name);
      const first = items[0];
      const f = first?.finishes[0];
      const cover = first ? (photosFor(first, f).list[0] ?? renderFor(first, f)) : undefined;
      return { name, items, cover, href: `/shop/?c=${encodeURIComponent(name)}` };
    })
    .filter((c) => c.items.length > 0);
}
