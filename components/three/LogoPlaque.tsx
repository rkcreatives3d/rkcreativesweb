"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";

/** The logo cut out of its square, for the beige cover (made by scripts/cutout-logo.py). */
export const LOGO_CUT_URL = "/brand/logo-cut-1080.webp";

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
  uniform float feather; // 0 = hard edges; > 0 = fade the square's edges out
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
    // (colours are premultiplied by alpha, so the cut-out edges filter cleanly)
    vec3 straight = c.a > 0.0 ? c.rgb / c.a : vec3(0.0);
    float lum = dot(straight, vec3(0.299, 0.587, 0.114));
    float band = smoothstep(0.1, 0.0, abs(vUv.x + vUv.y * 0.5 - shine));
    vec3 col = c.rgb + c.a * band * smoothstep(0.12, 0.5, lum) * vec3(1.0, 0.86, 0.6) * 0.6;

    gl_FragColor = vec4(col, c.a) * a * opacity;
    #include <colorspace_fragment>
  }
`;

type Props = ThreeElements["mesh"] & {
  size: number;
  url?: string;
  feather?: number;
  /** 0..1, read every frame; omit for a fully printed logo */
  reveal?: { current: number };
  shineEvery?: number;
};

/** The brand logo as a flat 3D plaque. */
export function LogoPlaque({ size, url = LOGO_CUT_URL, feather = 0, reveal, shineEvery = 5, ...mesh }: Props) {
  const texture = useLogoTexture(url);

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
        premultipliedAlpha
        toneMapped={false}
      />
    </mesh>
  );
}

/** The logo texture, set up for the plaque: sRGB, sharp at an angle, premultiplied for clean cut-out edges. */
export function useLogoTexture(url: string) {
  const texture = useTexture(url);
  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.premultiplyAlpha = true;
    texture.needsUpdate = true;
  }, [texture]);
  return texture;
}
