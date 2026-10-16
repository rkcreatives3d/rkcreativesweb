"use client";

import { View } from "@react-three/drei";
import { SlicerScene } from "./three/ProductScenes";
import { useLiteMode } from "@/lib/lite";

export function CustomViewer() {
  if (useLiteMode()) return null;
  return (
    <div className="relative mt-8 aspect-[4/3] overflow-hidden rounded-[28px] border border-accent-2/20 grid-bg-accent">
      <View className="absolute inset-0">
        <SlicerScene />
      </View>
      <span className="absolute bottom-4 left-4 font-mono text-[10px] uppercase tracking-[0.3em] text-accent-2">
        Slicer preview · your idea here
      </span>
    </div>
  );
}
