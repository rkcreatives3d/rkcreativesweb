"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { pointer } from "@/lib/pointer";
import { ViewRig } from "./Studio";
import { step, useLive } from "./live";
import { LOGO_CUT_URL, LogoPlaque, useLogoTexture } from "./LogoPlaque";

export const HERO_CAM_Z = 6.2;
export const HERO_FOV = 35;

/** Where the cover's logo image sits: centre (x, y) and size, as fractions of the cover (size of its height). */
export type CoverFrame = { x: number; y: number; size: number };

/**
 * Cover page: the logo, cut out of its black square so it sits on the charcoal
 * page and its amber glow, floating gently over its own soft shadow and turning a little toward
 * the pointer. One calm movement; nothing orbits or sparkles.
 */
export function LogoScene({ url = LOGO_CUT_URL, frame, onShown }: { url?: string; frame: CoverFrame; onShown?: () => void }) {
  const size = useThree((s) => s.size);
  const visH = 2 * HERO_CAM_Z * Math.tan(THREE.MathUtils.degToRad(HERO_FOV / 2));
  const visW = visH * (size.width / size.height);
  // laid exactly over the page's logo image
  const S = frame.size * visH;
  const cx = (frame.x - 0.5) * visW;
  const lift = (0.5 - frame.y) * visH;

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
    r.position.set(cx, lift + scroll * 1.6, 0);
    r.scale.setScalar(1 + scroll * 0.25);
  });

  return (
    <>
      <ViewRig position={[0, 0, HERO_CAM_Z]} fov={HERO_FOV} look="warm" />
      <group ref={rig}>
        <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.25}>
          <Suspense fallback={null}>
            <LogoPlaque size={S} url={url} />
            {onShown && <Shown onShown={onShown} />}
          </Suspense>
        </Float>
      </group>
      <Suspense fallback={null}>
        <LogoShadow url={url} size={S} x={cx} lift={lift} />
      </Suspense>
    </>
  );
}

/** Calls back once the logo has actually been drawn, so the page's plain image can fade out under it. */
function Shown({ onShown }: { onShown: () => void }) {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    requestAnimationFrame(onShown);
  });
  return null;
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
    gl_FragColor = vec4(0.0, 0.0, 0.0, a * opacity);
  }
`;

/** Soft shadow in the logo's shape, cast on the dark backdrop behind it. */
function LogoShadow({ url, size, x, lift }: { url: string; size: number; x: number; lift: number }) {
  const map = useLogoTexture(url);
  const ref = useRef<THREE.Mesh>(null!);
  const uniforms = useMemo(() => ({ map: { value: map }, opacity: { value: 0.5 } }), [map]);
  const y = lift - size * 0.03;
  useFrame(() => {
    const scroll = Math.min(window.scrollY / window.innerHeight, 1.5);
    ref.current.position.y = y + scroll * 1.6;
  });
  return (
    <mesh ref={ref} position={[x + size * 0.012, y, -0.7]} scale={[size * 1.1, size * 1.1, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial vertexShader={shadowVertex} fragmentShader={shadowFragment} uniforms={uniforms} transparent depthWrite={false} />
    </mesh>
  );
}
