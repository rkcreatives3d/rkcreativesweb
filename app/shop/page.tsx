import type { Metadata } from "next";
import { ShopGrid } from "@/components/ShopGrid";
import { KineticText, SectionLabel } from "@/components/ui";

export const metadata: Metadata = { title: "Shop" };

export default function ShopPage() {
  return (
    <div className="pt-28 sm:pt-36">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionLabel>Every object printed to order</SectionLabel>
        <h1 className="mt-4 font-display text-[18vw] font-extrabold display-case leading-[0.85] tracking-[-0.04em] sm:text-[11vw] lg:text-[9rem]">
          <KineticText text="The" />{" "}
          <KineticText text="drop" holo delay={0.15} />
        </h1>
      </div>
      <div className="mx-auto mt-10 max-w-7xl px-5 pb-24 sm:px-8">
        <ShopGrid />
      </div>
    </div>
  );
}
