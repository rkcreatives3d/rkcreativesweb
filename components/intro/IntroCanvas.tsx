"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { PrinterScene } from "./PrinterScene";

/** The opening animation's own canvas. Loaded on demand, so the 3D engine never blocks the first paint. */
export default function IntroCanvas({ onProgress, onDone }: { onProgress: (p: number, layer: number) => void; onDone: () => void }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
        if (process.env.NODE_ENV === "production") gl.debug.checkShaderErrors = false;
      }}
    >
      <Suspense fallback={null}>
        <PrinterScene onProgress={onProgress} onDone={onDone} />
      </Suspense>
    </Canvas>
  );
}
