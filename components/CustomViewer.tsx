"use client";

import { useRef } from "react";
import { useInView } from "motion/react";
import { View } from "@react-three/drei";
import { SlicerScene } from "./three/ProductScenes";
import { useLiteMode } from "@/lib/lite";

export function CustomViewer() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref);
  if (useLiteMode()) return null;
  return (
    <div ref={ref} className="relative aspect-[4/3] overflow-hidden rounded-[28px] border border-accent-2/20 grid-bg-accent">
      <View className="absolute inset-0">
        <SlicerScene visible={visible} />
      </View>
      <span className="absolute bottom-4 left-4 tabular-nums text-xs uppercase tracking-[0.12em] text-accent-2">
        Slicer preview · your idea here
      </span>
    </div>
  );
}
