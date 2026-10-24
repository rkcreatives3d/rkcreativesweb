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
        <p className="mt-4 max-w-xl text-muted">No reviews yet. Bought something from us? Be the first to tell others what you think.</p>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
        <section aria-label="Customer reviews" className="order-2 lg:order-1">
          {reviews.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {reviews.map((r, i) => (
                <ReviewCard key={r.id ?? i} review={r} />
              ))}
            </div>
          ) : (
            <p className="rounded-3xl border border-dashed border-line p-8 text-center text-muted">Reviews customers send appear here, with their photos.</p>
          )}
        </section>
        <section id="write" aria-labelledby="write-title" className="order-1 lg:order-2 lg:sticky lg:top-28 lg:self-start">
          <h2 id="write-title" className="mb-4 font-display text-2xl font-extrabold display-case">
            Write a review
          </h2>
          <ReviewForm />
        </section>
      </div>
    </div>
  );
}
