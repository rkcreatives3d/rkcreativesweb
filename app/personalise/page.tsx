import type { Metadata } from "next";
import { NameplateStudio } from "@/components/NameplateStudio";
import { KineticText, SectionLabel } from "@/components/ui";
import { dispatchLabel } from "@/lib/site";

export const metadata: Metadata = {
  title: "Personalise",
  description: "Type any name and see it as a 3D-printed keychain or desk nameplate, live. Order it in a few taps.",
};

const steps = [
  ["Type it", "Any name or word, up to 14 letters."],
  ["Style it", "Keychain or desk nameplate, your colour and size."],
  ["We print it", `Printed, checked and dispatched in ${dispatchLabel} days.`],
];

export default function PersonalisePage() {
  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
      <SectionLabel>Personalise</SectionLabel>
      <h1 className="mt-4 font-display text-6xl font-extrabold display-case leading-[0.88] tracking-tight sm:text-8xl">
        <KineticText text="Your name" />
        <br />
        <KineticText text="in gold" holo delay={0.15} />
      </h1>
      <ol className="mb-10 mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted">
        {steps.map(([t, d], i) => (
          <li key={t}>
            <span className="tabular-nums text-pop">0{i + 1}</span> <span className="font-semibold text-fg">{t}</span> · {d}
          </li>
        ))}
      </ol>
      <NameplateStudio />
    </div>
  );
}
