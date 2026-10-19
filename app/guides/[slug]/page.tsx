import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink, SectionLabel } from "@/components/ui";
import { getGuide, guides } from "@/lib/guides";

export const dynamicParams = false;

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const g = getGuide((await params).slug);
  return g ? { title: g.title, description: g.description, alternates: { canonical: `/guides/${g.slug}/` } } : {};
}

export default async function GuidePage({ params }: Props) {
  const guide = getGuide((await params).slug);
  if (!guide) notFound();
  return (
    <article className="mx-auto max-w-2xl px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
      <Link href="/guides/" className="inline-block py-2 tabular-nums text-xs uppercase tracking-[0.12em] text-muted hover:text-fg">
        ← All guides
      </Link>
      <h1 className="mt-6 font-display text-5xl font-extrabold display-case leading-[0.92] tracking-tight sm:text-6xl">{guide.title}</h1>
      <p className="mt-4 text-lg text-fg/80">{guide.description}</p>
      <div className="mt-2">
        <SectionLabel>{guide.minutes} min read</SectionLabel>
      </div>
      <div className="mt-10 space-y-10">
        {guide.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="font-display text-2xl display-case text-pop">{s.heading}</h2>
            {s.body.map((b, i) => (
              <p key={i} className="mt-3 leading-relaxed text-fg/80">
                {b}
              </p>
            ))}
            {s.list && (
              <ul className="mt-4 space-y-2">
                {s.list.map((li) => (
                  <li key={li} className="flex gap-3 text-fg/85">
                    <span className="text-pop">✦</span>
                    {li}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
      <div className="mt-14 flex flex-wrap gap-3">
        <ButtonLink href="/shop/" primary>
          Shop prints →
        </ButtonLink>
        <ButtonLink href="/custom/">Ask for something custom</ButtonLink>
      </div>
    </article>
  );
}
