"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/lib/site";

// the logo cut out of its black square (as in the brand story on the home page)
const LOGO_SRCSET = "/brand/logo-cut-480.webp 480w, /brand/logo-cut-720.webp 720w";

/**
 * Opening animation: the logo prints itself on a print bed, layer by layer,
 * with the nozzle sweeping each layer; the layer lines fuse, a sheen passes
 * over it, and the page lifts away like a curtain onto the home page (about 2
 * seconds, short so it never holds up the shop).
 *
 * It's all CSS (see "opening animation" in globals.css) on markup that's in
 * the static HTML, so it starts with the first paint and never waits for
 * JavaScript: smooth on a budget phone, no 3D involved. The boot script in
 * <head> (lib/lite.ts) decides whether it plays (home page, once per visit,
 * not for reduced motion) and makes a tap, Esc or "Skip" end it, all before
 * the page's JavaScript has loaded. This component only removes it after.
 */
export function Intro() {
  const [gone, setGone] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    // not playing, or already over by the time the page's JavaScript is ready (a slow phone)
    if (!el || document.documentElement.classList.contains("no-intro") || getComputedStyle(el).visibility === "hidden") {
      setGone(true);
      return;
    }
    const end = (e: AnimationEvent) => e.target === el && setGone(true);
    el.addEventListener("animationend", end);
    const t = setTimeout(() => setGone(true), 2800); // in case `animationend` is missed
    return () => {
      el.removeEventListener("animationend", end);
      clearTimeout(t);
    };
  }, []);

  if (gone) return null;

  return (
    <div id="intro" ref={ref} role="dialog" aria-label={`${site.name} opening animation`} className="theme-dark intro-bg">
      <div className="intro-stage" aria-hidden>
        {/* a window that rises from the bed while the picture inside counter-moves, so the
            print grows upward using transforms alone (smooth even while the page loads) */}
        <div className="intro-clip">
          <div className="intro-window">
            <div className="intro-print">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo-cut-480.webp" srcSet={LOGO_SRCSET} sizes="min(64vw, 42vh)" alt="" width={480} height={480} fetchPriority="high" />
              <span className="intro-lines" />
              <span className="intro-shine" />
            </div>
          </div>
        </div>
        <span className="intro-head">
          <span className="intro-nozzle" />
        </span>
        <span className="intro-bed" />
      </div>
      {/* the boot script's click listener does the skipping */}
      <button type="button" className="intro-skip-btn">
        Skip
      </button>
    </div>
  );
}
