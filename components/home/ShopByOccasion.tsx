import Link from "next/link";
import { occasions } from "@/lib/occasions";
import { products } from "@/lib/products";
import { renderFor } from "@/lib/renders";
import { Heading } from "../ui";

/**
 * Ways into the shop: a compact row of occasions, each with a small picture of
 * one of its pieces. Plain links and images, so it costs nothing to show.
 */
export function ShopByOccasion() {
  // each link shows a different product where it can, so the row never repeats itself
  const used = new Set<string>();
  const items = occasions
    .map((o) => ({ ...o, items: products.filter(o.test) }))
    .filter((o) => o.items.length > 0)
    .map((o) => {
      const cover = o.items.find((p) => !used.has(p.slug)) ?? o.items[0];
      used.add(cover.slug);
      return { ...o, cover };
    });

  return (
    <section className="mx-auto max-w-7xl px-5 pb-4 pt-16 sm:px-8 sm:pt-20" aria-labelledby="occasions">
      <Heading className="text-3xl leading-none sm:text-4xl">
        <span id="occasions">What&apos;s it for?</span>
      </Heading>
      <ul className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
        {items.map((o) => {
          const pic = renderFor(o.cover, o.cover.finishes[0], "sm");
          return (
            <li key={o.id}>
              <Link
                href={`/shop/?for=${o.id}`}
                className="group flex h-full items-center gap-3 rounded-2xl border border-line bg-surface p-2.5 pr-3 transition-colors hover:border-fg/30"
              >
                <span className="stage relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl">
                  {pic && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={pic} alt="" width={56} height={56} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-base display-case leading-tight">{o.label}</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {o.items.length} {o.items.length === 1 ? "piece" : "pieces"}{" "}
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
