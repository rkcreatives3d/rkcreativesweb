"use client";

import { useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { ReactLenis } from "lenis/react";
import { MotionConfig } from "motion/react";
import { useCart } from "@/lib/cart";
import { useFull3D, useLite } from "@/lib/lite";
import "@/lib/pointer";

// One fixed, transparent WebGL canvas sits over the page. Every <View> in the
// DOM is a "window" into it, so any number of 3D scenes share a single GL
// context. The canvas ignores pointer events; DOM underneath stays clickable.
// In Lite mode the canvas is never created.
export function Providers({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null!);
  const full3D = useFull3D();

  useEffect(() => {
    useCart.persist.rehydrate();
    useLite.setState({ ready: true, lite: document.documentElement.classList.contains("lite") });
  }, []);

  return (
    <ReactLenis root options={{ lerp: 0.1, wheelMultiplier: 1 }}>
      <MotionConfig reducedMotion="user">
        <div ref={root} className="relative">
          {children}
          {full3D && (
            <Canvas
              eventSource={root}
              eventPrefix="client"
              dpr={[1, 1.75]}
              gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
              onCreated={({ gl }) => {
                gl.localClippingEnabled = true; // "print" reveal in the Personalise studio
              }}
              style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 10 }}
            >
              <View.Port />
            </Canvas>
          )}
        </div>
      </MotionConfig>
    </ReactLenis>
  );
}
