import type { Metadata } from "next";
import { CheckoutForm } from "@/components/CheckoutForm";
import { KineticText } from "@/components/ui";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-24 sm:px-6 sm:pt-32">
      <h1 className="headline-lg">
        <KineticText text="Checkout" />
      </h1>
      <p className="lead mb-8 mt-3 sm:mb-10">Two minutes, then we take it from here.</p>
      <CheckoutForm />
    </div>
  );
}
