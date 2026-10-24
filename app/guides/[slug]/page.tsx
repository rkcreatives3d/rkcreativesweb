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
    <article className="mx-auto max-w-2xl px-5 pb-28 pt-24 sm:px-6 sm:pt-32">
      <Link href="/guides/" className="inline-block py-2 text-sm text-muted hover:text-fg">
        ‹ All guides
      </Link>
      <h1 className="headline-lg mt-4">{guide.title}</h1>
      <p className="lead mt-4">{guide.description}</p>
      <p className="mt-3 text-sm text-muted">{guide.minutes} min read</p>
      <div className="mt-10 space-y-10">
        {guide.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="text-xl font-semibold tracking-tight">{s.heading}</h2>
            {s.body.map((b, i) => (
              <p key={i} className="mt-3 leading-relaxed text-fg/80">
                {b}
              </p>
            ))}
            {s.list && (
              <ul className="mt-4 space-y-2">
                {s.list.map((li) => (
                  <li key={li} className="flex gap-3 text-fg/85">
                    <span aria-hidden className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-fg/50" />
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
          Explore the collection
        </ButtonLink>
        <ButtonLink href="/custom/">Request a custom print</ButtonLink>
      </div>
    </article>
  );
}
