"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import type { Shape } from "@/lib/products";
import { pointer } from "@/lib/pointer";
import { theme } from "@/lib/theme";
import { ViewRig } from "./Studio";
import { PrintModel } from "./PrintModel";
import { step, useLive } from "./live";
import { LOGO_FILL_H, LOGO_FILL_W, LOGO_SHIFT_Y, LogoPlaque } from "./LogoPlaque";

export const HERO_CAM_Z = 6.2;
export const HERO_FOV = 35;

/** Cover page: the logo as a floating plaque with printed objects orbiting it. */
export function LogoScene() {
  const size = useThree((s) => s.size);
  const visH = 2 * HERO_CAM_Z * Math.tan(THREE.MathUtils.degToRad(HERO_FOV / 2));
  const visW = visH * (size.width / size.height);
  const S = Math.min(visH * LOGO_FILL_H, visW * LOGO_FILL_W);
  const lift = visH * LOGO_SHIFT_Y;

  // animate only while the cover is on screen; the canvas idles once it's scrolled away
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const check = () => setVisible(window.scrollY < window.innerHeight * 1.05);
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);
  useLive(visible);

  const rig = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    const k = 1 - Math.exp(-step(dt) * 3);
    const scroll = Math.min(window.scrollY / window.innerHeight, 1.5);
    const r = rig.current;
    r.rotation.y += (pointer.x * 0.22 - r.rotation.y) * k;
    r.rotation.x += (-pointer.y * 0.14 - r.rotation.x) * k;
    r.position.y = lift + scroll * 1.6;
    r.scale.setScalar(1 + scroll * 0.25);
  });

  return (
    <>
      <ViewRig position={[0, 0, HERO_CAM_Z]} fov={HERO_FOV} />
      <group ref={rig}>
        <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.25}>
          <Suspense fallback={null}>
            <LogoPlaque size={S} feather={0.045} />
          </Suspense>
        </Float>
        {/* glowing filament orbit, partly hidden behind the logo */}
        <mesh rotation={[1.25, 0.15, 0]} scale={[S * 0.66, S * 0.66, S * 0.66]}>
          <torusGeometry args={[1, 0.004, 8, 200]} />
          <meshBasicMaterial color={theme.amber} toneMapped={false} transparent opacity={0.55} />
        </mesh>
        <Orbiter shape="vase" finish="amber" radius={S * 0.66} speed={0.32} phase={0} size={S * 0.075} live={visible} />
        <Orbiter shape="knot" finish="gold" radius={S * 0.66} speed={0.32} phase={2.1} size={S * 0.06} live={visible} />
        <Orbiter shape="gear" finish="onyx" radius={S * 0.66} speed={0.32} phase={4.2} size={S * 0.065} live={visible} />
      </group>
      <Sparkles count={60} scale={[S * 2.2, S * 1.4, 3]} size={2.6} speed={0.3} color={theme.sparkles[0]} />
      <Sparkles count={35} scale={[S * 2.2, S * 1.4, 3]} size={1.8} speed={0.2} color={theme.sparkles[1]} />
    </>
  );
}

/** A printed object travelling the same tilted ellipse as the filament ring. */
function Orbiter({
  shape,
  finish,
  radius,
  speed,
  phase,
  size,
  live,
}: {
  shape: Shape;
  finish: string;
  radius: number;
  speed: number;
  phase: number;
  size: number;
  live: boolean;
}) {
  const ref = useRef<THREE.Group>(null!);
  const ring = useMemo(() => new THREE.Euler(1.25, 0.15, 0), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock }) => {
    const a = clock.elapsedTime * speed + phase;
    v.set(Math.cos(a) * radius, Math.sin(a) * radius, 0).applyEuler(ring);
    ref.current.position.copy(v);
  });
  return (
    <group ref={ref}>
      <PrintModel shape={shape} finish={finish} spin={live ? 0.8 : 0} scale={size} />
    </group>
  );
}
