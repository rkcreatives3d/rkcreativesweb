import { products, type Product } from "./products";

/**
 * Products matching a search, best first: every word has to appear somewhere
 * in the name, short line, collection, material or tags; a match in the name
 * ranks higher. Used by the search in the nav and the shop page.
 */
export function searchProducts(query: string, list: Product[] = products): Product[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return list;
  return list
    .map((p) => {
      const name = p.name.toLowerCase();
      const rest = [p.tagline, p.category, p.material, ...(p.tags ?? [])].join(" ").toLowerCase();
      if (!words.every((w) => name.includes(w) || rest.includes(w))) return null;
      return { p, score: words.filter((w) => name.includes(w)).length * 2 + (name.startsWith(words[0]) ? 1 : 0) };
    })
    .filter((x): x is { p: Product; score: number } => !!x)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);
}
