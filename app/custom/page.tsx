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
  ["We model it", "We design it in 3D and reply with a price and a timeline."],
  ["You approve", "You see renders of the model and ask for changes. Nothing is printed until you say yes."],
  ["We print and ship", `Printed, finished by hand and dispatched in ${dispatchLabel} working days.`],
];

export default function CustomPage() {
  return (
    <>
      <div className="mx-auto max-w-6xl px-5 pt-24 sm:px-6 sm:pt-32">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <SectionLabel>Custom 3D printing</SectionLabel>
            <h1 className="headline-lg mt-2">
              <KineticText text="Custom prints." />
            </h1>
            <p className="lead mt-4 max-w-md">
              Cosplay props, replacement parts, personalised gifts, figurines, architectural models. If it fits on the print bed, we can make it.
            </p>
            <a href="#request" className="btn btn-primary mt-7">
              Start a custom request
            </a>
          </div>
          <CustomViewer />
        </div>

        {/* how it works */}
        <ol className="mt-16 grid gap-x-8 gap-y-8 sm:mt-20 sm:grid-cols-2 lg:grid-cols-4" aria-label="How a custom order works">
          {steps.map(([title, body], i) => (
            <Reveal as="li" key={title} delay={i * 0.06} className="border-t border-line pt-5">
              <span className="tabular-nums text-sm text-muted">0{i + 1}</span>
              <span className="mt-1 block text-lg font-semibold tracking-tight">{title}</span>
              <span className="mt-1.5 block leading-relaxed text-muted">{body}</span>
            </Reveal>
          ))}
        </ol>
      </div>

      <BeforeAfter items={beforeAfter} />

      <section className="mx-auto max-w-3xl px-5 py-20 sm:px-6 sm:py-28" aria-labelledby="request">
        <h2 id="request" className="headline-md">
          Tell us about it.
        </h2>
        <p className="mb-8 mt-3 text-muted">The more detail, the faster and closer the quote.</p>
        <CustomForm />
      </section>
      <PhotoGrid photos={customJobs} label="Past custom jobs" title="Made for" highlight="others" />
    </>
  );
}
