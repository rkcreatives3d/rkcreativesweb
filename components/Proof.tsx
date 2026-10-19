import type { Photo, Review } from "@/lib/content";
import { getProduct } from "@/lib/products";
import { KineticText, Reveal, SectionLabel } from "./ui";

// Trust sections built from lib/content.ts. Each one renders nothing until it
// has real content, so the site never shows placeholder reviews or photos.

export function PhotoGrid({ photos, label, title, highlight }: { photos: Photo[]; label: string; title: string; highlight: string }) {
  if (!photos.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
      <SectionLabel>{label}</SectionLabel>
      <h2 className="mt-4 font-display text-4xl font-extrabold display-case leading-[0.9] tracking-tight sm:text-6xl">
        <KineticText text={title} /> <KineticText text={highlight} holo delay={0.15} />
      </h2>
      <div className="mt-10 columns-2 gap-4 sm:columns-3 lg:columns-4">
        {photos.map((p, i) => (
          <Reveal key={p.src} delay={(i % 4) * 0.06} className="mb-4 break-inside-avoid">
            <figure className="overflow-hidden rounded-3xl border border-fg/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.src} alt={p.caption ?? ""} loading="lazy" className="w-full transition-transform duration-700 hover:scale-105" />
              {p.caption && <figcaption className="px-4 py-3 text-xs text-muted">{p.caption}</figcaption>}
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function Reviews({ reviews }: { reviews: Review[] }) {
  if (!reviews.length) return null;
  const avg = reviews.reduce((n, r) => n + r.rating, 0) / reviews.length;
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <SectionLabel>Reviews</SectionLabel>
          <h2 className="mt-4 font-display text-4xl font-extrabold display-case leading-[0.9] tracking-tight sm:text-6xl">
            <KineticText text="Loved by" /> <KineticText text="people" holo delay={0.15} />
          </h2>
        </div>
        <p className="font-mono text-sm text-muted">
          <span className="text-accent">{"★".repeat(Math.round(avg))}</span> {avg.toFixed(1)} from {reviews.length}{" "}
          {reviews.length === 1 ? "review" : "reviews"}
        </p>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((r, i) => (
          <Reveal key={i} delay={(i % 3) * 0.08}>
            <figure className="h-full rounded-[28px] border border-fg/10 bg-fg/[0.03] p-6">
              <p className="text-accent" aria-label={`${r.rating} out of 5 stars`}>
                {"★".repeat(r.rating)}
                <span className="text-fg/20">{"★".repeat(5 - r.rating)}</span>
              </p>
              <blockquote className="mt-3 leading-relaxed text-fg/85">“{r.text}”</blockquote>
              <figcaption className="mt-4 text-sm text-muted">
                {r.name}
                {r.city && `, ${r.city}`}
                {r.product && getProduct(r.product) && <span className="text-accent-2"> · {getProduct(r.product)!.name}</span>}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
