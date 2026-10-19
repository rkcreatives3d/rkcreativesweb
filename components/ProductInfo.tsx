"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { Product, Size } from "@/lib/products";
import { dispatchLabel } from "@/lib/site";

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
    <div className="mt-10">
      <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">How big is it?</h2>
      {p.scalePhoto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.scalePhoto} alt={`${p.name} held in a hand, for scale`} className="mt-4 aspect-[4/3] w-full rounded-2xl object-cover" loading="lazy" />
      )}
      <ul className="mt-4 space-y-3" aria-label="Size compared with everyday objects">
        {rows.map(([name, v, me]) => (
          <li key={name}>
            <p className="flex justify-between text-sm">
              <span className={me ? "font-semibold" : "text-muted"}>{name}</span>
              <span className="tabular-nums text-muted">{v} cm</span>
            </p>
            <div className="mt-1.5 h-2.5 rounded-full bg-fg/[0.06]">
              <motion.div
                className={`h-full rounded-full ${me ? "bg-pop" : "bg-fg/25"}`}
                initial={false}
                animate={{ width: `${(v / max) * 100}%` }}
                transition={{ type: "spring", stiffness: 160, damping: 24 }}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">Sizes are the longest side, give or take 2 mm.</p>
    </div>
  );
}

// ── FAQ ──────────────────────────────────────────────────────

export type Faq = [question: string, answer: React.ReactNode];

const general: Faq[] = [
  [
    "Is it made after I order?",
    `Yes. Every piece is printed to order on our own machines, then cleaned up and checked by hand. Allow ${dispatchLabel} working days before it ships.`,
  ],
  [
    "Will the colour look like the photos?",
    "Very close. Screens show colours a little differently, and up close you'll see fine layer lines. That's how 3D prints look. Ask on WhatsApp and we'll send a real photo of the colour.",
  ],
  [
    "Can I get a different size or colour?",
    <>
      Usually, yes. Message us with what you need, or use the{" "}
      <Link href="/custom/" className="font-semibold text-accent underline-offset-4 hover:underline">
        custom order form
      </Link>
      , and we&apos;ll quote it.
    </>,
  ],
  [
    "What if it arrives damaged?",
    <>
      Message us within 48 hours with photos and we&apos;ll reprint it or refund you. See the{" "}
      <Link href="/policies/returns/" className="font-semibold text-accent underline-offset-4 hover:underline">
        returns policy
      </Link>
      .
    </>,
  ],
];

export function ProductFaq({ product: p }: { product: Product }) {
  const items = [...(p.faq ?? []), ...general];
  return (
    <div className="mt-10">
      <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Questions</h2>
      <div className="mt-3 divide-y divide-fg/10 border-y border-fg/10">
        {items.map(([q, a]) => (
          <details key={q} className="group py-1">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg py-3 font-semibold [&::-webkit-details-marker]:hidden">
              {q}
              <span aria-hidden className="text-xl leading-none text-muted transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <div className="pb-4 leading-relaxed text-fg/75">{a}</div>
          </details>
        ))}
      </div>
    </div>
  );
}
