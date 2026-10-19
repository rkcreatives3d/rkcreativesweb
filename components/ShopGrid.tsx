"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { categories, products, type Category, type Product } from "@/lib/products";
import { getOccasion, occasions } from "@/lib/occasions";
import { ProductCard } from "./ProductCard";

const sorts = {
  featured: { label: "Featured", fn: () => 0 },
  "price-asc": { label: "Price: low to high", fn: (a: Product, b: Product) => a.price - b.price },
  "price-desc": { label: "Price: high to low", fn: (a: Product, b: Product) => b.price - a.price },
  name: { label: "Name", fn: (a: Product, b: Product) => a.name.localeCompare(b.name) },
} as const;

const chip = (on: boolean) =>
  `rounded-full border px-4 py-2 text-sm font-medium transition-all ${
    on ? "border-fg bg-fg text-page" : "border-fg/15 text-fg/75 hover:border-fg/40 hover:text-fg"
  }`;

export function ShopGrid() {
  const [cat, setCat] = useState<Category | "All">("All");
  const [filter, setFilter] = useState<string | null>(null);

  // /shop/?for=birthday (from the home page occasion tiles)
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("for");
    if (getOccasion(id)) setFilter(id);
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

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search products</span>
          <svg className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search vases, lamps, gifts…"
            className="w-full rounded-full border border-fg/15 bg-page/60 py-3 pl-11 pr-4 text-fg outline-none transition-colors placeholder:text-fg/50 focus:border-accent-2 focus:ring-2 focus:ring-accent-2/20"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-muted">
          Sort
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as keyof typeof sorts)}
            className="rounded-full border border-fg/15 bg-page px-4 py-3 text-fg outline-none focus:border-accent-2"
          >
            {Object.entries(sorts).map(([id, s]) => (
              <option key={id} value={id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Shop by occasion">
        {occasions.map((f) => (
          <button key={f.id} aria-pressed={filter === f.id} onClick={() => setFilter(filter === f.id ? null : f.id)} className={chip(filter === f.id)}>
            {f.label}
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2" role="tablist" aria-label="Filter by category">
        {(["All", ...categories] as const).map((c) => {
          const n = c === "All" ? products.length : products.filter((p) => p.category === c).length;
          return (
            <button key={c} role="tab" aria-selected={cat === c} onClick={() => setCat(c)} className={chip(cat === c)}>
              {c} <span className="ml-1 tabular-nums text-xs opacity-60">{n}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-6 tabular-nums text-xs uppercase tracking-[0.12em] text-muted" aria-live="polite">
        {list.length} {list.length === 1 ? "object" : "objects"}
      </p>

      {list.length ? (
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
    </>
  );
}
