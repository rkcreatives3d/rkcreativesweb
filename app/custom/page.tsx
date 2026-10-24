import type { Metadata } from "next";
import { CustomForm } from "@/components/CustomForm";
import { CustomViewer } from "@/components/CustomViewer";
import { BeforeAfter } from "@/components/BeforeAfter";
import { KineticText, Reveal, SectionLabel } from "@/components/ui";
import { PhotoGrid } from "@/components/Proof";
import { beforeAfter, customJobs } from "@/lib/content";
import { dispatchLabel } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/custom/" },
  title: "Custom prints",
  description: "Send us a photo, sketch or STL. We model it, you approve it, we 3D print it.",
};

const steps: [string, string][] = [
  ["You send a photo", "A photo, sketch, link or STL file, plus the size and colour you have in mind."],
  ["We model it", "We design it in 3D and reply with a price and timeline, usually within 24 hours."],
  ["You approve", "You see renders of the model and ask for changes. Nothing is printed until you say yes."],
  ["We print and ship", `Printed, finished by hand and dispatched in ${dispatchLabel} working days.`],
];

export default function CustomPage() {
  return (
    <>
      <div className="mx-auto max-w-7xl px-5 pt-24 sm:px-8 sm:pt-36">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <SectionLabel>Custom orders</SectionLabel>
            <h1 className="mt-4 font-display text-5xl font-extrabold display-case leading-[0.88] tracking-tight sm:text-7xl lg:text-8xl">
              <KineticText text="Custom" />
              <br />
              <KineticText text="prints" delay={0.15} />
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted sm:mt-6">
              <span className="font-semibold text-fg">Dream it up, we print it.</span> Cosplay props, replacement parts, personalised
              gifts, figurines, architectural models. If it fits on the print bed, we can make it.
            </p>
            <a href="#request" className="btn btn-primary mt-6">
              Start a custom order ↓
            </a>
          </div>
          <CustomViewer />
        </div>

        {/* how it works */}
        {/* phones: a compact numbered list; wider screens: four cards */}
        <ol className="relative mt-10 grid gap-2 sm:mt-16 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4" aria-label="How a custom order works">
          {steps.map(([title, body], i) => (
            <Reveal
              as="li"
              key={title}
              delay={i * 0.08}
              className="relative flex h-full gap-4 rounded-2xl border border-line bg-surface p-4 sm:block sm:rounded-3xl sm:p-6"
            >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-pop/15 font-display text-lg font-bold tabular-nums text-pop">
                  {i + 1}
                </span>
                <span className="block min-w-0">
                  <span className="block font-display text-lg font-bold sm:mt-4 sm:text-2xl">{title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-muted sm:mt-2">{body}</span>
                </span>
                {i < steps.length - 1 && (
                  <span aria-hidden className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 text-xl text-pop lg:block">
                    →
                  </span>
                )}
            </Reveal>
          ))}
        </ol>
      </div>

      <BeforeAfter items={beforeAfter} />

      <section className="mx-auto max-w-3xl px-5 py-20 sm:px-8" aria-labelledby="request">
        <h2 id="request" className="section-title text-3xl sm:text-[2.6rem]">
          Tell us about it
        </h2>
        <p className="mb-8 mt-3 text-muted">The more detail, the faster and closer the quote.</p>
        <CustomForm />
      </section>
      <PhotoGrid photos={customJobs} label="Past custom jobs" title="Made for" highlight="others" />
    </>
  );
}
