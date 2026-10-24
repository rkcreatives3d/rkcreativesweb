import Link from "next/link";
import type { Review } from "@/lib/content";
import { getProduct } from "@/lib/products";

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

/** One customer review: stars, words, their photo of the piece, who and when. */
export function ReviewCard({ review: r, showProduct = true }: { review: Review; showProduct?: boolean }) {
  const p = r.product ? getProduct(r.product) : undefined;
  return (
    <figure className="flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-surface">
      {r.image && (
        <a href={r.image} target="_blank" rel="noreferrer" className="block" aria-label={`Open ${r.name}'s photo`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={r.image} alt={`${r.name}'s photo${p ? ` of the ${p.name}` : ""}`} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
        </a>
      )}
      <div className="flex flex-1 flex-col p-5">
        <Stars rating={r.rating} />
        <blockquote className="mt-3 flex-1 leading-relaxed text-fg/85">“{r.text}”</blockquote>
        <figcaption className="mt-4 text-sm text-muted">
          <span className="font-semibold text-fg">{r.name}</span>
          {r.city && `, ${r.city}`}
          {r.date && ` · ${dateLabel(r.date)}`}
          {showProduct && p && (
            <Link href={`/shop/${p.slug}/`} className="mt-1 block text-accent hover:underline">
              {p.name} →
            </Link>
          )}
        </figcaption>
      </div>
    </figure>
  );
}
