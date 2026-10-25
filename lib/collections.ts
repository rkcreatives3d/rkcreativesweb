import { categories, photosFor, products, type Product } from "./products";
import { renderFor } from "./renders";

export type Collection = {
  name: string;
  items: Product[];
  /** one picture for the collection: its first piece's photo or studio picture */
  cover?: string;
  /** up to three studio pictures (transparent) of different pieces, for a small group shot */
  group: string[];
  href: string;
};

/** The owner's collections (domains) that have something in them, each with pictures of its pieces. */
export function collections(): Collection[] {
  return categories
    .map((name) => {
      const items = products.filter((p) => p.category === name);
      const first = items[0];
      const f = first?.finishes[0];
      const cover = first ? (photosFor(first, f).list[0] ?? renderFor(first, f)) : undefined;
      // only studio pictures stand together (photos have their own backgrounds)
      const group = items
        .filter((p) => !photosFor(p, p.finishes[0]).list.length)
        .map((p) => renderFor(p, p.finishes[0]))
        .filter((src): src is string => !!src)
        .slice(0, 3);
      return { name, items, cover, group, href: `/shop/?c=${encodeURIComponent(name)}` };
    })
    .filter((c) => c.items.length > 0);
}
