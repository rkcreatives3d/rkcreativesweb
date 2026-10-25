import type { Metadata } from "next";
import { Stars, average } from "@/components/Reviews";
import { ReviewsTabs } from "@/components/ReviewsTabs";
import { SectionLabel } from "@/components/ui";
import { reviews } from "@/lib/content";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Customer reviews",
  description: `What customers say about their ${site.name} prints, with their photos. Bought from us? Write a new review.`,
  alternates: { canonical: "/reviews/" },
};

export default function ReviewsPage() {
  const avg = average(reviews);
  return (
    <div className="mx-auto max-w-6xl px-5 pb-28 pt-24 sm:px-6 sm:pt-32">
      <SectionLabel>From our customers</SectionLabel>
      <h1 className="headline-lg mt-2">Customer reviews</h1>
      {reviews.length ? (
        <p className="mt-4 flex items-center gap-2 text-muted">
          <Stars rating={Math.round(avg)} className="text-xl" />
          <span className="tabular-nums">
            {avg.toFixed(1)} from {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
          </span>
        </p>
      ) : (
        <p className="lead mt-4 max-w-xl">Bought something from us? Tell others what you think, with a photo of your print.</p>
      )}
      <div className="mt-8 sm:mt-10">
        <ReviewsTabs reviews={reviews} />
      </div>
    </div>
  );
}
