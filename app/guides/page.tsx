import type { Metadata } from "next";
import Link from "next/link";
import { KineticText, Reveal, SectionLabel } from "@/components/ui";
import { guides } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Guides",
  description: "Choosing the right material and caring for your 3D prints.",
};

export default function GuidesPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
      <SectionLabel>Guides</SectionLabel>
      <h1 className="mt-4 font-display text-6xl font-extrabold display-case leading-[0.88] tracking-tight sm:text-8xl">
        <KineticText text="Good to" /> <KineticText text="know" holo delay={0.15} />
      </h1>
      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {guides.map((g, i) => (
          <Reveal key={g.slug} delay={i * 0.08}>
            <Link
              href={`/guides/${g.slug}/`}
              className="group block h-full rounded-[28px] border border-fg/10 bg-fg/[0.03] p-7 transition-colors hover:border-accent/50"
            >
              <p className="tabular-nums text-xs uppercase tracking-[0.12em] text-muted">{g.minutes} min read</p>
              <h2 className="mt-3 font-display text-3xl display-case leading-tight group-hover:text-accent">{g.title}</h2>
              <p className="mt-3 text-muted">{g.description}</p>
              <span className="mt-6 inline-block text-sm text-accent-2">Read →</span>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
