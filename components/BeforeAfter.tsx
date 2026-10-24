"use client";

import { useState } from "react";
import type { Photo } from "@/lib/content";
import { Reveal, SectionLabel } from "./ui";

/** Custom jobs as drag-to-compare pairs: what the customer sent vs. the finished print. */
export function BeforeAfter({ items }: { items: { title: string; before: Photo; after: Photo }[] }) {
  if (!items.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
      <SectionLabel>From photo to print</SectionLabel>
      <Reveal y={24}>
        <h2 className="mt-4 section-title text-3xl sm:text-[2.6rem]">
          What they sent, what we made
        </h2>
      </Reveal>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <Compare key={it.title} {...it} />
        ))}
      </div>
    </section>
  );
}

function Compare({ title, before, after }: { title: string; before: Photo; after: Photo }) {
  const [pos, setPos] = useState(50);
  return (
    <figure>
      <div className="relative aspect-square overflow-hidden rounded-3xl border border-fg/10 has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-accent-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={after.src} alt={after.caption ?? `${title}, the finished print`} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={before.src} alt={before.caption ?? `${title}, the photo we were sent`} loading="lazy" className="h-full w-full object-cover" />
        </div>
        <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-fg shadow-[0_0_12px_rgba(0,0,0,.6)]" style={{ left: `${pos}%` }}>
          <span className="absolute left-1/2 top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-fg text-sm text-page">
            ↔
          </span>
        </div>
        <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-page/70 px-2.5 py-1 text-xs">Sent</span>
        <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-page/70 px-2.5 py-1 text-xs">Printed</span>
        <input
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label={`${title}: slide to compare the photo sent with the finished print`}
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>
      <figcaption className="mt-3 font-semibold">{title}</figcaption>
    </figure>
  );
}
