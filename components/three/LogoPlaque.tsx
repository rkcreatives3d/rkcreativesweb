"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";

export const LOGO_URL = "/brand/logo.jpg";

// Cover framing, shared by the hero and the end of the intro so the hand-off
// between them lines up: the logo fills 70% of the view height (or 86% of the
// width on narrow screens) and sits 4% of the view height above centre.
export const LOGO_FILL_H = 0.7;
export const LOGO_FILL_W = 0.86;
export const LOGO_SHIFT_Y = 0.04;

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D map;
  uniform float reveal;  // 0..1: rows above this haven't been printed yet
  uniform float feather; // 0 = hard edges; > 0 = fade edges into the black page
  uniform float shine;   // position of the diagonal light sweep
  uniform float opacity;
  varying vec2 vUv;

  void main() {
    if (vUv.y > reveal) discard;
    vec4 c = texture2D(map, vUv);

    float a = 1.0;
    if (feather > 0.0) {
      a = smoothstep(0.0, feather, vUv.x) * smoothstep(1.0, 1.0 - feather, vUv.x)
        * smoothstep(0.0, feather, vUv.y) * smoothstep(1.0, 1.0 - feather, vUv.y);
    }

    // the sweep only catches bright (gold / chrome) parts of the logo
    float lum = dot(c.rgb, vec3(0.299, 0.587, 0.114));
    float band = smoothstep(0.1, 0.0, abs(vUv.x + vUv.y * 0.5 - shine));
    vec3 col = c.rgb + band * smoothstep(0.12, 0.5, lum) * vec3(1.0, 0.86, 0.6) * 0.6;

    gl_FragColor = vec4(col, a * opacity);
    #include <colorspace_fragment>
  }
`;

type Props = ThreeElements["mesh"] & {
  size: number;
  feather?: number;
  /** 0..1, read every frame; omit for a fully printed logo */
  reveal?: { current: number };
  shineEvery?: number;
};

/** The brand logo as a flat 3D plaque. */
export function LogoPlaque({ size, feather = 0, reveal, shineEvery = 5, ...mesh }: Props) {
  const texture = useTexture(LOGO_URL);
  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
  }, [texture]);

  const material = useRef<THREE.ShaderMaterial>(null!);
  const uniforms = useMemo(
    () => ({
      map: { value: texture },
      reveal: { value: 1 },
      feather: { value: feather },
      shine: { value: -1 },
      opacity: { value: 1 },
    }),
    [texture, feather],
  );

  useFrame(({ clock }) => {
    const u = material.current.uniforms;
    u.reveal.value = reveal ? reveal.current : 1;
    // sweep from off-left to off-right, then rest until the next pass
    const t = (clock.elapsedTime % shineEvery) / 1.6;
    u.shine.value = -0.3 + t * 2.1;
  });

  return (
    <mesh {...mesh} scale={[size, size, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        toneMapped={false}
      />
    </mesh>
  );
}

// start downloading as soon as this module loads in the browser
if (typeof window !== "undefined") useTexture.preload(LOGO_URL);
