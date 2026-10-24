import type { Metadata } from "next";
import { NameplateStudio } from "@/components/NameplateStudio";
import { KineticText } from "@/components/ui";
import { dispatchLabel } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/personalise/" },
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
    <div className="mx-auto max-w-6xl px-5 pb-28 pt-24 sm:px-6 sm:pt-32">
      <p className="eyebrow">Personalised</p>
      <h1 className="headline-lg mt-2">
        <KineticText text="Your name, in raised letters." />
      </h1>
      <ol className="mb-10 mt-5 flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted">
        {steps.map(([t, d], i) => (
          <li key={t}>
            <span className="tabular-nums">0{i + 1}</span> <span className="font-medium text-fg">{t}</span> · {d}
          </li>
        ))}
      </ol>
      <NameplateStudio />
    </div>
  );
}
