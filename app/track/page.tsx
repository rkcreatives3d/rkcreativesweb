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
    <div className="mx-auto max-w-4xl px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
      <h1 className="font-display text-6xl font-extrabold display-case leading-[0.88] tracking-tight sm:text-8xl">
        <KineticText text="Where's my" />
        <br />
        <KineticText text="order?" delay={0.15} />
      </h1>
      <p className="mt-6 max-w-xl text-lg text-muted">
        Every piece is printed for you, so it ships {dispatchLabel} working days after payment. Then it&apos;s with the courier.
      </p>
      <div className="mt-10">
        <TrackForm />
      </div>
    </div>
  );
}
