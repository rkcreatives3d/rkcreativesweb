import Link from "next/link";
import { dispatchLabel, site, whatsappUrl } from "@/lib/site";
import { policies } from "@/lib/policies";
import { LiteToggle } from "./LiteToggle";

export function Footer() {
  const b = site.business;
  return (
    <footer className="relative overflow-hidden border-t border-line bg-page-2 px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-14 sm:px-10 sm:pt-20">
      {/* phones: two columns of links under the tagline */}
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-[1.6fr_1fr_1fr_1fr_1fr] md:gap-12">
        <div className="col-span-2 md:col-span-1">
          <p className="max-w-sm text-lg text-muted">{site.tagline}</p>
          <p className="mt-4 tabular-nums text-xs uppercase tracking-[0.12em] text-muted">
            Printed to order in {site.city.split(",")[0]} · Dispatch in {dispatchLabel} days
          </p>
          {(b.legalName || b.gstin || b.address) && (
            <address className="mt-4 text-xs not-italic leading-relaxed text-muted">
              {b.legalName && <span className="block">{b.legalName}</span>}
              {b.address && <span className="block">{b.address}</span>}
              {b.gstin && <span className="block">GSTIN {b.gstin}</span>}
            </address>
          )}
        </div>
        <FooterCol title="Shop">
          <Link href="/shop/">All objects</Link>
          <Link href="/personalise/">Personalise</Link>
          <Link href="/custom/">Custom prints</Link>
        </FooterCol>
        <FooterCol title="Studio">
          <Link href="/about/">About</Link>
          <Link href="/reviews/">Reviews</Link>
          <Link href="/guides/">Guides</Link>
          <a href={site.instagram} target="_blank" rel="noreferrer">
            Instagram
          </a>
        </FooterCol>
        <FooterCol title="Help">
          <Link href="/contact/">Contact us</Link>
          <Link href="/track/">Track an order</Link>
          <a href={whatsappUrl(`Hi ${site.name}! I have a question.`)} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
          <a href={`mailto:${site.email}`}>Email</a>
        </FooterCol>
        <FooterCol title="Policies">
          {policies.map((p) => (
            <Link key={p.slug} href={`/policies/${p.slug}/`}>
              {p.title}
            </Link>
          ))}
        </FooterCol>
      </div>

      <div className="mx-auto mt-12 flex max-w-7xl flex-wrap items-center justify-between gap-3 border-t border-fg/10 pt-6 tabular-nums text-xs uppercase tracking-[0.12em] text-muted">
        <span>
          © {new Date().getFullYear()} {site.name} · {site.slogan}
        </span>
        <LiteToggle />
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-4 tabular-nums text-xs uppercase tracking-[0.12em] text-pop">{title}</p>
      <div className="flex flex-col items-start gap-1 text-sm text-fg/80 [&_a]:py-1 [&_a:hover]:text-accent">{children}</div>
    </div>
  );
}
