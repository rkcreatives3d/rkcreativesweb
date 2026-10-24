"use client";

import { useEffect, useRef, useState } from "react";
import { getFinish, photosFor, type Product } from "@/lib/products";
import { recolor } from "@/lib/recolor";
import { renderFor } from "@/lib/renders";

/**
 * A product photo in a given finish. With `preview`, the photo is recoloured
 * in the browser (see lib/recolor.ts); `previewed` is false if that wasn't
 * possible and the original photo is showing instead.
 */
export function useFinishPhoto(src: string | undefined, finish: string, preview: boolean) {
  const [state, setState] = useState<{ url: string | undefined; previewed: boolean; busy: boolean }>({
    url: src,
    previewed: false,
    busy: false,
  });
  useEffect(() => {
    if (!src || !preview) {
      setState({ url: src, previewed: false, busy: false });
      return;
    }
    let live = true;
    setState((s) => ({ ...s, busy: true }));
    recolor(src, finish).then((url) => {
      if (live) setState(url ? { url, previewed: true, busy: false } : { url: src, previewed: false, busy: false });
    });
    return () => {
      live = false;
    };
  }, [src, finish, preview]);
  return state;
}

/**
 * Flat stand-in artwork, used in Lite mode for products that don't have photos
 * yet: a glowing orb in the product's finish with its initials. It prints in
 * from the bottom (CSS only) once `play` is true.
 */
export function ProductArt({ product: p, finish, large = false, play = true }: { product: Product; finish?: string; large?: boolean; play?: boolean }) {
  const f = getFinish(finish ?? p.finishes[0]);
  const initials = p.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  return (
    <div className="absolute inset-0 grid place-items-center" aria-hidden>
      <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 50%, ${f.color}30, transparent 62%)` }} />
      <div className={`relative ${play ? "print-in" : "opacity-0"}`}>
        <div
          className={`relative grid place-items-center rounded-full shadow-[0_18px_50px_-16px_var(--orb)] ${large ? "h-56 w-56" : "h-32 w-32"}`}
          style={{ background: f.swatch, ["--orb" as string]: f.color }}
        >
          <span className={`font-display display-case text-black/55 mix-blend-multiply ${large ? "text-7xl" : "text-4xl"}`}>{initials}</span>
        </div>
        <span className="print-line" />
      </div>
    </div>
  );
}

/**
 * Small square picture of a product in a colour, for lists (cart, checkout):
 * its own photo in that colour, else its studio render, else a colour tile
 * with its initial.
 */
export function ProductThumb({ product: p, finish, className = "h-16 w-16" }: { product: Product; finish: string; className?: string }) {
  const photos = photosFor(p, finish);
  const src = (!photos.recolor && photos.list[0]) || renderFor(p, finish, "sm");
  const f = getFinish(finish);
  if (!src)
    return (
      <div aria-hidden className={`grid shrink-0 place-items-center rounded-xl ${className}`} style={{ background: f.swatch }}>
        <span className="font-display text-xl font-extrabold text-page/70 mix-blend-hard-light">{p.name[0]}</span>
      </div>
    );
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" loading="lazy" decoding="async" className={`stage shrink-0 rounded-xl object-cover ${className}`} />;
}

/**
 * The product's studio render in a colour, filling its box: what Lite mode
 * shows instead of live 3D. Prints in from the bed up (CSS) once `play` is true.
 * Returns null when there's no render, so callers can fall back.
 */
export function StudioImage({
  product: p,
  finish,
  play = true,
  still = false,
  alt,
  priority = false,
}: {
  product: Product;
  finish: string;
  play?: boolean;
  /** no print-in: just the picture (standing in while the 3D loads) */
  still?: boolean;
  alt: string;
  /** the main picture of the page: load it first, not lazily */
  priority?: boolean;
}) {
  const src = renderFor(p, finish);
  if (!src) return null;
  return (
    <div className={`absolute inset-0 ${still ? "" : play ? "print-in" : "opacity-0"}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        srcSet={`${renderFor(p, finish, "sm")} 200w, ${src} 720w`}
        sizes="(min-width: 1024px) 40vw, (min-width: 640px) 50vw, 100vw"
        alt={`${alt}, ${getFinish(finish).name}`}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        className="h-full w-full object-cover"
      />
      {!still && <span className="print-line" />}
    </div>
  );
}

/** Cover photo (in the chosen finish) that swaps to the second photo on hover. */
export function PhotoStack({
  images,
  finish,
  preview,
  alt,
  hovered,
}: {
  images: string[];
  finish: string;
  preview: boolean;
  alt: string;
  hovered: boolean;
}) {
  const cover = useFinishPhoto(images[0], finish, preview);
  const second = useFinishPhoto(images[1], finish, preview && hovered);
  return (
    <div className="absolute inset-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cover.url}
        alt={`${alt}, ${getFinish(finish).name}`}
        loading="lazy"
        className={`absolute inset-0 h-full w-full object-cover transition-[filter,opacity] duration-300 ${cover.busy ? "opacity-70 blur-[2px]" : ""}`}
      />
      {images[1] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={second.url}
          alt=""
          loading="lazy"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${hovered && !second.busy ? "opacity-100" : "opacity-0"}`}
        />
      )}
      {cover.previewed && <PreviewTag />}
    </div>
  );
}

function PreviewTag({ large = false }: { large?: boolean }) {
  return (
    <span
      className={`pointer-events-none absolute bottom-3 left-3 rounded-md bg-black/55 font-medium text-white ${large ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-xs"}`}
    >
      Colour preview
    </span>
  );
}

/** Product page photo gallery: the main photo (tap for full screen) and thumbnails, in the chosen finish. */
export function Gallery({ images, finish, preview, alt }: { images: string[]; finish: string; preview: boolean; alt: string }) {
  const [active, setActive] = useState(0);
  const [full, setFull] = useState(false);
  useEffect(() => setActive((a) => (a < images.length ? a : 0)), [images]);
  const main = useFinishPhoto(images[active], finish, preview);
  return (
    <div>
      <button
        type="button"
        onClick={() => setFull(true)}
        aria-label={`Open photo ${active + 1} full screen`}
        className="stage relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-[var(--radius-tile)]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={main.url}
          alt={`${alt} in ${getFinish(finish).name}, photo ${active + 1}`}
          className={`h-full w-full object-cover transition-[filter,opacity] duration-300 ${main.busy ? "opacity-70 blur-[2px]" : ""}`}
        />
        {main.previewed && <PreviewTag large />}
      </button>
      {main.previewed && (
        <p className="mt-2 text-xs text-muted">
          Colour preview made from our photo of this piece. The real {getFinish(finish).name.toLowerCase()} print may look slightly different.
        </p>
      )}
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => setActive(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-pressed={active === i}
              className={`stage h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors sm:h-20 sm:w-20 ${active === i ? "border-fg" : "border-transparent opacity-75 hover:opacity-100"}`}
            >
              <Thumb src={src} finish={finish} preview={preview} />
            </button>
          ))}
        </div>
      )}
      {full && (
        <Lightbox
          images={images}
          start={active}
          finish={finish}
          preview={preview}
          alt={alt}
          onClose={(i) => {
            setActive(i);
            setFull(false);
          }}
        />
      )}
    </div>
  );
}

/** Full-screen photos: ←/→ or the buttons to move, Esc or ✕ to close. */
function Lightbox({
  images,
  start,
  finish,
  preview,
  alt,
  onClose,
}: {
  images: string[];
  start: number;
  finish: string;
  preview: boolean;
  alt: string;
  onClose: (at: number) => void;
}) {
  const [i, setI] = useState(start);
  const box = useRef<HTMLDivElement>(null);
  const photo = useFinishPhoto(images[i], finish, preview);
  const n = images.length;
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    box.current?.focus();
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
      opener?.focus();
    };
  }, []);
  return (
    <div
      ref={box}
      role="dialog"
      aria-modal="true"
      aria-label={`${alt}: photos`}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose(i);
        if (e.key === "ArrowRight") setI((v) => (v + 1) % n);
        if (e.key === "ArrowLeft") setI((v) => (v - 1 + n) % n);
      }}
      className="fixed inset-0 z-[70] flex flex-col bg-page outline-none"
    >
      <div className="flex items-center justify-between px-5 py-3">
        <span className="tabular-nums text-sm text-muted">
          {i + 1} / {n}
        </span>
        <button onClick={() => onClose(i)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-fg/5" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
            <path d="M3 3l10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="relative min-h-0 flex-1 px-4 pb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.url} alt={`${alt} in ${getFinish(finish).name}, photo ${i + 1}`} className="h-full w-full object-contain" />
        {n > 1 && (
          <>
            <button onClick={() => setI((v) => (v - 1 + n) % n)} aria-label="Previous photo" className="absolute left-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-page/90 shadow">
              ‹
            </button>
            <button onClick={() => setI((v) => (v + 1) % n)} aria-label="Next photo" className="absolute right-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-page/90 shadow">
              ›
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Thumb({ src, finish, preview }: { src: string; finish: string; preview: boolean }) {
  const { url } = useFinishPhoto(src, finish, preview);
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="h-full w-full object-cover" />;
}
