"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { ReactLenis } from "lenis/react";
import { MotionConfig } from "motion/react";
import { useCart } from "@/lib/cart";
import { choseFull3D, useFull3D, useLite, weakGpu } from "@/lib/lite";
import "@/lib/pointer";
import { FpsGuard, FrameDriver } from "./three/live";
import { LiteNotice } from "./LiteNotice";

// One fixed, transparent WebGL canvas sits over the page. Every <View> in the
// DOM is a "window" into it, so any number of 3D scenes share a single GL
// context. The canvas ignores pointer events; DOM underneath stays clickable.
// It renders on demand, only while something on screen moves (see three/live.ts).
// In Lite mode the canvas is never created.
export function Providers({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null!);
  const full3D = useFull3D();
  // no smooth-scroll easing for people who've asked for less motion
  const [calm] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    useCart.persist.rehydrate();
    let lite = document.documentElement.classList.contains("lite");
    if (!lite && !choseFull3D() && weakGpu()) {
      lite = true; // not remembered: a GPU check is cheap to repeat
      document.documentElement.classList.add("lite");
    }
    useLite.setState({ ready: true, lite });
  }, []);

  return (
    <ReactLenis root options={{ lerp: 0.1, wheelMultiplier: 1, smoothWheel: !calm }}>
      <MotionConfig reducedMotion="user">
        <div ref={root} className="relative">
          {children}
          <LiteNotice />
          {full3D && (
            <Canvas
              eventSource={root}
              eventPrefix="client"
              frameloop="demand"
              dpr={[1, 1.75]}
              gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
              onCreated={({ gl }) => {
                gl.localClippingEnabled = true; // "print" reveal in the Personalise studio
              }}
              aria-hidden
              style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 10 }}
            >
              <View.Port />
              <FrameDriver />
              <FpsGuard />
            </Canvas>
          )}
        </div>
      </MotionConfig>
    </ReactLenis>
  );
}
