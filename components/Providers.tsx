"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { ReactLenis } from "lenis/react";
import { MotionConfig } from "motion/react";
import { useCart } from "@/lib/cart";
import { useFull3D, useLite } from "@/lib/lite";
import "@/lib/pointer";
import { CanvasRoot } from "./three/lazy";
import { LiteNotice } from "./LiteNotice";
import { ToastHost } from "./Toast";
import { useShelf } from "@/lib/shelf";

// One fixed, transparent WebGL canvas sits over the page (three/CanvasRoot.tsx).
// Every 3D spot in the DOM is a window into it, so all scenes share one GL
// context. The 3D engine itself downloads only once the page is on screen and
// the browser is idle, so it never delays the first paint. In Lite mode
// (decided before first paint by the boot script) it never loads at all.
export function Providers({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null!);
  const full3D = useFull3D();
  // Smooth wheel scrolling only where it helps: a mouse, the full site, and no
  // request for less motion. Everywhere else (every phone, Lite mode) scrolling
  // stays native and Lenis runs no per-frame loop at all. Decided after mount,
  // so the server and the first client render match.
  const [smooth, setSmooth] = useState(false);

  useEffect(() => {
    useCart.persist.rehydrate();
    useShelf.persist.rehydrate();
    const lite = document.documentElement.classList.contains("lite");
    useLite.setState({ lite });
    setSmooth(!lite && matchMedia("(pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches);
    const start = () => useLite.setState({ ready: true });
    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(start, { timeout: 1200 });
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(start, 300);
    return () => clearTimeout(id);
  }, []);

  return (
    <ReactLenis root options={{ lerp: 0.1, wheelMultiplier: 1, smoothWheel: smooth, autoRaf: smooth }}>
      <MotionConfig reducedMotion="user">
        <div ref={root} className="relative">
          {children}
          <LiteNotice />
          <ToastHost />
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
