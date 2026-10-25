"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { categories, products } from "@/lib/products";
import { searchProducts } from "@/lib/search";
import { popular } from "@/lib/popular";
import { formatPrice } from "@/lib/site";
import { useFocusTrap } from "@/lib/focus";
import { ProductThumb } from "./ProductMedia";
import { SearchIcon } from "./Icons";

/**
 * Search the catalogue from anywhere: drops down under the nav. Results update
 * as you type (name, collection, material, tags); Enter opens the first one, or
 * the shop filtered by the words if nothing matches. ↓/↑ move through results,
 * Esc closes.
 */
export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  useFocusTrap(panel, open);
  const results = useMemo(() => (q.trim() ? searchProducts(q).slice(0, 6) : []), [q]);
  const shownCollections = categories.filter((c) => products.some((p) => p.category === c)).slice(0, 4);
  // before anything is typed: a few pieces to start from (bestsellers and new ones first)
  const suggestions = popular(4);

  useEffect(() => {
    if (!open) return;
    setQ("");
    const t = requestAnimationFrame(() => input.current?.focus());
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const go = (href: string) => {
    onClose();
    router.push(href);
  };
  // arrow keys walk from the box through the results and back
  const move = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const items = Array.from(panel.current?.querySelectorAll<HTMLElement>("[data-result]") ?? []);
    if (!items.length) return;
    e.preventDefault();
    const at = items.indexOf(document.activeElement as HTMLElement);
    const next = e.key === "ArrowDown" ? at + 1 : at - 1;
    if (next < 0) input.current?.focus();
    else items[Math.min(next, items.length - 1)].focus();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="search-backdrop"
            className="fixed inset-0 top-12 z-30 bg-black/25 sm:top-[3.25rem]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="search-panel"
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            onKeyDown={move}
            className="fixed inset-x-0 top-12 z-30 max-h-[calc(100svh-3rem)] overflow-y-auto border-b border-line bg-page sm:top-[3.25rem]"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="mx-auto max-w-3xl px-5 pb-10 pt-6 sm:px-6 sm:pt-10">
              <form
                role="search"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (results[0]) go(`/shop/${results[0].slug}/`);
                  else if (q.trim()) go(`/shop/?q=${encodeURIComponent(q.trim())}`);
                }}
                className="flex items-center gap-3 border-b border-line pb-3 transition-colors focus-within:border-fg"
              >
                <span className="text-muted">
                  <SearchIcon size={22} />
                </span>
                <input
                  ref={input}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search products"
                  aria-label="Search products"
                  autoComplete="off"
                  enterKeyHint="search"
                  className="min-w-0 flex-1 bg-transparent text-2xl font-semibold tracking-tight text-fg outline-none placeholder:text-subtle sm:text-3xl"
                />
                <button type="button" onClick={onClose} className="shrink-0 rounded-lg px-2 py-1.5 text-sm text-muted hover:text-fg">
                  Cancel
                </button>
              </form>

              {q.trim() ? (
                results.length ? (
                  <div className="mt-6">
                    <p className="text-xs font-medium text-muted" aria-live="polite">
                      {results.length} {results.length === 1 ? "product" : "products"}
                    </p>
                    <ul className="mt-2">
                      {results.map((p) => (
                        <li key={p.slug}>
                          <Link
                            data-result
                            href={`/shop/${p.slug}/`}
                            onClick={onClose}
                            className="-mx-3 flex items-center gap-4 rounded-xl px-3 py-2.5 outline-offset-0 hover:bg-page-2 focus-visible:bg-page-2"
                          >
                            <ProductThumb product={p} finish={p.finishes[0]} className="h-14 w-14" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-medium">{p.name}</span>
                              <span className="block truncate text-sm text-muted">{p.category}</span>
                            </span>
                            <span className="shrink-0 tabular-nums text-sm text-muted">{formatPrice(p.price)}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link data-result href={`/shop/?q=${encodeURIComponent(q.trim())}`} onClick={onClose} className="link-more mt-4 text-sm">
                      See all results in the shop
                    </Link>
                  </div>
                ) : (
                  <div className="mt-8" aria-live="polite">
                    <p className="font-medium">No products match “{q.trim()}”.</p>
                    <p className="mt-1 text-sm text-muted">Try another word, or ask us to print exactly what you have in mind.</p>
                    <Link data-result href="/custom/" onClick={onClose} className="link-more mt-3 text-sm">
                      Request a custom print
                    </Link>
                  </div>
                )
              ) : (
                <div className="mt-7">
                  <p className="text-xs font-medium text-muted">Popular</p>
                  <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {suggestions.map((p) => (
                      <li key={p.slug}>
                        <Link data-result href={`/shop/${p.slug}/`} onClick={onClose} className="group block rounded-xl outline-offset-2">
                          <ProductThumb product={p} finish={p.finishes[0]} className="aspect-square h-auto w-full" />
                          <span className="mt-2 block truncate text-sm font-medium group-hover:underline">{p.name}</span>
                          <span className="block tabular-nums text-xs text-muted">{formatPrice(p.price)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-7 text-xs font-medium text-muted">Quick links</p>
                  <ul className="mt-2 space-y-0.5">
                    {[
                      ...shownCollections.map((c) => ({ href: `/shop/?c=${encodeURIComponent(c)}`, label: c })),
                      { href: "/personalise/", label: "Personalised gifts" },
                      { href: "/custom/", label: "Custom prints" },
                    ].map((l) => (
                      <li key={l.href}>
                        <Link data-result href={l.href} onClick={onClose} className="-mx-3 block rounded-lg px-3 py-2 font-medium hover:bg-page-2 focus-visible:bg-page-2">
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
