import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, KineticText } from "@/components/ui";
import { emailReady, site, whatsappUrl } from "@/lib/site";
import { policies } from "@/lib/policies";

export const metadata: Metadata = {
  title: "Contact",
  description: `Talk to ${site.name} on WhatsApp or email: orders, custom prints, bulk and gifting.`,
  alternates: { canonical: "/contact/" },
};

export default function ContactPage() {
  const b = site.business;
  const rows: [string, React.ReactNode][] = [
    ["WhatsApp", <a key="w" href={whatsappUrl(`Hi ${site.name}!`)} target="_blank" rel="noreferrer" className="inline-block py-1 font-medium text-accent hover:underline">+{site.whatsapp}</a>],
    ["Instagram", <a key="i" href={site.instagram} target="_blank" rel="noreferrer" className="inline-block py-1 font-medium text-accent hover:underline">@{site.handle}</a>],
    ["Hours", b.hours],
    ["Replies", b.replyTime],
    ["Based in", b.address || site.city],
  ];
  // the sample address stays hidden until the real one is set (Shop settings)
  if (emailReady)
    rows.splice(1, 0, ["Email", <a key="e" href={`mailto:${site.email}`} className="inline-block py-1 font-medium text-accent hover:underline">{site.email}</a>]);
  if (b.legalName) rows.push(["Business", b.legalName]);
  if (b.gstin) rows.push(["GSTIN", b.gstin]);

  return (
    <div className="mx-auto max-w-3xl px-5 pb-28 pt-24 sm:px-6 sm:pt-32">
      <h1 className="headline-lg">
        <KineticText text="Talk to the maker." />
      </h1>
      <p className="lead mt-4 max-w-xl">
        Questions about an order, a custom idea, bulk or corporate gifting: message us and a real person replies, {b.replyTime}.
      </p>
      <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
        <ButtonLink href={whatsappUrl(`Hi ${site.name}!`)} primary target="_blank" rel="noreferrer">
          Chat on WhatsApp
        </ButtonLink>
        <Link href="/track/" className="link-more">
          Track an order
        </Link>
      </div>

      <dl className="mt-12 divide-y divide-line border-y border-line">
        {rows.map(([k, v]) => (
          <div key={k} className="flex flex-wrap justify-between gap-2 py-3.5 text-[0.9375rem]">
            <dt className="text-muted">{k}</dt>
            <dd className="text-fg">{v}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-14 text-xl font-semibold tracking-tight">Before you ask</h2>
      <ul className="mt-3 flex flex-wrap gap-x-7 gap-y-2">
        {policies.map((p) => (
          <li key={p.slug}>
            <Link href={`/policies/${p.slug}/`} className="link-more py-1">
              {p.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
