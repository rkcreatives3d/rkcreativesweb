import type { Photo, Review } from "@/lib/content";
import { site } from "@/lib/site";
import { ButtonLink, Reveal, SectionLabel } from "./ui";
import { ReviewCard, Stars, average } from "./Reviews";

// Trust sections built from lib/content.ts. Each one renders nothing until it
// has real content, so the site never shows placeholder reviews or photos.

export function PhotoGrid({ photos, label, title, highlight }: { photos: Photo[]; label: string; title: string; highlight: string }) {
  if (!photos.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
      <SectionLabel>{label}</SectionLabel>
      <Reveal y={24}>
        <h2 className="mt-4 font-display text-4xl font-extrabold display-case leading-none tracking-tight sm:text-5xl">
          {title} {highlight}
        </h2>
      </Reveal>
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
  const avg = average(reviews);
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <SectionLabel>Reviews</SectionLabel>
          <Reveal y={24}>
            <h2 className="mt-4 font-display text-4xl font-extrabold display-case leading-none tracking-tight sm:text-5xl">
              Loved by people
            </h2>
          </Reveal>
        </div>
        <p className="flex items-center gap-2 tabular-nums text-sm text-muted">
          <Stars rating={Math.round(avg)} /> {avg.toFixed(1)} from {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
        </p>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.slice(0, 6).map((r, i) => (
          <Reveal key={r.id ?? i} delay={(i % 3) * 0.08}>
            <ReviewCard review={r} />
          </Reveal>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/reviews/">All reviews →</ButtonLink>
        <ButtonLink href="/reviews/#write">Write a review</ButtonLink>
      </div>
    </section>
  );
}

export function InstagramGrid({ posts }: { posts: (Photo & { href: string })[] }) {
  if (!posts.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <SectionLabel>On Instagram</SectionLabel>
          <Reveal y={24}>
            <h2 className="mt-4 font-display text-4xl font-extrabold display-case leading-none tracking-tight sm:text-5xl">
              Fresh from the studio
            </h2>
          </Reveal>
        </div>
        <a href={site.instagram} target="_blank" rel="noreferrer" className="text-sm font-semibold underline underline-offset-4 hover:text-accent">
          @{site.handle} →
        </a>
      </div>
      <ul className="mt-10 grid grid-cols-3 gap-2 sm:gap-4 lg:grid-cols-6">
        {posts.slice(0, 12).map((p) => (
          <li key={p.href}>
            <a href={p.href} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-xl border border-fg/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.src}
                alt={p.caption ?? "Instagram post"}
                loading="lazy"
                className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
