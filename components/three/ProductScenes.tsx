"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Float, OrbitControls } from "@react-three/drei";
import type { Shape } from "@/lib/products";
import { theme } from "@/lib/theme";
import { ViewRig } from "./Studio";
import { PrintModel } from "./PrintModel";
import { step, useLive } from "./live";

/**
 * Model inside a product card. Pops in when scrolled into view, then rests at
 * the shared turntable angle; spins only while `active` (hovered, or a short
 * demo turn on touch screens), so an idle grid costs no GPU time.
 */
export function CardScene({
  shape,
  model,
  finish,
  active,
  inView,
}: {
  shape: Shape;
  model?: string;
  finish: string;
  active: boolean;
  inView: boolean;
}) {
  const g = useRef<THREE.Group>(null!);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => invalidate(), [inView, active, invalidate]);
  useFrame((_, raw) => {
    const target = inView ? (active ? 1.1 : 1) : 0.001;
    const cur = g.current.scale.x;
    if (Math.abs(target - cur) < 1e-3) {
      g.current.scale.setScalar(target);
      return;
    }
    g.current.scale.setScalar(cur + (target - cur) * (1 - Math.exp(-step(raw) * (inView ? 5 : 20))));
    invalidate();
  });
  return (
    <>
      <ViewRig position={[0, 0.25, 4.5]} fov={35} />
      <group ref={g} scale={0.001}>
        <PrintModel shape={shape} model={model} finish={finish} spin={active ? 2.4 : 0} />
      </group>
    </>
  );
}

/** Big draggable model on the product page. */
export function ViewerScene({
  shape,
  model,
  finish,
  wireframe,
  autoSpin,
  domElement,
}: {
  shape: Shape;
  model?: string;
  finish: string;
  wireframe: boolean;
  autoSpin: boolean;
  domElement: HTMLElement;
}) {
  const { rings } = theme;
  useLive(autoSpin); // otherwise frames only come while it's dragged or settling
  return (
    <>
      <ViewRig position={[0, 0.5, 5.4]} fov={35} />
      <OrbitControls
        domElement={domElement}
        enableZoom={false}
        enablePan={false}
        enableDamping
        autoRotate={autoSpin}
        autoRotateSpeed={2.2}
        minPolarAngle={0.35}
        maxPolarAngle={Math.PI - 0.6}
      />
      <PrintModel shape={shape} model={model} finish={finish} wireframe={wireframe} spin={0} scale={0.95} />
      <mesh rotation-x={-Math.PI / 2} position-y={-1.55}>
        <ringGeometry args={[1.25, 1.27, 128]} />
        <meshBasicMaterial color={rings[0]} toneMapped={false} transparent opacity={0.8} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={-1.55}>
        <ringGeometry args={[1.55, 1.56, 128]} />
        <meshBasicMaterial color={rings[1]} toneMapped={false} transparent opacity={0.5} />
      </mesh>
    </>
  );
}

/** Wireframe "slicer preview" for the custom-order page. Animates only while on screen. */
export function SlicerScene({ visible }: { visible: boolean }) {
  useLive(visible);
  return (
    <>
      <ViewRig position={[0, 0.3, 4.6]} fov={35} />
      <Float speed={1.2} floatIntensity={0.6}>
        <PrintModel shape="knot" finish="holo" wireframe spin={visible ? 0.5 : 0} />
      </Float>
    </>
  );
}
