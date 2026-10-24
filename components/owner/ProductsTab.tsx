"use client";

import { useState } from "react";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/site";
import { newProduct, uniqueId } from "@/lib/owner/edit";
import { photoSrc, useOwner } from "@/lib/owner/store";
import { dangerBtn, smallBtn } from "./fields";

/** Small picture for the list: a photo, else its studio picture, else its colour. */
export function Thumb({ p, size = 56 }: { p: Product; size?: number }) {
  const renders = useOwner((s) => s.draft?.renders[p.slug]);
  const finishes = useOwner((s) => s.draft?.finishes);
  useOwner((s) => s.uploads); // re-render when photos are added
  const f = p.finishes[0];
  const src = p.images?.[0] ? photoSrc(p.images[0]) : renders?.includes(f) ? `/renders/${p.slug}/${f}-sm.webp` : null;
  const color = finishes?.find((x) => x.id === f)?.swatch ?? "#ccc";
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={size} height={size} style={{ width: size, height: size }} className="stage shrink-0 rounded-xl object-cover" />
  ) : (
    <span aria-hidden style={{ width: size, height: size, background: color }} className="block shrink-0 rounded-xl" />
  );
}

export function ProductsTab({ onEdit }: { onEdit: (slug: string) => void }) {
  const draft = useOwner((s) => s.draft)!;
  const { setProduct, addProduct, removeProduct, moveProduct } = useOwner.getState();
  const [q, setQ] = useState("");
  const [name, setName] = useState("");
  const list = draft.products.filter((p) => !q.trim() || `${p.name} ${p.category}`.toLowerCase().includes(q.trim().toLowerCase()));
  const slugs = draft.products.map((p) => p.slug);

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const p = newProduct(name.trim(), slugs, draft.finishes, draft.shop.categories[0] ?? "Decor");
    addProduct(p);
    setName("");
    onEdit(p.slug);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={create} className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="new-product" className="mb-1.5 block text-sm font-semibold">
            Add a new product
          </label>
          <input
            id="new-product"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Product name, e.g. Lotus Lamp"
            className="w-full rounded-xl border border-fg/15 bg-raised px-3.5 py-2.5 outline-none focus:border-accent-2 focus:ring-2 focus:ring-accent-2/20"
          />
        </div>
        <button type="submit" disabled={!name.trim()} className="btn btn-primary disabled:opacity-50">
          + Add product
        </button>
      </form>

      <div className="flex items-center justify-between gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products…"
          aria-label="Search products"
          className="w-full max-w-xs rounded-full border border-fg/15 bg-raised px-4 py-2 text-sm outline-none focus:border-accent-2"
        />
        <p className="shrink-0 text-xs text-muted">
          {draft.products.length} products · {draft.products.filter((p) => p.hidden).length} hidden
        </p>
      </div>

      <ul className="space-y-2" aria-label="Products">
        {list.map((p) => {
          const i = draft.products.indexOf(p);
          return (
            <li key={p.slug} className={`rounded-2xl border border-line bg-surface p-3 ${p.hidden ? "opacity-70" : ""}`}>
              <div className="flex items-center gap-3">
                <Thumb p={p} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {p.name}{" "}
                    {p.hidden && <span className="ml-1 rounded-full bg-fg/10 px-2 py-0.5 text-xs font-semibold text-muted">Hidden</span>}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {p.category} · {p.finishes.length} colours · {p.sizes.length} sizes
                  </p>
                </div>
                <label className="shrink-0 text-right">
                  <span className="sr-only">Price of {p.name}</span>
                  <span className="relative block">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted">₹</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={p.price}
                      onChange={(e) => setProduct(p.slug, { ...p, price: Math.max(0, Math.round(Number(e.target.value) || 0)) })}
                      className="w-24 rounded-xl border border-fg/15 bg-raised py-2 pl-6 pr-2 text-right tabular-nums outline-none focus:border-accent-2"
                    />
                  </span>
                </label>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => onEdit(p.slug)} className={`${smallBtn} border-fg bg-fg text-page hover:border-fg`}>
                  Edit
                </button>
                <button onClick={() => setProduct(p.slug, { ...p, hidden: !p.hidden })} className={smallBtn}>
                  {p.hidden ? "Show in shop" : "Hide"}
                </button>
                <button onClick={() => moveProduct(p.slug, -1)} disabled={i === 0} className={smallBtn} aria-label={`Move ${p.name} up`}>
                  ↑
                </button>
                <button onClick={() => moveProduct(p.slug, 1)} disabled={i === draft.products.length - 1} className={smallBtn} aria-label={`Move ${p.name} down`}>
                  ↓
                </button>
                <button
                  onClick={() => {
                    const copy: Product = { ...structuredClone(p), slug: uniqueId(`${p.slug}-copy`, slugs), name: `${p.name} (copy)`, hidden: true, images: [], model: undefined };
                    addProduct(copy);
                    onEdit(copy.slug);
                  }}
                  className={smallBtn}
                >
                  Duplicate
                </button>
                <button
                  onClick={() => confirm(`Delete “${p.name}”? Its photos and 3D file are removed from the website when you publish.`) && removeProduct(p.slug)}
                  className={`${dangerBtn} ml-auto`}
                >
                  Delete
                </button>
              </div>
              <p className="mt-2 text-xs text-muted">
                From {formatPrice(p.price)} · <span className="font-mono">/shop/{p.slug}/</span>
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
