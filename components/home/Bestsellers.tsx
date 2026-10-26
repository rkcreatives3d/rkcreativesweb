import { getOccasion } from "@/lib/occasions";
import { popular } from "@/lib/popular";
import { products } from "@/lib/products";
import { ProductCard } from "../ProductCard";
import { MoreLink } from "../ui";

/**
 * What people order most (tagged "bestseller" on the owner page), as ordinary
 * product cards: a row to swipe through on phones, a grid of four on computers.
 */
export function Bestsellers() {
  const tagged = products.filter((p) => getOccasion("bestseller")!.test(p));
  const list = tagged.length >= 2 ? tagged : popular(4);
  return (
    <section className="mx-auto max-w-6xl py-10 sm:py-20 lg:px-6" aria-labelledby="bestsellers">
      <div className="flex items-end justify-between gap-6 px-5 lg:px-0">
        <h2 id="bestsellers" className="headline-md">
          Bestsellers.
        </h2>
        <MoreLink href={tagged.length >= 2 ? "/shop/?for=bestseller" : "/shop/"} className="shrink-0 pb-1">
          Shop all
        </MoreLink>
      </div>
      <ul className="mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pb-2 [scrollbar-width:none] sm:mt-8 lg:grid lg:snap-none lg:grid-cols-4 lg:gap-5 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
        {list.map((p, i) => (
          <li key={p.slug} className={`w-[44vw] max-w-60 shrink-0 snap-start lg:w-auto lg:max-w-none ${i >= 4 ? "lg:hidden" : ""}`}>
            <ProductCard product={p} index={i} />
          </li>
        ))}
      </ul>
    </section>
  );
}
