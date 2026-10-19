"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Float, OrbitControls, Sparkles } from "@react-three/drei";
import type { Shape } from "@/lib/products";
import { theme } from "@/lib/theme";
import { ViewRig } from "./Studio";
import { PrintModel } from "./PrintModel";

/** Small spinning model inside a product card. Pops in when scrolled into view. */
export function CardScene({
  shape,
  model,
  finish,
  hovered,
  inView,
}: {
  shape: Shape;
  model?: string;
  finish: string;
  hovered: boolean;
  inView: boolean;
}) {
  const g = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    const target = inView ? (hovered ? 1.12 : 1) : 0.001;
    const s = g.current.scale.x + (target - g.current.scale.x) * (1 - Math.exp(-dt * (inView ? 5 : 20)));
    g.current.scale.setScalar(s);
  });
  return (
    <>
      <ViewRig position={[0, 0.25, 4.5]} fov={35} />
      <group ref={g} scale={0.001}>
        <Float speed={2} floatIntensity={0.5} rotationIntensity={0.3}>
          <PrintModel shape={shape} model={model} finish={finish} spin={hovered ? 2.4 : 0.45} />
        </Float>
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
  const { sparkles, rings, wire } = theme;
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
      <Float speed={1.4} floatIntensity={0.5} rotationIntensity={0.25}>
        <PrintModel shape={shape} model={model} finish={finish} wireframe={wireframe} spin={0} scale={0.95} />
      </Float>
      <Sparkles count={40} scale={[5, 4, 4]} size={2.5} speed={0.3} color={wireframe ? wire : sparkles[0]} />
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

/** Wireframe "slicer preview" for the custom-order page. */
export function SlicerScene() {
  const { wire } = theme;
  return (
    <>
      <ViewRig position={[0, 0.3, 4.6]} fov={35} />
      <Float speed={1.2} floatIntensity={0.6}>
        <PrintModel shape="knot" finish="holo" wireframe spin={0.5} />
      </Float>
      <Sparkles count={50} scale={[5, 4, 4]} size={2} speed={0.3} color={wire} />
    </>
  );
}
