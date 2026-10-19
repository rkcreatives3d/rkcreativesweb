"use client";

import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import { INTRO_KEY } from "@/lib/lite";
import { site } from "@/lib/site";
import { INTRO_LAYERS, useIntro } from "@/lib/intro";

// if the 3D can't load, skip straight past it (the timer below opens the site)
const IntroCanvas = lazy(() => import("./IntroCanvas").catch(() => ({ default: (() => null) as unknown as typeof import("./IntroCanvas").default })));

/**
 * Opening animation: a 3D printer prints the logo, then fades into the cover
 * page. Plays on the home page, once per visit (the boot script in <head> adds
 * `no-intro` otherwise, which hides the overlay before first paint). The black
 * overlay is part of the static HTML, so the site never flashes before it.
 * Skippable; never shown in Lite mode or to people who prefer reduced motion.
 */
export function Intro() {
  const [mounted, setMounted] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  const left = useRef(false);
  const pct = useRef<HTMLSpanElement>(null);
  const layer = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const lenis = useLenis();
  const finish = useIntro((s) => s.finish);

  const leave = useCallback(() => {
    if (left.current) return;
    left.current = true;
    finish();
    setLeaving(true);
    setTimeout(() => setGone(true), 800);
  }, [finish]);

  useEffect(() => {
    if (document.documentElement.classList.contains("no-intro")) {
      left.current = true;
      finish();
      setGone(true);
      return;
    }
    try {
      sessionStorage.setItem(INTRO_KEY, "1");
    } catch {}
    import("./IntroCanvas").catch(() => {}); // warm the chunk while React finishes hydrating
    setMounted(true);
  }, [finish]);

  // safety net: whatever happens (slow phone, no WebGL, chunk failed), the site opens within 7 s
  useEffect(() => {
    if (!mounted) return;
    const id = setTimeout(leave, 7000);
    return () => clearTimeout(id);
  }, [mounted, leave]);

  // no scrolling the page underneath while the intro is up
  useEffect(() => {
    const root = document.documentElement;
    if (gone) {
      root.style.overflow = "";
      lenis?.start();
    } else {
      root.style.overflow = "hidden";
      lenis?.stop();
    }
  }, [gone, lenis]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && leave();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [leave]);

  const onProgress = useCallback((p: number, l: number) => {
    if (pct.current) pct.current.textContent = String(Math.round(p * 100)).padStart(3, "0");
    if (layer.current) layer.current.textContent = String(l).padStart(3, "0");
    if (bar.current) bar.current.style.transform = `scaleX(${p})`;
  }, []);

  if (gone) return null;

  return (
    <div
      id="intro"
      role="dialog"
      aria-label={`${site.name} opening animation`}
      className={`fixed inset-0 z-[90] bg-black transition-opacity duration-700 ease-out ${leaving ? "pointer-events-none opacity-0" : ""}`}
    >
      {mounted && (
        <Suspense fallback={null}>
          <IntroCanvas onProgress={onProgress} onDone={leave} />
        </Suspense>
      )}

      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5 font-mono text-[10px] uppercase tracking-[0.3em] text-muted sm:p-8 sm:text-[11px]">
        <span>{site.handle}</span>
        <button
          onClick={leave}
          className="rounded-full border border-fg/15 px-4 py-2 tracking-[0.25em] transition-colors hover:border-accent hover:text-fg"
        >
          Skip →
        </button>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 px-5 pb-8 sm:pb-10">
        <div className="mx-auto max-w-md font-mono text-[10px] uppercase tracking-[0.3em] text-muted sm:text-[11px]">
          <div className="flex justify-between gap-4">
            <span>
              Printing <span ref={pct} className="text-accent">000</span>%
            </span>
            <span>
              Layer <span ref={layer} className="text-fg">000</span>/{INTRO_LAYERS}
            </span>
          </div>
          <div className="mt-3 h-px bg-fg/10">
            <div ref={bar} className="h-full origin-left bg-accent" style={{ transform: "scaleX(0)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
