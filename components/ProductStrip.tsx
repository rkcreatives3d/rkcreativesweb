"use client";

import Link from "next/link";
import { getProduct, photosFor, type Product } from "@/lib/products";
import { renderFor } from "@/lib/renders";
import { formatPrice } from "@/lib/site";
import { useShelf } from "@/lib/shelf";

/** A sideways-scrolling row of small product pictures (no 3D: cheap to show anywhere). */
export function ProductStrip({ products, title, id }: { products: Product[]; title: string; id: string }) {
  if (!products.length) return null;
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="font-display text-2xl font-extrabold display-case leading-none tracking-tight sm:text-3xl">
        {title}
      </h2>
      <ul className="-mx-5 mt-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:-mx-8 sm:px-8 [&::-webkit-scrollbar]:hidden">
        {products.map((p) => {
          const f = p.finishes[0];
          const src = photosFor(p, f).list[0] ?? renderFor(p, f, "sm");
          return (
            <li key={p.slug} className="w-36 shrink-0 snap-start sm:w-44">
              <Link href={`/shop/${p.slug}/`} className="group block">
                <span className="stage block aspect-square overflow-hidden rounded-2xl border border-line">
                  {src && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt="" width={200} height={200} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  )}
                </span>
                <span className="mt-2 block truncate text-sm font-semibold group-hover:text-accent">{p.name}</span>
                <span className="block tabular-nums text-xs text-muted">from {formatPrice(p.price)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** "Recently viewed", from this browser's history (lib/shelf.ts). Hidden until there's something to show. */
export function RecentlyViewed({ exclude, className = "" }: { exclude?: string; className?: string }) {
  const recent = useShelf((s) => s.recent);
  const list = recent
    .filter((slug) => slug !== exclude)
    .map((slug) => getProduct(slug))
    .filter((p): p is Product => !!p);
  if (!list.length) return null;
  return (
    <div className={className}>
      <ProductStrip products={list} title="Recently viewed" id="recently-viewed" />
    </div>
  );
}
