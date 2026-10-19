import { site, whatsappUrl } from "@/lib/site";
import { HoloLink, KineticText, Reveal, SectionLabel } from "../ui";

export function CustomCta() {
  return (
    <section className="px-5 py-24 sm:px-8 sm:py-32">
      <div className="cta-card relative mx-auto max-w-7xl overflow-hidden rounded-[40px] p-8 sm:p-16">
        <SectionLabel>Custom orders</SectionLabel>
        <h2 className="mt-6 max-w-4xl font-display text-5xl font-extrabold display-case leading-[0.9] tracking-tight sm:text-8xl">
          <KineticText text="Got a wild idea?" />
          <br />
          <KineticText text="We'll print it." holo delay={0.3} />
        </h2>
        <Reveal delay={0.2}>
          <p className="mt-8 max-w-xl text-muted sm:text-lg">
            Cosplay parts, name plates, replacement knobs, trophies, a figurine of your cat. Send an STL or just a
            sketch and we&apos;ll quote within a day.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <HoloLink href="/custom/" solid>
              Start a custom order →
            </HoloLink>
            <HoloLink href={whatsappUrl(`Hi ${site.name}! I'd like a custom print.`)} target="_blank" rel="noreferrer">
              Chat on WhatsApp
            </HoloLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
