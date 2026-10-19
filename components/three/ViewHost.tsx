"use client";

import { Suspense } from "react";
import { View } from "@react-three/drei";

/** A drei <View> with a Suspense boundary inside, so lazily loaded scenes can stream in. */
export default function ViewHost({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <View className={className}>
      <Suspense fallback={null}>{children}</Suspense>
    </View>
  );
}
