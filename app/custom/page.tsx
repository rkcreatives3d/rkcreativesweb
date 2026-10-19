import type { Metadata } from "next";
import { CustomForm } from "@/components/CustomForm";
import { CustomViewer } from "@/components/CustomViewer";
import { KineticText, SectionLabel } from "@/components/ui";
import { PhotoGrid } from "@/components/Proof";
import { customJobs } from "@/lib/content";

export const metadata: Metadata = {
  title: "Custom prints",
  description: "Send us an idea, sketch or STL and we'll 3D print it for you.",
};

const perks = [
  ["Quote in 24 h", "Send the idea, get a price and timeline."],
  ["Any file", "STL, OBJ, 3MF, or just a photo or sketch."],
  ["Revisions", "We confirm the design with you before printing."],
];

export default function CustomPage() {
  return (
    <>
      <div className="mx-auto max-w-7xl px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionLabel>Custom orders</SectionLabel>
            <h1 className="mt-4 font-display text-6xl font-extrabold display-case leading-[0.88] tracking-tight sm:text-8xl">
              <KineticText text="Dream" />
              <br />
              <KineticText text="it up" holo delay={0.15} />
            </h1>
            <p className="mt-6 max-w-md text-muted">
              Cosplay props, replacement parts, personalised gifts, architectural models. If it fits on the print bed, we can make
              it.
            </p>
            <CustomViewer />
            <ul className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {perks.map(([t, d]) => (
                <li key={t} className="rounded-2xl border border-fg/10 bg-fg/[0.03] p-4">
                  <p className="font-semibold">{t}</p>
                  <p className="mt-1 text-xs text-muted">{d}</p>
                </li>
              ))}
            </ul>
          </div>
          <CustomForm />
        </div>
      </div>
      <PhotoGrid photos={customJobs} label="Past custom jobs" title="Made for" highlight="others" />
    </>
  );
}
