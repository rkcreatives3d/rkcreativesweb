import type { Metadata } from "next";
import Link from "next/link";
import { KineticText, Reveal, SectionLabel } from "@/components/ui";
import { guides } from "@/lib/guides";

export const metadata: Metadata = {
  alternates: { canonical: "/guides/" },
  title: "Guides",
  description: "Choosing the right material and caring for your 3D prints.",
};

export default function GuidesPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-28 pt-24 sm:px-6 sm:pt-32">
      <SectionLabel>Guides</SectionLabel>
      <h1 className="headline-lg mt-2">
        <KineticText text="Good to know." />
      </h1>
      <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2">
        {guides.map((g, i) => (
          <Reveal key={g.slug} delay={i * 0.08}>
            <Link
              href={`/guides/${g.slug}/`}
              className="group block h-full rounded-[var(--radius-tile)] bg-page-2 p-7 sm:p-9"
            >
              <p className="text-sm text-muted">{g.minutes} min read</p>
              <h2 className="mt-3 text-2xl font-semibold leading-tight tracking-tight group-hover:underline">{g.title}</h2>
              <p className="mt-3 text-muted">{g.description}</p>
              <span className="link-more mt-6 text-sm">Read the guide</span>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
