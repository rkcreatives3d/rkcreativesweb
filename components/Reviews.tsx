import Link from "next/link";
import type { Review } from "@/lib/content";
import { allProducts, getProduct } from "@/lib/products";

/** ★★★★☆ with a readable label. */
export function Stars({ rating, className = "" }: { rating: number; className?: string }) {
  return (
    <span className={`text-pop ${className}`} role="img" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rating)}
      <span className="text-fg/20">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export const average = (list: Review[]) => (list.length ? list.reduce((n, r) => n + r.rating, 0) / list.length : 0);

const dateLabel = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "");

/**
 * One customer review, in this order: their photo of the piece (if any), the
 * stars, the customer's name, the product they ordered, then what they wrote.
 */
export function ReviewCard({ review: r, showProduct = true }: { review: Review; showProduct?: boolean }) {
  // the product as it's sold now; a hidden one keeps its name (no link), a custom print says so
  const live = r.product ? getProduct(r.product) : undefined;
  const name = live?.name ?? (r.product ? allProducts.find((x) => x.slug === r.product)?.name : undefined);
  return (
    <figure className="flex h-full flex-col overflow-hidden rounded-[var(--radius-tile)] bg-page-2">
      {r.image && (
        <a href={r.image} target="_blank" rel="noreferrer" className="block" aria-label={`Open ${r.name}'s photo`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={r.image} alt={`${r.name}'s photo${name ? ` of the ${name}` : ""}`} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
        </a>
      )}
      <div className="flex flex-1 flex-col p-5">
        <Stars rating={r.rating} />
        <figcaption className="mt-2">
          <span className="block font-semibold text-fg">
            {r.name}
            {r.city && <span className="font-normal text-muted">, {r.city}</span>}
          </span>
          {live && showProduct ? (
            <Link href={`/shop/${live.slug}/`} className="mt-0.5 inline-block text-sm text-accent hover:underline">
              {live.name}
            </Link>
          ) : (
            <span className="mt-0.5 block text-sm text-muted">{name ?? "Custom print"}</span>
          )}
        </figcaption>
        <blockquote className="mt-3 flex-1 leading-relaxed text-fg/85">“{r.text}”</blockquote>
        {r.date && <p className="mt-4 text-xs text-muted">{dateLabel(r.date)}</p>}
      </div>
    </figure>
  );
}
