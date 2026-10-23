"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "motion/react";
import type { Product } from "@/lib/products";
import { getFinish, photosFor } from "@/lib/products";
import { modelFor } from "@/lib/models";
import { renderFor } from "@/lib/renders";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/site";
import { flyToCart } from "@/lib/fly";
import { useLiteMode } from "@/lib/lite";
import { CardScene, View3D } from "./three/lazy";
import { PhotoStack, ProductArt, StudioImage } from "./ProductMedia";
import { Swatch } from "./ui";

export function ProductCard({ product: p, index = 0 }: { product: Product; index?: number }) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const add = useCart((s) => s.add);
  const lite = useLiteMode();
  const needsText = p.personalisation === "included";
  const [finish, setFinish] = useState(p.finishes[0]);
  const photos = photosFor(p, finish);
  const model = modelFor(p);
  // cursor position across the card, -1..1: the hovered model turns to follow it
  const pointer = useRef({ x: 0, y: 0 });
  // cards in a row print one after another
  const delay = 0.15 + (index % 3) * 0.18;

  return (
    <motion.article
      ref={ref}
      data-reveal
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-surface transition-colors hover:border-fg/30"
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.7, delay: (index % 3) * 0.08, ease: [0.16, 1, 0.3, 1] }}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--sx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--sy", `${e.clientY - r.top}px`);
        pointer.current = { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: ((e.clientY - r.top) / r.height) * 2 - 1 };
      }}
    >
      {/* soft white spotlight that follows the cursor */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "radial-gradient(320px circle at var(--sx) var(--sy), color-mix(in oklab, var(--color-fg) 6%, transparent), transparent 65%)" }}
      />
      <Link href={`/shop/${p.slug}/`} className="block" aria-label={p.badge ? `${p.name}, ${p.badge}` : p.name}>
        {/* light neutral stage, so every colour (white included) shows true */}
        <div className="stage relative aspect-square">
          {/* real 3D model → photo (with tilt) → placeholder 3D → in Lite mode: studio render, else flat art */}
          {model && !lite ? (
            <>
              <span aria-hidden className="stage-shadow" />
              <View3D className="absolute inset-0">
                <CardScene shape={p.shape} model={model} finish={finish} active={hovered} inView={inView} delay={delay} pointer={pointer} />
              </View3D>
            </>
          ) : photos.list.length ? (
            <PhotoStack images={photos.list} finish={finish} preview={photos.recolor} alt={p.name} hovered={hovered} />
          ) : !lite ? (
            <>
              <span aria-hidden className="stage-shadow" />
              <View3D className="absolute inset-0">
                <CardScene shape={p.shape} finish={finish} active={hovered} inView={inView} delay={delay} pointer={pointer} />
              </View3D>
            </>
          ) : (
            <>
              {renderFor(p, finish) ? (
                <StudioImage product={p} finish={finish} play={inView} alt={p.name} />
              ) : (
                <ProductArt product={p} finish={finish} play={inView} />
              )}
            </>
          )}
          {p.badge && (
            <span className="absolute left-4 top-4 rounded-full bg-pop px-3 py-1 tabular-nums text-xs font-semibold uppercase tracking-widest text-on-pop">
              {p.badge}
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 border-t border-line p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/shop/${p.slug}/`} className="font-display text-xl font-bold leading-tight hover:text-accent">
              {p.name}
            </Link>
          </div>
          <span className="shrink-0 tabular-nums text-sm">
            <span className="text-muted">from </span>
            {formatPrice(p.price)}
          </span>
        </div>
        <div className="mt-auto flex items-center justify-between">
          {/* colour swatches: hover or tap to see the piece in that colour */}
          <div className="-ml-[3px] flex items-center gap-0.5" role="radiogroup" aria-label="Colour">
            {p.finishes.map((f) => (
              <button
                key={f}
                role="radio"
                aria-checked={finish === f}
                aria-label={getFinish(f).name}
                title={getFinish(f).name}
                data-finish={f}
                onPointerEnter={(e) => e.pointerType === "mouse" && setFinish(f)}
                onClick={() => setFinish(f)}
                className={`rounded-full p-[3px] transition-transform hover:scale-125 ${finish === f ? "ring-2 ring-fg" : ""}`}
              >
                <Swatch css={getFinish(f).swatch} size={18} />
              </button>
            ))}
          </div>
          {needsText ? (
            <Link
              href={`/shop/${p.slug}/`}
              className="rounded-full border border-fg/20 px-4 py-1.5 text-xs font-semibold transition-all hover:border-transparent hover:bg-fg hover:text-page"
            >
              Add your name →
            </Link>
          ) : (
            <button
              onClick={(e) => {
                add({ slug: p.slug, finish, size: p.sizes[0].id });
                flyToCart(e.currentTarget, getFinish(finish).swatch);
              }}
              className="rounded-full border border-fg/20 px-4 py-1.5 text-xs font-semibold transition-all hover:border-transparent hover:bg-fg hover:text-page active:scale-95"
            >
              + Add
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
