"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogoScene, View3D } from "../three/lazy";
import type { CoverFrame } from "../three/LogoScene";
import { ButtonLink } from "../ui";
import { products } from "@/lib/products";
import { dispatchLabel, formatPrice, site } from "@/lib/site";
import { useFull3D } from "@/lib/lite";

// the logo cut out of its black square (the browser's pick doubles as the 3D texture)
const LOGO_SRCSET = "/brand/logo-cut-480.webp 480w, /brand/logo-cut-720.webp 720w, /brand/logo-cut-1080.webp 1080w";
const LOGO_SIZES = "(min-width: 1024px) min(46vw, 64svh), (min-width: 640px) min(60vw, 42svh), min(68vw, 34svh)";
const fromPrice = Math.min(...products.map((p) => p.price));
const city = site.city.split(",")[0];

/**
 * Cover page: what we sell and the way in on one side, the brand logo in 3D on
 * the other (stacked on phones). The plain <img> is the logo's one source of
 * truth: it paints instantly, the 3D logo is placed exactly over it, and the
 * intro lands on it too.
 *
 * The text fades in with CSS (.hero-in), so it never waits for JavaScript on a
 * slow phone; when the intro plays, it waits for the intro to finish instead.
 */
export function Hero() {
  const full3D = useFull3D();
  const router = useRouter();
  const section = useRef<HTMLElement>(null);
  // the owner's way in: tap the logo 5 times within 3 seconds
  const taps = useRef<number[]>([]);
  const tap = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < 3000), now];
    if (taps.current.length >= 5) {
      taps.current = [];
      router.push("/owner/");
    }
  };
  const img = useRef<HTMLImageElement>(null);
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [frame, setFrame] = useState<CoverFrame | null>(null);
  const [shown3D, setShown3D] = useState(false);

  useEffect(() => {
    const el = img.current;
    if (!el) return;
    // no 3D work until the cover image has painted, and it reuses whichever size the browser picked
    const done = () => setLogoSrc(el.currentSrc || el.src);
    if (el.complete) done();
    else {
      el.addEventListener("load", done, { once: true });
      el.addEventListener("error", done, { once: true });
    }
  }, []);

  // where the logo sits inside the cover, as fractions of it (the 3D view covers the whole section)
  useEffect(() => {
    const s = section.current;
    const el = img.current;
    if (!s || !el || !full3D) return;
    const measure = () => {
      const a = s.getBoundingClientRect();
      const b = el.getBoundingClientRect();
      setFrame({ x: (b.left + b.width / 2 - a.left) / a.width, y: (b.top + b.height / 2 - a.top) / a.height, size: b.height / a.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(s);
    ro.observe(el);
    return () => ro.disconnect();
  }, [full3D]);

  return (
    <section ref={section} className="cover-bg relative overflow-hidden">
      <div className="mx-auto grid min-h-[100svh] max-w-7xl content-center items-center gap-4 px-5 pb-8 pt-20 sm:gap-6 sm:px-8 sm:pt-24 lg:grid-cols-[1fr_1.1fr] lg:gap-8 lg:pb-12 lg:pt-28">
        <div className="relative z-20 order-2 lg:order-1">
          <p className="hero-in flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted" style={{ ["--d" as string]: "0.05s" }}>
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-pop" />
            3D print studio · {city}
          </p>
          <h1
            className="hero-in mt-3 font-display text-[2.3rem] font-extrabold display-case leading-[0.92] tracking-tight min-[380px]:text-[2.6rem] sm:mt-4 sm:text-6xl xl:text-7xl"
            style={{ ["--d" as string]: "0.12s" }}
          >
            Gifts &amp; décor,
            <br />
            <span className="holo-text">printed for you</span>
          </h1>
          {/* on short phone screens this line gives way, so the buttons stay on the first screen */}
          <p
            className="hero-in mt-4 max-w-md text-base leading-relaxed text-fg/80 max-sm:[@media(max-height:700px)]:hidden sm:mt-5 sm:text-lg"
            style={{ ["--d" as string]: "0.2s" }}
          >
            Name keychains, lamps, vases and custom builds. Printed to order in {city}, shipped across India.
          </p>
          <ul
            className="hero-in mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-sm font-semibold text-fg [&>li]:flex [&>li]:items-center [&>li]:gap-2"
            style={{ ["--d" as string]: "0.26s" }}
            aria-label="At a glance"
          >
            {/* a dot before every item, so a wrapped line never starts with a stray separator */}
            {[`From ${formatPrice(fromPrice)}`, `Ships in ${dispatchLabel} days`, "Pay by UPI"].map((t) => (
              <li key={t}>
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent-fill" />
                {t}
              </li>
            ))}
          </ul>
          <div className="hero-in mt-6 flex flex-wrap gap-3 sm:mt-7" style={{ ["--d" as string]: "0.32s" }}>
            <ButtonLink href="/shop/" primary>
              Shop the collection →
            </ButtonLink>
            <ButtonLink href="/custom/">Custom print</ButtonLink>
          </div>
        </div>

        <div
          onClick={tap}
          className="relative order-1 aspect-square w-[min(68vw,34svh)] touch-manipulation select-none justify-self-center sm:w-[min(60vw,42svh)] lg:order-2 lg:w-[min(46vw,64svh)]"
        >
          <div aria-hidden className="pointer-events-none absolute inset-[8%] rounded-full bg-accent-fill/20 blur-[90px]" />
          {/* plain logo: in the page HTML so it shows instantly; fades out under the identical 3D logo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={img}
            id="cover-logo"
            // same request mode as the 3D texture loader, so the texture comes from the browser's cache
            crossOrigin="anonymous"
            src="/brand/logo-cut-1080.webp"
            srcSet={LOGO_SRCSET}
            sizes={LOGO_SIZES}
            width={1080}
            height={1080}
            alt={`${site.name} logo`}
            fetchPriority="high"
            // the CSS float only without 3D (the 3D logo floats itself): the image stays put, so the
            // 3D logo lands exactly on it and the quick cross-fade shows no double image
            className={`logo-cut relative h-full w-full transition-opacity duration-300 ${full3D ? "" : "logo-float"} ${full3D && shown3D ? "opacity-0" : "opacity-100"}`}
          />
        </div>
      </div>

      {full3D && logoSrc && frame && (
        <View3D className="absolute inset-0">
          <LogoScene url={logoSrc} frame={frame} onShown={() => setShown3D(true)} />
        </View3D>
      )}
    </section>
  );
}
