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
import { LOGO_CUT_URL, LOGO_FILL_H, LOGO_FILL_W, LOGO_SHIFT_Y, LogoPlaque, useLogoTexture } from "./LogoPlaque";

export const HERO_CAM_Z = 6.2;
export const HERO_FOV = 35;

/**
 * Cover page: the logo, cut out of its black square so it sits on the beige
 * page, floating over its own soft shadow with printed objects orbiting it.
 */
export function LogoScene({ url = LOGO_CUT_URL }: { url?: string }) {
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
      <ViewRig position={[0, 0, HERO_CAM_Z]} fov={HERO_FOV} look="warm" />
      <group ref={rig}>
        <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.25}>
          <Suspense fallback={null}>
            <LogoPlaque size={S} url={url} />
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
      <Suspense fallback={null}>
        <LogoShadow url={url} size={S} lift={lift} />
      </Suspense>
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

const shadowVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const shadowFragment = /* glsl */ `
  uniform sampler2D map;
  uniform float opacity;
  varying vec2 vUv;
  void main() {
    // the logo's own outline, read from a small mip level: a soft blur for free
    float a = texture2D(map, vUv, 4.5).a;
    a = smoothstep(0.15, 0.9, a); // thin strokes (the script) cast next to nothing
    gl_FragColor = vec4(0.165, 0.13, 0.098, a * opacity);
  }
`;

/** Soft shadow in the logo's shape, cast on the beige backdrop behind it. */
function LogoShadow({ url, size, lift }: { url: string; size: number; lift: number }) {
  const map = useLogoTexture(url);
  const ref = useRef<THREE.Mesh>(null!);
  const uniforms = useMemo(() => ({ map: { value: map }, opacity: { value: 0.22 } }), [map]);
  const y = lift - size * 0.03;
  useFrame(() => {
    const scroll = Math.min(window.scrollY / window.innerHeight, 1.5);
    ref.current.position.y = y + scroll * 1.6;
  });
  return (
    <mesh ref={ref} position={[size * 0.012, y, -0.7]} scale={[size * 1.1, size * 1.1, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial vertexShader={shadowVertex} fragmentShader={shadowFragment} uniforms={uniforms} transparent depthWrite={false} />
    </mesh>
  );
}
