"use client";

import { useEffect, useState } from "react";
import { getFinish, type Product } from "@/lib/products";
import { deliveryWindow } from "@/lib/site";
import { recolor } from "@/lib/recolor";

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
 * yet: a glowing orb in the product's finish with its initials.
 */
export function ProductArt({ product: p, finish, large = false }: { product: Product; finish?: string; large?: boolean }) {
  const f = getFinish(finish ?? p.finishes[0]);
  const initials = p.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  return (
    <div className="absolute inset-0 grid place-items-center" aria-hidden>
      <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 50%, ${f.color}30, transparent 62%)` }} />
      <div
        className={`relative grid place-items-center rounded-full shadow-[0_0_80px_-10px_var(--orb)] ${large ? "h-56 w-56" : "h-32 w-32"}`}
        style={{ background: f.swatch, ["--orb" as string]: f.color }}
      >
        <span className={`font-display display-case text-black/55 mix-blend-multiply ${large ? "text-7xl" : "text-4xl"}`}>{initials}</span>
      </div>
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
    <>
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
    </>
  );
}

function PreviewTag({ large = false }: { large?: boolean }) {
  return (
    <span
      className={`pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/60 font-mono uppercase tracking-widest text-white/80 backdrop-blur ${
        large ? "px-3 py-1.5 text-[10px]" : "px-2.5 py-1 text-[9px]"
      }`}
    >
      Colour preview
    </span>
  );
}

/** Product page photo gallery with thumbnails, in the chosen finish. */
export function Gallery({ images, finish, preview, alt }: { images: string[]; finish: string; preview: boolean; alt: string }) {
  const [active, setActive] = useState(0);
  useEffect(() => setActive((a) => (a < images.length ? a : 0)), [images]);
  const main = useFinishPhoto(images[active], finish, preview);
  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-[32px] border border-fg/10 bg-page-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={main.url}
          alt={`${alt} in ${getFinish(finish).name}, photo ${active + 1}`}
          className={`h-full w-full object-cover transition-[filter,opacity] duration-300 ${main.busy ? "opacity-70 blur-[2px]" : ""}`}
        />
        {main.previewed && <PreviewTag large />}
      </div>
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
              className={`h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 transition-colors ${active === i ? "border-accent" : "border-transparent opacity-70 hover:opacity-100"}`}
            >
              <Thumb src={src} finish={finish} preview={preview} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Thumb({ src, finish, preview }: { src: string; finish: string; preview: boolean }) {
  const { url } = useFinishPhoto(src, finish, preview);
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="h-full w-full object-cover" />;
}

/** "Delivered by …" — computed in the visitor's browser so the date is never stale. */
export function DeliveryEstimate({ className = "" }: { className?: string }) {
  const [range, setRange] = useState<string | null>(null);
  useEffect(() => setRange(deliveryWindow()), []);
  if (!range) return null;
  return (
    <p className={className}>
      <span aria-hidden>🚚 </span>Order today, delivered <span className="text-fg">{range}</span>
    </p>
  );
}
