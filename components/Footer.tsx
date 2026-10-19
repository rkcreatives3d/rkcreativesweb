import Link from "next/link";
import { dispatchLabel, site, whatsappUrl } from "@/lib/site";
import { policies } from "@/lib/policies";
import { LiteToggle } from "./LiteToggle";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-fg/10 px-5 pb-8 pt-20 sm:px-10">
      <div className="mx-auto grid max-w-7xl gap-12 sm:grid-cols-2 md:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">
        <div>
          <p className="max-w-sm text-lg text-muted">{site.tagline}</p>
          <p className="mt-4 font-mono text-xs uppercase tracking-[0.3em] text-muted/70">
            Printed to order in {site.city.split(",")[0]} · Dispatch in {dispatchLabel} days
          </p>
        </div>
        <FooterCol title="Shop">
          <Link href="/shop/">All objects</Link>
          <Link href="/personalise/">Personalise</Link>
          <Link href="/custom/">Custom prints</Link>
        </FooterCol>
        <FooterCol title="Studio">
          <Link href="/about/">About</Link>
          <Link href="/guides/">Guides</Link>
          <a href={site.instagram} target="_blank" rel="noreferrer">
            Instagram
          </a>
        </FooterCol>
        <FooterCol title="Help">
          <a href={whatsappUrl(`Hi ${site.name}! I have a question.`)} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
          <a href={`mailto:${site.email}`}>Email</a>
          <span>Pay via UPI / bank transfer</span>
        </FooterCol>
        <FooterCol title="Policies">
          {policies.map((p) => (
            <Link key={p.slug} href={`/policies/${p.slug}/`}>
              {p.title}
            </Link>
          ))}
        </FooterCol>
      </div>

      <p
        aria-hidden
        className="footer-giant mx-auto mt-16 max-w-7xl select-none whitespace-nowrap text-center font-display leading-[0.9] display-case"
      >
        {site.handle}
      </p>
      <p className="holo-text mt-2 text-center font-script text-4xl sm:text-6xl">{site.slogan}</p>

      <div className="mx-auto mt-6 flex max-w-7xl flex-wrap items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-muted/60">
        <span>
          © {new Date().getFullYear()} {site.name}
        </span>
        <LiteToggle />
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.3em] text-accent">{title}</p>
      <div className="flex flex-col gap-2 text-sm text-fg/80 [&_a:hover]:text-accent-2">{children}</div>
    </div>
  );
}
