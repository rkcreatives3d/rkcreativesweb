"use client";

import { useEffect, useMemo, useState } from "react";
import { categories, products, type Category, type Product } from "@/lib/products";
import { getOccasion, occasions } from "@/lib/occasions";
import { searchProducts } from "@/lib/search";
import { ProductCard } from "./ProductCard";
import { RecentlyViewed } from "./ProductStrip";
import { SearchIcon } from "./Icons";

const sorts = {
  featured: { label: "Featured", fn: () => 0 },
  "price-asc": { label: "Price: low to high", fn: (a: Product, b: Product) => a.price - b.price },
  "price-desc": { label: "Price: high to low", fn: (a: Product, b: Product) => b.price - a.price },
  name: { label: "Name", fn: (a: Product, b: Product) => a.name.localeCompare(b.name) },
} as const;

const select =
  "h-10 rounded-[10px] border border-line bg-page pl-3 pr-8 text-sm text-fg outline-none transition-colors hover:border-fg/30 focus-visible:border-fg";
const grid = "grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 sm:gap-y-12 lg:grid-cols-3";

/**
 * The catalogue: collections as tabs, plus search, occasion and sort. Linkable:
 * /shop/?c=Decor (a collection), /shop/?for=birthday (an occasion), /shop/?q=lamp (a search).
 */
export function ShopGrid() {
  const [cat, setCat] = useState<Category | "All">("All");
  const [filter, setFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<keyof typeof sorts>("featured");
  const [q, setQ] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("for");
    if (getOccasion(id)) setFilter(id);
    const c = params.get("c");
    if (c && categories.includes(c)) setCat(c);
    const words = params.get("q");
    if (words) setQ(words);
  }, []);

  const list = useMemo(() => {
    const base = products.filter((p) => cat === "All" || p.category === cat).filter((p) => !filter || !!getOccasion(filter)?.test(p));
    const found = q.trim() ? searchProducts(q, base) : base;
    return sort === "featured" ? found : [...found].sort(sorts[sort].fn);
  }, [cat, filter, sort, q]);
  // the unfiltered shop shows each collection under its own heading
  const grouped = cat === "All" && !filter && !q.trim() && sort === "featured";
  const tabs = ["All", ...categories].filter((c) => c === "All" || products.some((p) => p.category === c));

  return (
    <>
      <div className="border-b border-line">
        <div className="-mx-5 flex gap-5 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Collections">
          {tabs.map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={cat === c}
              onClick={() => setCat(c)}
              className={`-mb-px min-w-8 shrink-0 whitespace-nowrap border-b-2 px-1 py-3 text-sm transition-colors ${
                cat === c ? "border-fg font-medium text-fg" : "border-transparent text-muted hover:text-fg"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 sm:gap-3">
        <label className="relative min-w-0 flex-[1_1_14rem]">
          <span className="sr-only">Search products</span>
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <SearchIcon size={16} />
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products"
            type="search"
            className="h-10 w-full rounded-[10px] border border-line bg-page pl-9 pr-3 text-sm text-fg outline-none transition-colors placeholder:text-fg/45 hover:border-fg/30 focus-visible:border-fg"
          />
        </label>
        <label className="shrink-0">
          <span className="sr-only">Occasion</span>
          <select value={filter ?? ""} onChange={(e) => setFilter(e.target.value || null)} className={select}>
            <option value="">Any occasion</option>
            {occasions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="shrink-0">
          <span className="sr-only">Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as keyof typeof sorts)} className={select}>
            {Object.entries(sorts).map(([id, s]) => (
              <option key={id} value={id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mt-6 tabular-nums text-sm text-muted" aria-live="polite">
        {list.length} {list.length === 1 ? "product" : "products"}
      </p>

      {list.length && grouped ? (
        // everything, in its collections (the same groups the owner sorts products into)
        <div className="mt-6 space-y-16 sm:space-y-20">
          {categories
            .filter((c) => list.some((p) => p.category === c))
            .map((c) => {
              const items = list.filter((p) => p.category === c);
              return (
                <section key={c} aria-labelledby={`c-${c}`}>
                  <div className="mb-5 flex items-baseline justify-between gap-3 sm:mb-6">
                    <h2 id={`c-${c}`} className="section-title text-2xl sm:text-[1.75rem]">
                      {c}
                    </h2>
                    <button onClick={() => setCat(c)} className="link-more shrink-0 py-1.5 text-sm">
                      {items.length} {items.length === 1 ? "product" : "products"}
                    </button>
                  </div>
                  <div className={grid}>
                    {items.map((p, i) => (
                      <ProductCard key={p.slug} product={p} index={i} />
                    ))}
                  </div>
                </section>
              );
            })}
        </div>
      ) : list.length ? (
        <div className={`mt-6 ${grid}`}>
          {list.map((p, i) => (
            <ProductCard key={p.slug} product={p} index={i} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-[var(--radius-tile)] bg-page-2 px-6 py-14 text-center">
          <p className="text-xl font-semibold tracking-tight">No products match.</p>
          <p className="mt-2 text-muted">Try another word or collection, or ask us to print exactly what you have in mind.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                setQ("");
                setFilter(null);
                setCat("All");
              }}
              className="btn"
            >
              Clear filters
            </button>
            <a href="/custom/" className="btn btn-primary">
              Request a custom print
            </a>
          </div>
        </div>
      )}
      <RecentlyViewed className="mt-24" />
    </>
  );
}
