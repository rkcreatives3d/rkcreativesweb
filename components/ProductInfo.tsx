"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { Product, Size } from "@/lib/products";
import { faqFor, type FaqItem } from "@/lib/faq";

// ── Size guide ───────────────────────────────────────────────
// Bars drawn to scale against everyday objects, so "12 cm" means something.

const REFERENCES: [string, number][] = [
  ["Credit card", 8.6],
  ["Coffee mug", 9.5],
  ["Smartphone", 15],
  ["A4 sheet, short side", 21],
  ["A4 sheet, long side", 29.7],
  ["15-inch laptop, width", 36],
  ["Cricket bat", 85],
];

/** The size in cm from a label like "18 cm tall" or "12 cm Ø"; null if it has no cm figure. */
export const sizeCm = (s: Size) => {
  const m = s.dims.match(/(\d+(?:\.\d+)?)\s*cm/i);
  return m ? parseFloat(m[1]) : null;
};

export function SizeGuide({ product: p, size }: { product: Product; size: Size }) {
  const cm = sizeCm(size);
  if (cm === null) return null;
  // the two everyday objects closest in size
  const refs = [...REFERENCES].sort((a, b) => Math.abs(a[1] - cm) - Math.abs(b[1] - cm)).slice(0, 2).sort((a, b) => a[1] - b[1]);
  const max = Math.max(cm, ...refs.map((r) => r[1]));
  const rows: [string, number, boolean][] = [[`${p.name}, ${size.label}`, cm, true], ...refs.map(([n, v]) => [n, v, false] as [string, number, boolean])];

  return (
    <section className="mt-10 border-t border-line pt-6">
      <h2 className="text-lg font-semibold tracking-tight">How big is it?</h2>
      {p.scalePhoto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.scalePhoto} alt={`${p.name} held in a hand, for scale`} className="mt-4 aspect-[4/3] w-full rounded-xl object-cover" loading="lazy" />
      )}
      <ul className="mt-4 space-y-3" aria-label="Size compared with everyday objects">
        {rows.map(([name, v, me]) => (
          <li key={name}>
            <p className="flex justify-between text-sm">
              <span className={me ? "font-semibold" : "text-muted"}>{name}</span>
              <span className="tabular-nums text-muted">{v} cm</span>
            </p>
            <div className="mt-1.5 h-1.5 rounded-full bg-fg/[0.07]">
              <motion.div
                className={`h-full rounded-full ${me ? "bg-fg" : "bg-fg/25"}`}
                initial={false}
                animate={{ width: `${(v / max) * 100}%` }}
                transition={{ type: "spring", stiffness: 160, damping: 24 }}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">Sizes are the longest side, give or take 2 mm.</p>
    </section>
  );
}

// ── FAQ ──────────────────────────────────────────────────────

function Answer({ item }: { item: FaqItem }) {
  if (!item.link) return <>{item.a}</>;
  const [before, after] = item.a.split(item.link.text);
  return (
    <>
      {before}
      <Link href={item.link.href} className="font-semibold text-accent underline-offset-4 hover:underline">
        {item.link.text}
      </Link>
      {after}
    </>
  );
}

export function ProductFaq({ product: p }: { product: Product }) {
  return (
    <section className="mt-10 border-t border-line pt-6">
      <h2 className="text-lg font-semibold tracking-tight">Questions</h2>
      <div className="mt-2 divide-y divide-line">
        {faqFor(p).map((item) => (
          <details key={item.q} className="group py-1">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg py-3 font-medium [&::-webkit-details-marker]:hidden">
              {item.q}
              <span aria-hidden className="text-xl leading-none text-muted transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <div className="pb-4 leading-relaxed text-muted">
              <Answer item={item} />
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
