"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { MotionConfig } from "motion/react";
import { useCart } from "@/lib/cart";
import { useFull3D, useLite } from "@/lib/lite";
import "@/lib/pointer";
import { CanvasRoot, use3DSpots } from "./three/lazy";
import { LiteNotice } from "./LiteNotice";
import { ToastHost } from "./Toast";
import { useShelf } from "@/lib/shelf";

// One fixed, transparent WebGL canvas sits over the page (three/CanvasRoot.tsx).
// Every 3D spot in the DOM is a window into it, so all scenes share one GL
// context. It (and the 3D engine) loads only on pages that have a 3D spot, and
// only once the page is on screen and the browser is idle, so it never delays
// the first paint. In Lite mode
// (decided before first paint by the boot script) it never loads at all.
/** When the opening animation has lifted away, in ms from page load (globals.css: lift 1.55 s + 0.5 s). */
const INTRO_MS = 2100;

export function Providers({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null!);
  const full3D = useFull3D();
  // the shared 3D canvas comes in with the first 3D spot (a product page, Personalise) and then stays
  const wanted = use3DSpots((s) => s.n > 0);
  const [canvas, setCanvas] = useState(false);
  useEffect(() => {
    if (wanted) setCanvas(true);
  }, [wanted]);

  useEffect(() => {
    useCart.persist.rehydrate();
    useShelf.persist.rehydrate();
    const lite = document.documentElement.classList.contains("lite");
    useLite.setState({ lite });
    const start = () => useLite.setState({ ready: true });
    let idle = 0;
    let timer = 0;
    const whenIdle = () => {
      if (typeof requestIdleCallback === "function") idle = requestIdleCallback(start, { timeout: 1200 });
      else timer = setTimeout(start, 300) as unknown as number;
    };
    // While the opening animation plays, the 3D engine waits: downloading and
    // compiling it would take the main thread from the animation on a phone.
    // It starts as the animation lifts away (about 3 s), or straight after Skip.
    const root = document.documentElement;
    const introPlaying = !root.classList.contains("no-intro") && location.pathname === "/";
    let watch: MutationObserver | null = null;
    if (introPlaying && performance.now() < INTRO_MS) {
      const go = () => {
        watch?.disconnect();
        clearTimeout(timer);
        whenIdle();
      };
      timer = window.setTimeout(go, INTRO_MS - performance.now());
      watch = new MutationObserver(() => root.classList.contains("intro-skipped") && go());
      watch.observe(root, { attributes: true, attributeFilter: ["class"] });
    } else whenIdle();
    return () => {
      watch?.disconnect();
      clearTimeout(timer);
      if (idle) cancelIdleCallback(idle);
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
        <div ref={root} className="relative">
          {children}
          <LiteNotice />
          <ToastHost />
          {full3D && canvas && (
            <Suspense fallback={null}>
              <CanvasRoot eventSource={root} />
            </Suspense>
          )}
        </div>
    </MotionConfig>
  );
}
