import type { Metadata } from "next";
import { ShopGrid } from "@/components/ShopGrid";
import { KineticText, SectionLabel } from "@/components/ui";

export const metadata: Metadata = {
  title: "Shop",
  description: "Every 3D print we make: decor, lamps, desk gear, toys and personalised gifts. Printed to order, shipped across India.",
  alternates: { canonical: "/shop/" },
};

export default function ShopPage() {
  return (
    <div className="pt-24 sm:pt-36">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionLabel>Every object printed to order</SectionLabel>
        <h1 className="mt-3 font-display text-5xl font-extrabold display-case leading-[0.88] tracking-tight sm:mt-4 sm:text-7xl lg:text-8xl">
          <KineticText text="Shop" />{" "}
          <KineticText text="all prints" holo delay={0.12} />
        </h1>
        <p className="mt-3 max-w-xl text-muted sm:mt-4 sm:text-lg">The latest drop: decor, lamps, desk gear and gifts, printed for you and shipped across India.</p>
      </div>
      <div className="mx-auto mt-6 max-w-7xl px-5 pb-24 sm:mt-10 sm:px-8">
        <ShopGrid />
      </div>
    </div>
  );
}
