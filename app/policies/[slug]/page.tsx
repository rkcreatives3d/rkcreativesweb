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
    <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-28 pt-24 sm:px-6 sm:pt-32 lg:grid-cols-[200px_1fr] lg:gap-16">
      <nav aria-label="Policies" className="lg:sticky lg:top-28 lg:self-start">
        <SectionLabel>Policies</SectionLabel>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 lg:flex-col">
          {policies.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/policies/${p.slug}/`}
                aria-current={p.slug === policy.slug ? "page" : undefined}
                className={`block py-1.5 text-sm transition-colors ${p.slug === policy.slug ? "font-medium text-fg" : "text-muted hover:text-fg"}`}
              >
                {p.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <article className="max-w-2xl">
        <h1 className="headline-lg">{policy.title}</h1>
        <p className="lead mt-4">{policy.summary}</p>
        <p className="mt-2 text-sm text-muted">Last updated {POLICIES_UPDATED}</p>
        <div className="mt-10 space-y-10">
          {policy.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-xl font-semibold tracking-tight">{s.heading}</h2>
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
