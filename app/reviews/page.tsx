import type { Metadata } from "next";
import { ReviewCard, Stars, average } from "@/components/Reviews";
import { ReviewForm } from "@/components/ReviewForm";
import { SectionLabel } from "@/components/ui";
import { reviews } from "@/lib/content";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Reviews",
  description: `What customers say about their ${site.name} prints, with their photos. Bought from us? Leave a review.`,
  alternates: { canonical: "/reviews/" },
};

export default function ReviewsPage() {
  const avg = average(reviews);
  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-24 sm:px-8 sm:pt-36">
      <SectionLabel>From our customers</SectionLabel>
      <h1 className="mt-3 font-display text-5xl font-extrabold display-case leading-[0.9] tracking-tight sm:mt-4 sm:text-7xl">Reviews</h1>
      {reviews.length ? (
        <p className="mt-4 flex items-center gap-2 text-muted">
          <Stars rating={Math.round(avg)} className="text-xl" />
          <span className="tabular-nums">
            {avg.toFixed(1)} from {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
          </span>
        </p>
      ) : (
        <p className="mt-4 max-w-xl text-muted">Bought something from us? Tell others what you think, with a photo of your print.</p>
      )}

      {reviews.length ? (
        <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
          <section aria-label="Customer reviews" className="order-2 lg:order-1">
            <div className="grid gap-4 sm:grid-cols-2">
              {reviews.map((r, i) => (
                <ReviewCard key={r.id ?? i} review={r} />
              ))}
            </div>
          </section>
          <section id="write" aria-labelledby="write-title" className="order-1 lg:order-2 lg:sticky lg:top-28 lg:self-start">
            <h2 id="write-title" className="mb-4 section-title text-2xl">
              Write a review
            </h2>
            <ReviewForm />
          </section>
        </div>
      ) : (
        // no reviews yet: the form, with a few pointers beside it on wide screens (no empty list)
        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,36rem)_minmax(0,22rem)] lg:gap-16">
          <section id="write" aria-labelledby="write-title">
            <h2 id="write-title" className="mb-4 section-title text-2xl">
              Write a review
            </h2>
            <ReviewForm />
          </section>
          <aside aria-labelledby="tips-title" className="hidden lg:block lg:pt-12">
            <div className="card-lift rounded-3xl p-6">
              <h2 id="tips-title" className="section-title text-xl">
                What helps other buyers
              </h2>
              <ul className="mt-4 space-y-4 text-sm leading-relaxed text-fg/80">
                {[
                  ["📷", "A photo in daylight, with something next to it for size."],
                  ["🎨", "How the colour and finish look in person."],
                  ["📦", "How it was packed, and how long it took to arrive."],
                ].map(([icon, text]) => (
                  <li key={text} className="flex gap-3">
                    <span aria-hidden className="text-lg leading-6">
                      {icon}
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
              <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
                Reviews go up once we&apos;ve read them, usually within a day. Something wrong with your order? Message us on WhatsApp first and we&apos;ll put it
                right.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
