import type { Metadata } from "next";
import { KineticText } from "@/components/ui";
import { TrackForm } from "@/components/TrackForm";
import { dispatchLabel, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Track your order",
  description: `Check where your ${site.name} order is: courier tracking or a quick WhatsApp to us.`,
  alternates: { canonical: "/track/" },
};

export default function TrackPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-28 pt-24 sm:px-6 sm:pt-32">
      <h1 className="headline-lg">
        <KineticText text="Where's my order?" />
      </h1>
      <p className="lead mt-4 max-w-xl">
        Every piece is printed for you, so it ships {dispatchLabel} working days after payment. Then it&apos;s with the courier.
      </p>
      <div className="mt-10">
        <TrackForm />
      </div>
    </div>
  );
}
