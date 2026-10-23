import type { Metadata } from "next";
import { CheckoutForm } from "@/components/CheckoutForm";
import { KineticText } from "@/components/ui";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-24 sm:px-8 sm:pt-36">
      <h1 className="font-display text-5xl font-extrabold display-case leading-[0.9] tracking-tight sm:text-7xl">
        <KineticText text="Checkout" />
      </h1>
      <p className="mb-6 mt-3 text-muted sm:mb-10 sm:text-lg">
        <span className="font-semibold text-fg">Lock it in:</span> two minutes, then we take it from here.
      </p>
      <CheckoutForm />
    </div>
  );
}
