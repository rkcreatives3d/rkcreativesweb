"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import type { Product } from "@/lib/products";
import { theme } from "@/lib/theme";
import { ViewRig } from "./Studio";
import { PrintModel } from "./PrintModel";

export type CarouselState = { target: number; current: number };

export function CarouselScene({
  items,
  state,
  onActive,
}: {
  items: Product[];
  state: React.RefObject<CarouselState>;
  onActive: (index: number) => void;
}) {
  const ring = useRef<THREE.Group>(null!);
  const { rings } = theme;
  const slots = useRef<(THREE.Group | null)[]>([]);
  const lastActive = useRef(-1);
  const n = items.length;
  const step = (Math.PI * 2) / n;
  const R = 3.2;

  useFrame((_, dt) => {
    const s = state.current;
    s.current += (s.target - s.current) * (1 - Math.exp(-dt * 5));
    ring.current.rotation.y = s.current;

    const active = (((Math.round(-s.current / step) % n) + n) % n) | 0;
    if (active !== lastActive.current) {
      lastActive.current = active;
      onActive(active);
    }

    const k = 1 - Math.exp(-dt * 6);
    slots.current.forEach((slot, i) => {
      if (!slot) return;
      const front = (Math.cos(i * step + s.current) + 1) / 2;
      const target = 0.5 + 0.5 * front ** 4;
      slot.scale.setScalar(slot.scale.x + (target - slot.scale.x) * k);
    });
  });

  return (
    <>
      <ViewRig position={[0, 1.2, 9.6]} fov={32} target={[0, -0.35, 0]} />
      <group ref={ring}>
        {items.map((p, i) => (
          <group
            key={p.slug}
            ref={(g) => {
              slots.current[i] = g;
            }}
            position={[Math.sin(i * step) * R, 0, Math.cos(i * step) * R]}
          >
            <Float speed={2} floatIntensity={0.6} rotationIntensity={0.4}>
              <PrintModel shape={p.shape} finish={p.finishes[0]} spin={0.6} />
            </Float>
          </group>
        ))}
      </group>
      {/* neon orbit rings on the floor */}
      <mesh rotation-x={-Math.PI / 2} position-y={-1.45}>
        <ringGeometry args={[R - 0.015, R + 0.015, 160]} />
        <meshBasicMaterial color={rings[0]} toneMapped={false} transparent opacity={0.7} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={-1.45}>
        <ringGeometry args={[R + 0.5, R + 0.51, 160]} />
        <meshBasicMaterial color={rings[1]} toneMapped={false} transparent opacity={0.35} />
      </mesh>
    </>
  );
}
