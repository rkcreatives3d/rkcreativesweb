import Link from "next/link";
import { categories, photosFor, products } from "@/lib/products";
import { renderFor } from "@/lib/renders";
import { Heading } from "../ui";

/**
 * Ways into the shop: the collections the owner sorts products into (Decor,
 * Giftables, Devotion …), each with a small picture of one of its pieces.
 * Empty collections stay hidden. Plain links and images: costs nothing to show.
 */
export function ShopByCollection() {
  const items = categories
    .map((c) => ({ name: c, items: products.filter((p) => p.category === c) }))
    .filter((c) => c.items.length > 0);

  return (
    <section className="mx-auto max-w-7xl px-5 pb-4 pt-16 sm:px-8 sm:pt-20" aria-labelledby="collections">
      <Heading className="text-3xl leading-none sm:text-4xl">
        <span id="collections">Collections</span>
      </Heading>
      <ul className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
        {items.map((c) => {
          const cover = c.items[0];
          const f = cover.finishes[0];
          const pic = photosFor(cover, f).list[0] ?? renderFor(cover, f, "sm");
          return (
            <li key={c.name}>
              <Link
                href={`/shop/?c=${encodeURIComponent(c.name)}`}
                className="group flex h-full items-center gap-3 overflow-hidden rounded-2xl border border-line bg-surface p-2.5 pr-3 transition-colors hover:border-fg/30"
              >
                <span className="stage relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl">
                  {pic && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={pic} alt="" width={56} height={56} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-base display-case leading-tight [overflow-wrap:anywhere]">{c.name}</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {c.items.length} {c.items.length === 1 ? "piece" : "pieces"}{" "}
                    <span aria-hidden className="inline-block text-accent transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
