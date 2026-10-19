"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { ReactLenis } from "lenis/react";
import { MotionConfig } from "motion/react";
import { useCart } from "@/lib/cart";
import { useFull3D, useLite } from "@/lib/lite";
import "@/lib/pointer";
import { CanvasRoot } from "./three/lazy";
import { LiteNotice } from "./LiteNotice";

// One fixed, transparent WebGL canvas sits over the page (three/CanvasRoot.tsx).
// Every 3D spot in the DOM is a window into it, so all scenes share one GL
// context. The 3D engine itself downloads only once the page is on screen and
// the browser is idle, so it never delays the first paint. In Lite mode
// (decided before first paint by the boot script) it never loads at all.
export function Providers({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null!);
  const full3D = useFull3D();
  // no smooth-scroll easing for people who've asked for less motion
  const [calm] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    useCart.persist.rehydrate();
    useLite.setState({ lite: document.documentElement.classList.contains("lite") });
    const start = () => useLite.setState({ ready: true });
    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(start, { timeout: 1200 });
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(start, 300);
    return () => clearTimeout(id);
  }, []);

  return (
    <ReactLenis root options={{ lerp: 0.1, wheelMultiplier: 1, smoothWheel: !calm }}>
      <MotionConfig reducedMotion="user">
        <div ref={root} className="relative">
          {children}
          <LiteNotice />
          {full3D && (
            <Suspense fallback={null}>
              <CanvasRoot eventSource={root} />
            </Suspense>
          )}
        </div>
      </MotionConfig>
    </ReactLenis>
  );
}
