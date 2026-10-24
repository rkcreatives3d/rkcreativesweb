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
import { bumpCart } from "@/lib/fly";
import { useLiteMode } from "@/lib/lite";
import { useToast } from "@/lib/toast";
import { track } from "@/lib/track";
import { CardScene, View3D, is3DLoaded } from "./three/lazy";
import { PlusIcon, SpinIcon } from "./Icons";
import { SaveButton } from "./SaveButton";
import { PhotoStack, ProductArt, StudioImage } from "./ProductMedia";
import { Swatch } from "./ui";

/** Most colours a card shows on a narrow phone card; the rest are on the product page. */
const NARROW_SWATCHES = 4;

/**
 * A product in a grid. Two per row on phones (compact: "+" on the picture),
 * three on desktop. Tap a colour to see it, the heart to save it.
 */
export function ProductCard({ product: p, index = 0, printIn }: { product: Product; index?: number; printIn?: boolean }) {
  // the print-in is a first-row moment; further down products are simply there
  const animateIn = printIn ?? index < 3;
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const add = useCart((s) => s.add);
  const showToast = useToast((s) => s.show);
  const lite = useLiteMode();
  const needsText = p.personalisation === "included";
  const [finish, setFinish] = useState(p.finishes[0]);
  const photos = photosFor(p, finish);
  const model = modelFor(p);
  // live 3D (a real model, or the placeholder shape when there are no photos), unless Lite
  const show3D = !lite && (!!model || !photos.list.length);
  // on a fresh page load the 3D engine is still downloading: the studio picture stands in until the model is up
  const [standIn] = useState(() => !is3DLoaded());
  const [shown3D, setShown3D] = useState(false);
  // cursor position across the card, -1..1: the hovered model turns to follow it
  const pointer = useRef({ x: 0, y: 0 });
  // cards in a row print one after another
  const delay = 0.15 + (index % 3) * 0.18;
  const quickAdd = (from: Element) => {
    add({ slug: p.slug, finish, size: p.sizes[0].id });
    track("add_to_cart", {
      product: p.slug,
      finish,
      size: p.sizes[0].id,
      value: p.price,
      from: "card",
    });
    bumpCart();
    showToast({
      title: "Added to cart",
      detail: `${p.name} · ${getFinish(finish).name} · ${p.sizes[0].label}`,
      image: renderFor(p, finish, "sm") ?? photos.list[0],
      cart: true,
    });
  };

  return (
    <motion.article
      ref={ref}
      data-reveal
      className="card-lift group relative flex flex-col overflow-hidden rounded-2xl transition-shadow hover:shadow-[0_2px_4px_rgb(42_33_25/0.06),0_18px_40px_-16px_rgb(42_33_25/0.32)] sm:rounded-3xl"
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{
        duration: 0.7,
        delay: (index % 3) * 0.08,
        ease: [0.16, 1, 0.3, 1],
      }}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--sx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--sy", `${e.clientY - r.top}px`);
        pointer.current = {
          x: ((e.clientX - r.left) / r.width) * 2 - 1,
          y: ((e.clientY - r.top) / r.height) * 2 - 1,
        };
      }}
    >
      {/* soft white spotlight that follows the cursor */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: "radial-gradient(320px circle at var(--sx) var(--sy), color-mix(in oklab, var(--color-fg) 6%, transparent), transparent 65%)",
        }}
      />
      <div className="relative">
        <Link href={`/shop/${p.slug}/`} className="block" aria-label={p.badge ? `${p.name}, ${p.badge}` : p.name}>
          {/* light neutral stage, so every colour (white included) shows true */}
          <div className="stage relative aspect-square">
            {/* real 3D model → photo (with tilt) → placeholder 3D → in Lite mode: studio render, else flat art */}
            {show3D ? (
              <>
                <span aria-hidden className="stage-shadow" />
                {standIn && !shown3D && <StudioImage product={p} finish={finish} still alt={p.name} />}
                <View3D className="absolute inset-0">
                  <CardScene
                    shape={p.shape}
                    model={model}
                    finish={finish}
                    active={hovered}
                    inView={inView}
                    delay={delay}
                    pointer={pointer}
                    standIn={standIn}
                    onShown={() => setShown3D(true)}
                    animateIn={animateIn}
                  />
                </View3D>
              </>
            ) : photos.list.length ? (
              <PhotoStack images={photos.list} finish={finish} preview={photos.recolor} alt={p.name} hovered={hovered} />
            ) : (
              <>
                {renderFor(p, finish) ? (
                  <StudioImage product={p} finish={finish} play={inView} still={!animateIn} alt={p.name} />
                ) : (
                  <ProductArt product={p} finish={finish} play={inView} />
                )}
              </>
            )}
            {p.badge && (
              <span className="absolute left-2 top-2 max-w-[calc(100%-3.25rem)] truncate rounded-full bg-pop px-2 py-1 tabular-nums text-[10px] font-semibold uppercase tracking-normal text-on-pop sm:left-4 sm:top-4 sm:px-3 sm:text-xs sm:tracking-widest">
                {p.badge}
              </span>
            )}
            {/* only products that really turn round on their page: a 3D model, or no photos yet */}
            {(!!model || !photos.list.length) && (
              <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-page/80 px-2 py-1 text-xs font-semibold text-fg sm:bottom-3 sm:left-auto sm:right-3 sm:gap-1.5 sm:px-2.5">
                <SpinIcon size={14} /> 360°
              </span>
            )}
          </div>
        </Link>
        {/* siblings of the link, not inside it (a button can't sit inside a link) */}
        <SaveButton slug={p.slug} name={p.name} className="absolute right-2 top-2 z-[2] sm:right-4 sm:top-4" />
        {/* phones: a round "+" on the picture, so the card stays compact */}
        {needsText ? (
          <Link
            href={`/shop/${p.slug}/`}
            aria-label={`Add your name to the ${p.name}`}
            className="absolute bottom-2 right-2 z-[2] grid h-10 w-10 place-items-center rounded-full bg-fg text-page shadow-md sm:hidden"
          >
            <PlusIcon />
          </Link>
        ) : (
          <button
            onClick={(e) => quickAdd(e.currentTarget)}
            aria-label={`Add ${p.name} to cart`}
            className="absolute bottom-2 right-2 z-[2] grid h-10 w-10 place-items-center rounded-full bg-fg text-page shadow-md active:scale-90 sm:hidden"
          >
            <PlusIcon />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 border-t border-line p-3 sm:gap-3 sm:p-5">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div className="min-w-0">
            <Link href={`/shop/${p.slug}/`} className="font-display text-base font-bold leading-tight hover:text-accent sm:text-xl">
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
            {p.finishes.map((f, i) => (
              <button
                key={f}
                role="radio"
                aria-checked={finish === f}
                aria-label={getFinish(f).name}
                title={getFinish(f).name}
                data-finish={f}
                onPointerEnter={(e) => e.pointerType === "mouse" && setFinish(f)}
                onClick={() => setFinish(f)}
                className={`rounded-full p-[3px] transition-transform hover:scale-125 ${finish === f ? "ring-2 ring-fg" : ""} ${
                  i >= NARROW_SWATCHES ? "hidden sm:block" : ""
                }`}
              >
                <Swatch css={getFinish(f).swatch} size={18} />
              </button>
            ))}
            {p.finishes.length > NARROW_SWATCHES && (
              <span className="pl-1 text-xs font-semibold text-muted sm:hidden" aria-hidden>
                +{p.finishes.length - NARROW_SWATCHES}
              </span>
            )}
          </div>
          {needsText ? (
            <Link
              href={`/shop/${p.slug}/`}
              className="hidden rounded-full border border-fg/20 px-4 py-1.5 text-xs font-semibold transition-all hover:border-transparent hover:bg-fg hover:text-page sm:inline-block"
            >
              Add your name →
            </Link>
          ) : (
            <button
              onClick={(e) => quickAdd(e.currentTarget)}
              className="hidden rounded-full border border-fg/20 px-4 py-1.5 text-xs font-semibold transition-all hover:border-transparent hover:bg-fg hover:text-page active:scale-95 sm:inline-block"
            >
              + Add
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
