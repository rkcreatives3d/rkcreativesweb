import Link from "next/link";
import type { Photo, Review } from "@/lib/content";
import { site } from "@/lib/site";
import { ButtonLink, Reveal, SectionLabel } from "./ui";
import { ReviewCard, Stars, average } from "./Reviews";
import { InstagramIcon } from "./Icons";

// Trust sections built from lib/content.ts. Each one renders nothing until it
// has real content, so the site never shows placeholder reviews or photos
// (the Instagram grid shows a plain "follow us" strip instead).

export function PhotoGrid({ photos, label, title, highlight }: { photos: Photo[]; label: string; title: string; highlight: string }) {
  if (!photos.length) return null;
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 sm:px-6">
      <SectionLabel>{label}</SectionLabel>
      <Reveal y={24}>
        <h2 className="mt-4 section-title text-3xl sm:text-[2.6rem]">
          {title} {highlight}
        </h2>
      </Reveal>
      <div className="mt-10 columns-2 gap-4 sm:columns-3 lg:columns-4">
        {photos.map((p, i) => (
          <Reveal key={p.src} delay={(i % 4) * 0.06} className="mb-4 break-inside-avoid">
            <figure className="overflow-hidden rounded-[var(--radius-tile)]">
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
    <section className="mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <SectionLabel>Customer reviews</SectionLabel>
          <Reveal y={24}>
            <h2 className="headline-md mt-2">What our customers say.</h2>
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
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
        <ButtonLink href="/reviews/#all" primary>
          View all customer reviews
        </ButtonLink>
        <Link href="/reviews/#write" className="link-more">
          Write a new review
        </Link>
      </div>
    </section>
  );
}

/** Until there are posts to show: one line about the account and a way to follow it. */
function InstagramFollow() {
  return (
    <section className="px-3 py-3 sm:px-4 sm:py-4" aria-labelledby="instagram-title">
      <Reveal className="mx-auto flex max-w-[90rem] flex-col items-center gap-5 rounded-[var(--radius-tile)] bg-page-2 px-6 py-12 text-center lg:flex-row lg:justify-between lg:px-16 lg:text-left">
        <div className="flex flex-col items-center gap-4 lg:flex-row lg:gap-5">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-page text-fg">
            <InstagramIcon size={26} />
          </span>
          <div>
            <h2 id="instagram-title" className="text-2xl font-semibold tracking-tight">
              Follow the studio on Instagram.
            </h2>
            <p className="mt-1 text-muted">New prints, behind the scenes, and first looks at new pieces.</p>
          </div>
        </div>
        <a href={site.instagram} target="_blank" rel="noreferrer" className="btn btn-primary shrink-0">
          Follow @{site.handle}
        </a>
      </Reveal>
    </section>
  );
}

export function InstagramGrid({ posts }: { posts: (Photo & { href: string })[] }) {
  if (!posts.length) return site.instagram ? <InstagramFollow /> : null;
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <SectionLabel>On Instagram</SectionLabel>
          <Reveal y={24}>
            <h2 className="mt-4 section-title text-3xl sm:text-[2.6rem]">
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
