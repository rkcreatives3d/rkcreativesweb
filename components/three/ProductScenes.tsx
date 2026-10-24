"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Float, OrbitControls } from "@react-three/drei";
import type { Shape } from "@/lib/products";
import { theme } from "@/lib/theme";
import { ViewRig } from "./Studio";
import { PrintModel } from "./PrintModel";
import { step, useLive } from "./live";

/**
 * Model inside a product card. Prints in, layer by layer, when the card
 * scrolls into view. While hovered it lifts off the bed and turns to follow
 * the cursor (`pointer`, -1..1 across the card); it settles back to the shared
 * turntable angle on leave, so an idle grid costs no GPU time.
 */
export function CardScene({
  shape,
  model,
  finish,
  active,
  inView,
  delay = 0,
  pointer,
  standIn = false,
  onShown,
  animateIn = true,
}: {
  shape: Shape;
  model?: string;
  finish: string;
  active: boolean;
  inView: boolean;
  /** print in as it scrolls into view (first row only); false = simply there */
  animateIn?: boolean;
  delay?: number;
  pointer?: { current: { x: number; y: number } };
  /** a studio picture is standing in until this model is ready */
  standIn?: boolean;
  /** the model is on screen: the stand-in can go */
  onShown?: () => void;
}) {
  // the visitor is already looking at the stand-in picture: swap to 3D in place, no print-in
  const [instant] = useState(() => (standIn && inView) || !animateIn);
  const g = useRef<THREE.Group>(null!);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => invalidate(), [active, invalidate]);
  useFrame((_, raw) => {
    const k = 1 - Math.exp(-step(raw) * 6);
    const p = active && pointer ? pointer.current : { x: 0, y: 0 };
    const o = g.current;
    const goal = [p.x * 0.6, p.y * 0.22, active ? 0.14 : 0, active ? 1.06 : 1];
    const now = [o.rotation.y, o.rotation.x, o.position.y, o.scale.x];
    if (now.every((v, i) => Math.abs(v - goal[i]) < 1e-3)) {
      o.rotation.set(goal[1], goal[0], 0);
      o.position.y = goal[2];
      o.scale.setScalar(goal[3]);
      return;
    }
    o.rotation.y += (goal[0] - now[0]) * k;
    o.rotation.x += (goal[1] - now[1]) * k;
    o.position.y += (goal[2] - now[2]) * k;
    o.scale.setScalar(now[3] + (goal[3] - now[3]) * k);
    invalidate();
  });
  return (
    <>
      <ViewRig position={[0, 0.25, 4.5]} fov={35} />
      <group ref={g}>
        <PrintModel
          shape={shape}
          model={model}
          finish={finish}
          spin={0}
          printIn={instant ? undefined : inView}
          delay={delay}
          onReady={onShown}
          loadingIndicator={!standIn}
        />
      </group>
    </>
  );
}

/**
 * The big 360° model on the product page: turns by itself, and drag (or swipe
 * sideways on a phone) to spin it all the way round. Prints in when the page
 * opens, or appears straight away when a studio picture was standing in.
 */
export function ViewerScene({
  shape,
  model,
  finish,
  wireframe,
  autoSpin,
  domElement,
  standIn = false,
  onShown,
}: {
  shape: Shape;
  model?: string;
  finish: string;
  wireframe: boolean;
  autoSpin: boolean;
  domElement: HTMLElement;
  standIn?: boolean;
  onShown?: () => void;
}) {
  const { rings } = theme;
  useLive(autoSpin); // otherwise frames only come while it's dragged or settling
  // phones: a sideways swipe spins the model, an up/down swipe still scrolls the page
  // (OrbitControls blocks all touch scrolling on its element by default)
  useEffect(() => {
    const id = requestAnimationFrame(() => (domElement.style.touchAction = "pan-y"));
    return () => cancelAnimationFrame(id);
  }, [domElement]);
  return (
    <>
      <ViewRig position={[0, 0.5, 5.4]} fov={35} />
      <OrbitControls
        domElement={domElement}
        enableZoom={false}
        enablePan={false}
        enableDamping
        autoRotate={autoSpin}
        autoRotateSpeed={1.6}
        minPolarAngle={0.35}
        maxPolarAngle={Math.PI - 0.6}
      />
      <PrintModel
        shape={shape}
        model={model}
        finish={finish}
        wireframe={wireframe}
        spin={0}
        printIn={standIn ? undefined : true}
        delay={0.2}
        scale={0.95}
        onReady={onShown}
        loadingIndicator={!standIn}
      />
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
        <PrintModel shape="knot" finish="gold" wireframe spin={visible ? 0.5 : 0} />
      </Float>
    </>
  );
}
