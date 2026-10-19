"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "motion/react";
import { View } from "@react-three/drei";
import type { Product } from "@/lib/products";
import { getFinish, photosFor } from "@/lib/products";
import { modelFor } from "@/lib/models";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/site";
import { flyToCart } from "@/lib/fly";
import { useLiteMode } from "@/lib/lite";
import { CardScene } from "./three/ProductScenes";
import { PhotoStack, ProductArt } from "./ProductMedia";
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

  return (
    <motion.article
      ref={ref}
      className="group relative flex flex-col overflow-hidden rounded-[28px] border border-fg/10 bg-fg/[0.025] transition-colors hover:border-fg/30"
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.8, delay: (index % 3) * 0.08, ease: [0.16, 1, 0.3, 1] }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--sx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--sy", `${e.clientY - r.top}px`);
      }}
    >
      {/* amber spotlight that follows the cursor */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "radial-gradient(320px circle at var(--sx) var(--sy), color-mix(in oklab, var(--color-accent) 16%, transparent), transparent 65%)" }}
      />
      <Link href={`/shop/${p.slug}/`} className="block" aria-label={p.name}>
        <div className="relative aspect-square">
          <div
            className="absolute inset-0 opacity-60 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background: `radial-gradient(circle at 50% 55%, ${getFinish(p.finishes[0]).color}33, transparent 60%)`,
            }}
          />
          {/* real 3D model → photo (with tilt) → placeholder 3D → flat art in Lite mode */}
          {model && !lite ? (
            <View className="absolute inset-0">
              <CardScene shape={p.shape} model={model} finish={finish} hovered={hovered} inView={inView} />
            </View>
          ) : photos.list.length ? (
            <PhotoStack images={photos.list} finish={finish} preview={photos.recolor} alt={p.name} hovered={hovered} />
          ) : !lite ? (
            <View className="absolute inset-0">
              <CardScene shape={p.shape} finish={finish} hovered={hovered} inView={inView} />
            </View>
          ) : (
            <ProductArt product={p} finish={finish} />
          )}
          {p.badge && (
            <span className="absolute left-4 top-4 rounded-full bg-pop px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-on-pop">
              {p.badge}
            </span>
          )}
          <span className="absolute right-4 top-4 font-mono text-[10px] uppercase tracking-widest text-muted">
            {p.category}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 border-t border-fg/10 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/shop/${p.slug}/`} className="font-display text-xl font-bold leading-tight hover:text-accent">
              {p.name}
            </Link>
            <p className="mt-1 line-clamp-1 text-sm text-muted">{p.tagline}</p>
          </div>
          <span className="shrink-0 font-mono text-sm">
            <span className="text-muted">from </span>
            {formatPrice(p.price)}
          </span>
        </div>
        <div className="mt-auto flex items-center justify-between">
          {/* colour swatches: hover or tap to see the piece in that colour */}
          <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Colour">
            {p.finishes.map((f) => (
              <button
                key={f}
                role="radio"
                aria-checked={finish === f}
                aria-label={getFinish(f).name}
                title={getFinish(f).name}
                onPointerEnter={(e) => e.pointerType === "mouse" && setFinish(f)}
                onClick={() => setFinish(f)}
                className={`rounded-full transition-transform hover:scale-125 ${finish === f ? "ring-2 ring-fg ring-offset-2 ring-offset-page" : ""}`}
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
