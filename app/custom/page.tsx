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
      <div className="mx-auto max-w-7xl px-5 pt-28 sm:px-8 sm:pt-36">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <SectionLabel>Custom orders</SectionLabel>
            <h1 className="mt-4 font-display text-6xl font-extrabold display-case leading-[0.88] tracking-tight sm:text-8xl">
              <KineticText text="Dream" />
              <br />
              <KineticText text="it up" holo delay={0.15} />
            </h1>
            <p className="mt-6 max-w-md text-lg text-muted">
              Cosplay props, replacement parts, personalised gifts, figurines, architectural models. If it fits on the print bed, we
              can make it.
            </p>
          </div>
          <CustomViewer />
        </div>

        {/* how it works */}
        <ol className="relative mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="How a custom order works">
          {steps.map(([title, body], i) => (
            <Reveal as="li" key={title} delay={i * 0.08} className="relative h-full rounded-3xl border border-line bg-surface p-6">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-pop/15 font-display text-lg font-bold tabular-nums text-pop">
                  {i + 1}
                </span>
                <p className="mt-4 font-display text-2xl font-bold">{title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
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
        <h2 id="request" className="font-display text-4xl font-extrabold display-case leading-none tracking-tight sm:text-5xl">
          Tell us about it
        </h2>
        <p className="mb-8 mt-3 text-muted">The more detail, the faster and closer the quote.</p>
        <CustomForm />
      </section>
      <PhotoGrid photos={customJobs} label="Past custom jobs" title="Made for" highlight="others" />
    </>
  );
}
