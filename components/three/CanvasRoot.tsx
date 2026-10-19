"use client";

import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { FpsGuard, FrameDriver } from "./live";

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
      dpr={[1, 1.75]}
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
