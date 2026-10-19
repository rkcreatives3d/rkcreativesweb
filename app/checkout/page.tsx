import type { Metadata } from "next";
import { CheckoutForm } from "@/components/CheckoutForm";
import { KineticText, SectionLabel } from "@/components/ui";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
      <SectionLabel>Checkout</SectionLabel>
      <h1 className="mb-10 mt-4 font-display text-6xl font-extrabold display-case leading-[0.9] tracking-tight sm:text-8xl">
        <KineticText text="Lock it" /> <KineticText text="in" holo delay={0.15} />
      </h1>
      <CheckoutForm />
    </div>
  );
}
