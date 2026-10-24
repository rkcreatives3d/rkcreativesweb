"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { categories, products, type Category, type Product } from "@/lib/products";
import { getOccasion, occasions } from "@/lib/occasions";
import { ProductCard } from "./ProductCard";
import { RecentlyViewed } from "./ProductStrip";

const sorts = {
  featured: { label: "Featured", fn: () => 0 },
  "price-asc": { label: "Price: low to high", fn: (a: Product, b: Product) => a.price - b.price },
  "price-desc": { label: "Price: high to low", fn: (a: Product, b: Product) => b.price - a.price },
  name: { label: "Name", fn: (a: Product, b: Product) => a.name.localeCompare(b.name) },
} as const;

const chip = (on: boolean) =>
  `shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-all ${
    on ? "border-fg bg-fg text-page" : "border-fg/15 text-fg/75 hover:border-fg/40 hover:text-fg"
  }`;
// phones: one sideways-scrolling row (edge to edge); wider screens: wrapped
const chipRow =
  "-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden";

export function ShopGrid() {
  const [cat, setCat] = useState<Category | "All">("All");
  const [filter, setFilter] = useState<string | null>(null);

  // linkable: /shop/?c=Decor (a collection), /shop/?for=birthday (an occasion)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const id = q.get("for");
    if (getOccasion(id)) setFilter(id);
    const c = q.get("c");
    if (c && categories.includes(c)) setCat(c);
  }, []);
  const [sort, setSort] = useState<keyof typeof sorts>("featured");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return products
      .filter((p) => cat === "All" || p.category === cat)
      .filter((p) => !filter || !!getOccasion(filter)?.test(p))
      .filter(
        (p) =>
          !needle ||
          [p.name, p.tagline, p.category, p.material, ...(p.tags ?? [])].some((s) => s.toLowerCase().includes(needle)),
      )
      .sort(sorts[sort].fn);
  }, [cat, filter, sort, q]);
  // the unfiltered shop shows each collection under its own heading
  const grouped = cat === "All" && !filter && !q.trim() && sort === "featured";

  return (
    <>
      <div className="flex items-center gap-2 sm:gap-3">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search products</span>
          <svg className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search prints…"
            className="w-full rounded-full border border-fg/15 bg-page/60 py-3 pl-11 pr-4 text-fg outline-none transition-colors placeholder:text-fg/50 focus:border-accent-2 focus:ring-2 focus:ring-accent-2/20"
          />
        </label>
        <label className="flex shrink-0 items-center gap-2 text-sm text-muted">
          <span className="sr-only sm:not-sr-only">Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as keyof typeof sorts)}
            aria-label="Sort"
            className="w-[7.5rem] rounded-full border border-fg/15 bg-page px-3 py-3 text-fg outline-none focus:border-accent-2 sm:w-auto sm:px-4"
          >
            {Object.entries(sorts).map(([id, s]) => (
              <option key={id} value={id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={`mt-4 ${chipRow}`} role="group" aria-label="Shop by occasion">
        {occasions.map((f) => (
          <button key={f.id} aria-pressed={filter === f.id} onClick={() => setFilter(filter === f.id ? null : f.id)} className={chip(filter === f.id)}>
            {f.label}
          </button>
        ))}
      </div>
      <div className={`mt-2 ${chipRow}`} role="tablist" aria-label="Filter by category">
        {["All", ...categories].map((c) => {
          const n = c === "All" ? products.length : products.filter((p) => p.category === c).length;
          if (!n) return null; // a collection with nothing in it yet stays out of sight
          return (
            <button key={c} role="tab" aria-selected={cat === c} onClick={() => setCat(c)} className={chip(cat === c)}>
              {c} <span className="ml-1 tabular-nums text-xs opacity-60">{n}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-5 tabular-nums text-xs uppercase tracking-[0.12em] text-muted sm:mt-6" aria-live="polite">
        {list.length} {list.length === 1 ? "object" : "objects"}
      </p>

      {list.length && grouped ? (
        // everything, in its collections (the same groups the owner sorts products into)
        <div className="mt-4 space-y-14">
          {categories.map((c) => {
            const items = list.filter((p) => p.category === c);
            if (!items.length) return null;
            return (
              <section key={c} aria-labelledby={`c-${c}`}>
                <div className="flex items-end justify-between gap-3">
                  <h2 id={`c-${c}`} className="font-display text-2xl font-extrabold display-case leading-none tracking-tight sm:text-3xl">
                    {c}
                  </h2>
                  <button onClick={() => setCat(c)} className="-my-1.5 shrink-0 py-1.5 pl-2 text-sm font-semibold text-accent hover:underline">
                    {items.length} {items.length === 1 ? "piece" : "pieces"} →
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
                  {items.map((p, i) => (
                    <ProductCard key={p.slug} product={p} index={i} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : list.length ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
          {list.map((p, i) => (
            <ProductCard key={p.slug} product={p} index={i} />
          ))}
        </div>
      ) : (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-10 rounded-3xl border border-fg/10 p-10 text-center">
            <p className="font-display text-3xl display-case">Nothing matches that</p>
            <p className="mt-2 text-muted">Try another word, or ask us to print exactly what you have in mind.</p>
            <button
              onClick={() => {
                setQ("");
                setFilter(null);
                setCat("All");
              }}
              className="btn mt-6"
            >
              Clear filters
            </button>
          </motion.div>
        </AnimatePresence>
      )}
      <RecentlyViewed className="mt-20" />
    </>
  );
}
