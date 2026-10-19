"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useInView } from "motion/react";
import { View } from "@react-three/drei";
import { occasions } from "@/lib/occasions";
import { products } from "@/lib/products";
import { modelFor } from "@/lib/models";
import { useLiteMode } from "@/lib/lite";
import { CardScene } from "../three/ProductScenes";
import { ProductArt } from "../ProductMedia";
import { Heading, Reveal, SectionLabel } from "../ui";

/** Occasion tiles: the quickest way into the shop. Each shows one of its products in 3D. */
export function ShopByOccasion() {
  const tiles = occasions
    .map((o) => ({ ...o, items: products.filter(o.test) }))
    .filter((o) => o.items.length > 0);

  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
      <SectionLabel>Shop by occasion</SectionLabel>
      <Heading className="mt-4 text-5xl sm:text-7xl">
        What&apos;s it <span className="holo-text">for?</span>
      </Heading>
      <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {tiles.map((t, i) => (
          <Reveal key={t.id} delay={(i % 3) * 0.06}>
            <Tile id={t.id} label={t.label} blurb={t.blurb} count={t.items.length} product={t.items[0]} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Tile({ id, label, blurb, count, product }: { id: string; label: string; blurb: string; count: number; product: (typeof products)[number] }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [hovered, setHovered] = useState(false);
  const lite = useLiteMode();
  return (
    <Link
      ref={ref}
      href={`/shop/?for=${id}`}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-[28px] border border-fg/10 bg-fg/[0.025] p-5 transition-colors hover:border-fg/30 sm:aspect-[5/4] sm:p-6"
    >
      <div className="absolute inset-x-0 top-0 h-[50%] sm:h-[72%]">
        {lite ? (
          <ProductArt product={product} />
        ) : (
          <View className="absolute inset-0">
            <CardScene shape={product.shape} model={modelFor(product)} finish={product.finishes[0]} active={hovered} inView={inView} />
          </View>
        )}
      </div>
      <div className="relative">
        <p className="font-display text-2xl display-case leading-tight sm:text-3xl">{label}</p>
        <p className="mt-1 hidden text-sm text-muted sm:block">{blurb}</p>
        <p className="mt-2 text-sm font-semibold text-accent">
          {count} {count === 1 ? "piece" : "pieces"} <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
        </p>
      </div>
    </Link>
  );
}
