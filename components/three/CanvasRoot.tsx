"use client";

import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { FpsGuard, FrameDriver } from "./live";

// Phones draw at up to 1.5× (their screens are 2–3×, but the difference is
// hard to see on a small screen and it's about half the pixels to fill);
// computers with a mouse at up to 1.75×.
const touch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
const DPR: [number, number] = touch ? [1, 1.5] : [1, 1.75];

/**
 * The one fixed, transparent WebGL canvas every <View> draws into. It ignores
 * pointer events (the DOM underneath stays clickable) and renders on demand,
 * only while something on screen moves (see live.ts).
 */
export default function CanvasRoot({ eventSource }: { eventSource: React.RefObject<HTMLDivElement> }) {
  return (
    <Canvas
      eventSource={eventSource}
      eventPrefix="client"
      frameloop="demand"
      dpr={DPR}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true; // "print" reveal in the Personalise studio
        // don't stall the page waiting on each shader's error log; the GPU compiles in the background
        if (process.env.NODE_ENV === "production") gl.debug.checkShaderErrors = false;
      }}
      aria-hidden
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 10 }}
    >
      <View.Port />
      <FrameDriver />
      <FpsGuard />
    </Canvas>
  );
}
