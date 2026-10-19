import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SectionLabel } from "@/components/ui";
import { POLICIES_UPDATED, getPolicy, policies } from "@/lib/policies";

export const dynamicParams = false;

export function generateStaticParams() {
  return policies.map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getPolicy((await params).slug);
  return p ? { title: `${p.title} policy`, description: p.summary, alternates: { canonical: `/policies/${p.slug}/` } } : {};
}

export default async function PolicyPage({ params }: Props) {
  const policy = getPolicy((await params).slug);
  if (!policy) notFound();
  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-5 pb-24 pt-28 sm:px-8 sm:pt-36 lg:grid-cols-[220px_1fr]">
      <nav aria-label="Policies" className="lg:sticky lg:top-28 lg:self-start">
        <SectionLabel>Policies</SectionLabel>
        <ul className="mt-4 flex flex-wrap gap-2 lg:flex-col">
          {policies.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/policies/${p.slug}/`}
                aria-current={p.slug === policy.slug ? "page" : undefined}
                className={`block rounded-full px-4 py-2 text-sm transition-colors lg:rounded-xl ${
                  p.slug === policy.slug ? "bg-fg text-page" : "text-fg/70 hover:bg-fg/5 hover:text-fg"
                }`}
              >
                {p.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <article className="max-w-2xl">
        <h1 className="font-display text-5xl font-extrabold display-case leading-[0.9] tracking-tight sm:text-7xl">{policy.title}</h1>
        <p className="mt-4 text-lg text-fg/80">{policy.summary}</p>
        <p className="mt-2 tabular-nums text-xs uppercase tracking-[0.12em] text-muted">Last updated {POLICIES_UPDATED}</p>
        <div className="mt-10 space-y-10">
          {policy.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="font-display text-2xl display-case text-pop">{s.heading}</h2>
              {s.body.map((b, i) => (
                <p key={i} className="mt-3 leading-relaxed text-fg/80">
                  {b}
                </p>
              ))}
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
