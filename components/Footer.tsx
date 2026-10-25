import Link from "next/link";
import { emailReady, site, whatsappUrl } from "@/lib/site";
import { categories, products } from "@/lib/products";
import { LiteToggle } from "./LiteToggle";

/** +91 91827 50681 */
const phoneLabel = (n: string) => (n.length === 12 && n.startsWith("91") ? `+91 ${n.slice(2, 7)} ${n.slice(7)}` : `+${n}`);

export function Footer() {
  const b = site.business;
  const collections = categories.filter((c) => products.some((p) => p.category === c)).slice(0, 4);
  return (
    <footer className="bg-page-2 px-5 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-12 text-[0.8125rem] text-muted sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-x-6 gap-y-9 border-b border-line pb-10 md:grid-cols-4">
          <FooterCol title="Shop">
            <Link href="/shop/">All products</Link>
            {collections.map((c) => (
              <Link key={c} href={`/shop/?c=${encodeURIComponent(c)}`}>
                {c}
              </Link>
            ))}
            <Link href="/collections/">All collections</Link>
          </FooterCol>
          <FooterCol title="Made for you">
            <Link href="/personalise/">Personalised gifts</Link>
            <Link href="/custom/">Custom 3D prints</Link>
            <Link href="/saved/">Saved</Link>
          </FooterCol>
          <FooterCol title="Help">
            <Link href="/contact/">Contact us</Link>
            <Link href="/track/">Track an order</Link>
            <Link href="/policies/shipping/">Shipping</Link>
            <Link href="/policies/returns/">Returns &amp; refunds</Link>
          </FooterCol>
          <FooterCol title={site.name}>
            <Link href="/about/">About</Link>
            <Link href="/reviews/">Customer reviews</Link>
            <Link href="/guides/">Guides</Link>
            <a href={site.instagram} target="_blank" rel="noreferrer">
              Instagram
            </a>
          </FooterCol>
        </div>

        <div className="flex flex-col gap-1 border-b border-line py-5 sm:flex-row sm:flex-wrap sm:gap-x-6">
          <span>
            WhatsApp{" "}
            <a href={whatsappUrl(`Hi ${site.name}! I have a question.`)} target="_blank" rel="noreferrer" className="text-fg/80 hover:text-fg hover:underline">
              {phoneLabel(site.whatsapp)}
            </a>
          </span>
          {emailReady && (
            <span>
              Email{" "}
              <a href={`mailto:${site.email}`} className="text-fg/80 hover:text-fg hover:underline">
                {site.email}
              </a>
            </span>
          )}
          {b.hours && <span>{b.hours}</span>}
          {(b.legalName || b.address || b.gstin) && (
            <address className="not-italic">{[b.legalName, b.address, b.gstin && `GSTIN ${b.gstin}`].filter(Boolean).join(" · ")}</address>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/policies/privacy/" className="py-1 hover:text-fg hover:underline">
              Privacy
            </Link>
            <Link href="/policies/terms/" className="py-1 hover:text-fg hover:underline">
              Terms
            </Link>
            <LiteToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2.5 font-semibold text-fg">{title}</p>
      <div className="flex flex-col items-start gap-0.5 [&_a]:py-1 [&_a:hover]:text-fg [&_a:hover]:underline">{children}</div>
    </div>
  );
}
