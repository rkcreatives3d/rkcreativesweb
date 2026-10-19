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
    <div ref={ref} className="relative aspect-[4/3] overflow-hidden rounded-[28px] border border-line stage">
      <View className="absolute inset-0">
        <SlicerScene visible={visible} />
      </View>
      <span className="absolute bottom-4 left-4 text-xs text-muted">
        Your idea here
      </span>
    </div>
  );
}
