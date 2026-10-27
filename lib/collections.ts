import { categories, isLightFinish, photoColour, photosFor, products, type Product } from "./products";
import { renderFor } from "./renders";

export type Collection = {
  name: string;
  items: Product[];
  /** one picture for the collection: its first piece's photo or studio picture */
  cover?: string;
  /** up to three studio pictures (transparent) of different pieces, for a small group shot */
  group: string[];
  /** everything pictured is in a pale colour, so it goes on the dark backdrop */
  dark: boolean;
  href: string;
};

/** A piece's colour for a group picture: one that shows up on the light backdrop, when it comes in one. */
const pictured = (p: Product) => p.finishes.find((f) => !isLightFinish(f)) ?? p.finishes[0];

/** The owner's collections (domains) that have something in them, each with pictures of its pieces. */
export function collections(): Collection[] {
  return categories
    .map((name) => {
      const items = products.filter((p) => p.category === name);
      const first = items[0];
      const f = first && pictured(first);
      // its first piece's own cover photo, else its photo or studio picture
      const own = first && (first.coverSmall ?? first.cover);
      const photo = first && photosFor(first, f).list[0];
      const cover = first ? (own ?? photo ?? renderFor(first, f)) : undefined;
      // only studio pictures stand together (photos have their own backgrounds)
      const standing = items.filter((p) => !photosFor(p, p.finishes[0]).list.length && renderFor(p, pictured(p))).slice(0, 3);
      const group = standing.map((p) => renderFor(p, pictured(p))!);
      const dark =
        group.length >= 2 ? standing.every((p) => isLightFinish(pictured(p))) : !!first && !own && isLightFinish(photo ? photoColour(first, f) : f);
      return { name, items, cover, group, dark, href: `/shop/?c=${encodeURIComponent(name)}` };
    })
    .filter((c) => c.items.length > 0);
}
