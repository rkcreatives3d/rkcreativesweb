import Link from "next/link";
import { collections } from "@/lib/collections";
import { getOccasion } from "@/lib/occasions";
import { products } from "@/lib/products";
import { promoHref, promoLive } from "@/lib/promo";
import { site } from "@/lib/site";
import { PromoGate } from "./Promo";

const pill = "flex h-10 items-center rounded-full border px-4 text-sm font-medium transition-colors";

/**
 * Shortcuts under the cover: the festival, a price, bestsellers, then the
 * collections. One swipeable row on phones; a centred, wrapping row on computers.
 * Only ways in that have pieces behind them.
 */
export function QuickLinks() {
  const has = (id: string) => products.some((p) => getOccasion(id)?.test(p));
  const links = [
    has("under499") && { href: "/shop/?for=under499", label: "Under ₹499" },
    has("bestseller") && { href: "/shop/?for=bestseller", label: "Bestsellers" },
    // (computers have these two in the top bar already, which keeps their row to one line)
    { href: "/personalise/", label: "With a name", phone: true },
    ...collections().map((c) => ({ href: c.href, label: c.name })),
    { href: "/custom/", label: "Custom print", phone: true },
  ].filter((l): l is { href: string; label: string; phone?: boolean } => !!l);

  return (
    <nav aria-label="Shop by" className="mx-auto max-w-6xl pt-2 lg:px-6 lg:pt-6">
      <ul className="flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] lg:flex-wrap lg:justify-center lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
        {promoLive() && (
          <PromoGate>
            <li className="shrink-0">
              <Link href={promoHref} className={`${pill} border-fg bg-fg text-page hover:bg-fg/85`}>
                {site.promo.eyebrow || "Festive"} gifts
              </Link>
            </li>
          </PromoGate>
        )}
        {links.map((l) => (
          <li key={l.href} className={`shrink-0 ${l.phone ? "lg:hidden" : ""}`}>
            <Link href={l.href} className={`${pill} border-line bg-page text-fg/85 hover:border-fg/40 hover:text-fg`}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
