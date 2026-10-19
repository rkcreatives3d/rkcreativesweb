"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, PerspectiveCamera } from "@react-three/drei";
import { getFinish } from "@/lib/products";
import { theme } from "@/lib/theme";

// ── Studio environment ───────────────────────────────────────
// A "light box" of coloured panels baked into a PMREM env map and shared by
// every view. Chrome and gold materials get their look from reflecting it, and
// nothing has to be downloaded from an HDRI CDN. Baked once per WebGL renderer:
// a render-target texture can't be shared between canvases.

const envTextures = new WeakMap<THREE.WebGLRenderer, THREE.Texture>();

// panel placement; colours + intensities come from the brand theme
const layout: [[number, number, number], [number, number]][] = [
  [[0, 7, 0], [12, 12]], // key softbox overhead
  [[-7, 1, 2], [3, 10]], // strip left
  [[7, 0.5, 1], [3, 10]], // strip right
  [[0, -1, -8], [16, 5]], // back wall
  [[0, 1.5, 8], [7, 1.2]], // front rim strip
  [[4, -6, 3], [5, 5]], // floor bounce
  [[-4, -5, -3], [4, 4]], // kicker
];

function bakeStudio(gl: THREE.WebGLRenderer) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(theme.env.bg);
  const plane = new THREE.PlaneGeometry(1, 1);
  for (let i = 0; i < layout.length; i++) {
    const [color, intensity] = theme.env.panels[i];
    const [position, [w, h]] = layout[i];
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(intensity),
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(plane, mat);
    mesh.position.set(...position);
    mesh.scale.set(w, h, 1);
    mesh.lookAt(0, 0, 0);
    scene.add(mesh);
  }
  const pmrem = new THREE.PMREMGenerator(gl);
  const texture = pmrem.fromScene(scene, 0.03).texture;
  pmrem.dispose();
  scene.traverse((o) => {
    if (o instanceof THREE.Mesh) (o.material as THREE.Material).dispose();
  });
  plane.dispose();
  return texture;
}

export function useStudioEnv() {
  const gl = useThree((s) => s.gl);
  return useMemo(() => {
    let tex = envTextures.get(gl);
    if (!tex) envTextures.set(gl, (tex = bakeStudio(gl)));
    return tex;
  }, [gl]);
}

/** Camera + lighting for one <View>. Every view needs its own camera. */
export function ViewRig({
  position = [0, 0, 4.4],
  fov = 35,
  target = [0, 0, 0],
}: {
  position?: [number, number, number];
  fov?: number;
  target?: [number, number, number];
}) {
  const env = useStudioEnv();
  const { light } = theme;
  const cam = useRef<THREE.PerspectiveCamera>(null!);
  useLayoutEffect(() => {
    cam.current.lookAt(...target);
  }, [target]);
  return (
    <>
      <PerspectiveCamera ref={cam} makeDefault position={position} fov={fov} near={0.1} far={100} />
      <Environment map={env} />
      <ambientLight intensity={light.ambient} />
      <directionalLight position={[3, 5, 4]} intensity={light.key} />
    </>
  );
}

// ── Finish material ──────────────────────────────────────────
// One MeshPhysicalMaterial per model that eases toward the selected finish,
// so switching colour swatches morphs instead of snapping.

const tmpColor = new THREE.Color();

export function useFinishMaterial(finishId: string, wireframe = false) {
  const { wire } = theme;
  const mat = useMemo(() => {
    const f = getFinish(finishId);
    return new THREE.MeshPhysicalMaterial({
      side: THREE.DoubleSide,
      color: f.color,
      metalness: f.metalness,
      roughness: f.roughness,
      iridescence: f.iridescence,
      iridescenceIOR: 1.65,
      iridescenceThicknessRange: [120, 900],
      clearcoat: f.clearcoat,
      clearcoatRoughness: 0.12,
      emissive: f.emissive,
      emissiveIntensity: f.emissiveIntensity,
      envMapIntensity: 1.25,
    });
    // initial finish only; later changes animate in useFrame
  }, []);

  useEffect(() => () => mat.dispose(), [mat]);

  useFrame((_, dt) => {
    const f = getFinish(finishId);
    const k = 1 - Math.exp(-dt * 7);
    if (wireframe) {
      mat.color.lerp(tmpColor.set(wire), k);
      mat.emissive.lerp(tmpColor.set(wire), k);
      mat.emissiveIntensity += (1.1 - mat.emissiveIntensity) * k;
    } else {
      mat.color.lerp(tmpColor.set(f.color), k);
      mat.emissive.lerp(tmpColor.set(f.emissive), k);
      mat.emissiveIntensity += (f.emissiveIntensity - mat.emissiveIntensity) * k;
    }
    mat.metalness += (f.metalness - mat.metalness) * k;
    mat.roughness += (f.roughness - mat.roughness) * k;
    mat.iridescence += (f.iridescence - mat.iridescence) * k;
    mat.clearcoat += (f.clearcoat - mat.clearcoat) * k;
    mat.wireframe = wireframe;
  });

  return mat;
}
