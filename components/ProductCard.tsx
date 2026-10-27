"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "motion/react";
import type { Product } from "@/lib/products";
import { backdropFor, getFinish, photosFor } from "@/lib/products";
import { modelFor } from "@/lib/models";
import { renderFor } from "@/lib/renders";
import { formatPrice } from "@/lib/site";
import { useStudioRender } from "@/lib/studio";
import { CardScene, View3D } from "./three/lazy";
import { SaveButton } from "./SaveButton";
import { PhotoStack, ProductArt, StudioImage } from "./ProductMedia";
import { Swatch } from "./ui";

/** Most colours a card shows on a narrow phone card; the rest are on the product page. */
const NARROW_SWATCHES = 4;

/**
 * A product in a grid: the picture, its name and price, and its colours. The
 * whole card is one way in (to the product page); tapping or hovering a colour
 * shows the piece in that colour. Two per row on phones, three on desktop.
 * With a cover photo, that's what the card shows until a colour is picked
 * (hovering colours previews them; moving off the card brings the cover back).
 */
export function ProductCard({ product: p, index = 0 }: { product: Product; index?: number; printIn?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [finish, setFinish] = useState(p.finishes[0]);
  const [picked, setPicked] = useState<"tap" | "hover" | null>(null);
  const photos = photosFor(p, finish);
  const model = modelFor(p);
  // the live model is only for the render script that makes the studio pictures
  const studio = useStudioRender();
  const show3D = studio && (!!model || !photos.list.length);
  // the cover photo until a colour is picked, and for good when there's no picture of it in colours
  const showCover = !!p.cover && !studio && (!picked || (!model && !photos.list.length && !renderFor(p, finish)));
  const pointer = useRef({ x: 0, y: 0 });

  return (
    <motion.article
      ref={ref}
      data-reveal
      className="group relative flex flex-col"
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.7, delay: (index % 3) * 0.06, ease: [0.16, 1, 0.3, 1] }}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={() => {
        setHovered(false);
        setPicked((v) => (v === "hover" ? null : v));
      }}
    >
      <div className="relative">
        {/* the picture is a second way in for pointers; keyboards and screen readers use the name below */}
        <Link href={`/shop/${p.slug}/`} className="block rounded-[var(--radius-card)]" tabIndex={-1} aria-hidden>
          <div className={`stage ${showCover ? "" : backdropFor(finish)} zoom-on-hover relative aspect-square overflow-hidden rounded-[var(--radius-card)]`}>
            {showCover ? (
              // the owner's own photo, as taken (square here, so it fills the card)
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.coverSmall ?? p.cover} alt={p.name} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
            ) : show3D ? (
              <>
                <span aria-hidden className="stage-shadow" />
                <View3D className="absolute inset-0">
                  <CardScene shape={p.shape} model={model} finish={finish} active={false} inView={inView} delay={0} pointer={pointer} standIn={false} animateIn={false} />
                </View3D>
              </>
            ) : photos.list.length ? (
              <PhotoStack images={photos.list} finish={finish} preview={photos.recolor} alt={p.name} hovered={hovered} />
            ) : renderFor(p, finish) ? (
              <StudioImage product={p} finish={finish} still alt={p.name} />
            ) : (
              <ProductArt product={p} finish={finish} play={inView} />
            )}
          </div>
        </Link>
        {/* a sibling of the link, not inside it (a button can't sit inside a link) */}
        <SaveButton slug={p.slug} name={p.name} className="absolute right-2 top-2 z-[2] sm:right-3 sm:top-3" />
      </div>

      <div className="mt-3 px-0.5 sm:mt-4">
        {p.badge && <p className="text-xs font-semibold text-accent">{p.badge}</p>}
        <h3 className="text-[0.9375rem] font-semibold leading-snug tracking-tight sm:text-[1.0625rem]">
          <Link href={`/shop/${p.slug}/`} className="inline-block py-0.5 hover:underline hover:decoration-fg/30 hover:underline-offset-4">
            {p.name}
          </Link>
        </h3>
        <p className="mt-0.5 tabular-nums text-sm text-muted">
          {p.sizes.some((s) => s.priceDelta) ? "From " : ""}
          {formatPrice(p.price)}
        </p>
        {/* colours: hover or tap to see the piece in that colour */}
        <div className="-ml-1 mt-2 flex items-center" role="radiogroup" aria-label="Colour">
          {p.finishes.map((f, i) => (
            <button
              key={f}
              role="radio"
              aria-checked={finish === f}
              aria-label={getFinish(f).name}
              title={getFinish(f).name}
              data-finish={f}
              onPointerEnter={(e) => {
                if (e.pointerType !== "mouse") return;
                setFinish(f);
                setPicked((v) => v ?? "hover");
              }}
              onClick={() => {
                setFinish(f);
                setPicked("tap");
              }}
              className={`grid h-7 w-7 place-items-center rounded-full ${i >= NARROW_SWATCHES ? "hidden sm:grid" : ""}`}
            >
              <span className={`grid place-items-center rounded-full p-[2px] ${finish === f ? "ring-1 ring-fg" : ""}`}>
                <Swatch css={getFinish(f).swatch} size={14} />
              </span>
            </button>
          ))}
          {p.finishes.length > NARROW_SWATCHES && (
            <span className="pl-1 text-xs text-muted sm:hidden" aria-hidden>
              +{p.finishes.length - NARROW_SWATCHES}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}
