import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, KineticText } from "@/components/ui";
import { site, whatsappUrl } from "@/lib/site";
import { policies } from "@/lib/policies";

export const metadata: Metadata = {
  title: "Contact",
  description: `Talk to ${site.name} on WhatsApp or email: orders, custom prints, bulk and gifting.`,
  alternates: { canonical: "/contact/" },
};

export default function ContactPage() {
  const b = site.business;
  const rows: [string, React.ReactNode][] = [
    ["WhatsApp", <a key="w" href={whatsappUrl(`Hi ${site.name}!`)} target="_blank" rel="noreferrer" className="inline-block py-1 font-semibold text-accent hover:underline">+{site.whatsapp}</a>],
    ["Email", <a key="e" href={`mailto:${site.email}`} className="inline-block py-1 font-semibold text-accent hover:underline">{site.email}</a>],
    ["Instagram", <a key="i" href={site.instagram} target="_blank" rel="noreferrer" className="inline-block py-1 font-semibold text-accent hover:underline">@{site.handle}</a>],
    ["Hours", b.hours],
    ["Replies", b.replyTime],
    ["Based in", b.address || site.city],
  ];
  if (b.legalName) rows.push(["Business", b.legalName]);
  if (b.gstin) rows.push(["GSTIN", b.gstin]);

  return (
    <div className="mx-auto max-w-4xl px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
      <h1 className="font-display text-6xl font-extrabold display-case leading-[0.88] tracking-tight sm:text-8xl">
        <KineticText text="Talk to" />
        <br />
        <KineticText text="the maker" delay={0.15} />
      </h1>
      <p className="mt-6 max-w-xl text-lg text-muted">
        Questions about an order, a custom idea, bulk or corporate gifting: message us and a real person replies, {b.replyTime}.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href={whatsappUrl(`Hi ${site.name}!`)} primary target="_blank" rel="noreferrer">
          Chat on WhatsApp
        </ButtonLink>
        <ButtonLink href="/track/">Track an order</ButtonLink>
      </div>

      <dl className="mt-12 divide-y divide-line rounded-3xl border border-line bg-surface">
        {rows.map(([k, v]) => (
          <div key={k} className="flex flex-wrap justify-between gap-2 px-6 py-4 text-sm">
            <dt className="text-muted">{k}</dt>
            <dd className="text-fg">{v}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-12 font-display text-2xl font-bold">Before you ask</h2>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {policies.map((p) => (
          <li key={p.slug}>
            <Link href={`/policies/${p.slug}/`} className="block rounded-xl border border-line p-4 text-sm transition-colors hover:border-fg/30">
              <span className="font-semibold">{p.title}</span> <span className="text-accent">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
