"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, PerspectiveCamera } from "@react-three/drei";
import { getFinish } from "@/lib/products";
import { theme } from "@/lib/theme";
import { calm, easeInOut, step } from "./live";

// ── Studio environment ───────────────────────────────────────
// A "light box" of coloured panels baked into a PMREM env map and shared by
// every view. Chrome and gold materials get their look from reflecting it, and
// nothing has to be downloaded from an HDRI CDN. Baked once per WebGL renderer:
// a render-target texture can't be shared between canvases.

export type StudioLook = "neutral" | "warm";
const envTextures = new WeakMap<THREE.WebGLRenderer, Partial<Record<StudioLook, THREE.Texture>>>();

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

function bakeStudio(gl: THREE.WebGLRenderer, look: StudioLook) {
  const env = look === "warm" ? theme.env : theme.neutralEnv;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(env.bg);
  const plane = new THREE.PlaneGeometry(1, 1);
  for (let i = 0; i < layout.length; i++) {
    const [color, intensity] = env.panels[i];
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

export function useStudioEnv(look: StudioLook = "neutral") {
  const gl = useThree((s) => s.gl);
  return useMemo(() => {
    let set = envTextures.get(gl);
    if (!set) envTextures.set(gl, (set = {}));
    return (set[look] ??= bakeStudio(gl, look));
  }, [gl, look]);
}

/**
 * Camera + lighting for one <View>. Every view needs its own camera.
 * `look`: "neutral" (default) for products, so colours show true;
 * "warm" for the cover and the intro.
 */
export function ViewRig({
  position = [0, 0, 4.4],
  fov = 35,
  target = [0, 0, 0],
  look = "neutral",
}: {
  position?: [number, number, number];
  fov?: number;
  target?: [number, number, number];
  look?: StudioLook;
}) {
  const env = useStudioEnv(look);
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
      {/* soft rim lights from behind, warm on one side and white on the other: every print
          gets a clean outline against the stage (the warm one is the logo's amber) */}
      {look === "neutral" && (
        <>
          <directionalLight position={[-4, 3, -6]} intensity={0.9} color={theme.rim.warm} />
          <directionalLight position={[5, 2, -5]} intensity={0.7} color={theme.rim.cool} />
        </>
      )}
    </>
  );
}

// ── Print effects ────────────────────────────────────────────
// Two shader hooks on every finish material, both heights in world space:
//   cut   nothing above it is drawn yet, so the model prints in from the bottom
//   swap  above it the previous colour still shows: a new filament colour rising up
// A hot amber line marks either edge, like the layer under the nozzle.

const OFF = 1e4;
export type PrintFx = {
  cut: { value: number };
  swap: { value: number };
  old: { value: THREE.Color };
  hot: { value: THREE.Color };
  glow: { value: number };
};

function addPrintFx(mat: THREE.MeshPhysicalMaterial): PrintFx {
  const fx: PrintFx = {
    cut: { value: OFF },
    swap: { value: OFF },
    old: { value: new THREE.Color() },
    hot: { value: new THREE.Color(theme.hot) },
    glow: { value: 0 },
  };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, { uCut: fx.cut, uSwap: fx.swap, uOld: fx.old, uHot: fx.hot, uGlow: fx.glow });
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying float vPrintY;")
      .replace("#include <project_vertex>", "#include <project_vertex>\nvPrintY = (modelMatrix * vec4(transformed, 1.0)).y;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying float vPrintY;\nuniform float uCut;\nuniform float uSwap;\nuniform vec3 uOld;\nuniform vec3 uHot;\nuniform float uGlow;",
      )
      .replace("#include <clipping_planes_fragment>", "#include <clipping_planes_fragment>\nif (vPrintY > uCut) discard;")
      .replace("#include <color_fragment>", "#include <color_fragment>\nif (vPrintY > uSwap) diffuseColor.rgb = uOld;")
      .replace(
        "#include <opaque_fragment>",
        `#include <opaque_fragment>
        // while printing, the open top reads as a solid layer, not a hollow shell
        if (!gl_FrontFacing && uCut < 9999.0) gl_FragColor.rgb = diffuseColor.rgb * 0.45;
        float hotLine = max(1.0 - smoothstep(0.0, 0.06, uCut - vPrintY), 1.0 - smoothstep(0.0, 0.035, abs(vPrintY - uSwap)));
        gl_FragColor.rgb = mix(gl_FragColor.rgb, uHot * 2.2, hotLine * uGlow);`,
      );
  };
  return fx;
}

/** World-space height range of an object, for the print effects. */
export function heightRange(o: THREE.Object3D): [number, number] | null {
  const box = new THREE.Box3().setFromObject(o);
  return box.isEmpty() ? null : [box.min.y - 0.02, box.max.y + 0.02];
}

/** Drives `fx.cut`: 0 = nothing printed, 1 = done. */
export function setCut(fx: PrintFx, range: [number, number], t: number) {
  fx.cut.value = t >= 1 ? OFF : THREE.MathUtils.lerp(range[0], range[1], t);
  fx.glow.value = t >= 1 ? (fx.swap.value < OFF ? 1 : 0) : 1;
}

// ── Finish material ──────────────────────────────────────────
// One MeshPhysicalMaterial per model. Changing the finish runs the new
// colour up the model (when `range` says where the model is) or eases
// into it otherwise; shine and roughness always ease.

const tmpColor = new THREE.Color();
const SWAP_TIME = 0.7;
export type FinishMaterial = THREE.MeshPhysicalMaterial & { userData: { fx: PrintFx } };

export function useFinishMaterial(finishId: string, wireframe = false, range?: () => [number, number] | null) {
  const { wire } = theme;
  const [mat, fx] = useMemo(() => {
    const f = getFinish(finishId);
    const mat = new THREE.MeshPhysicalMaterial({
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
    const fx = addPrintFx(mat);
    mat.userData.fx = fx;
    return [mat as FinishMaterial, fx] as const;
    // initial finish only; later changes animate in useFrame
  }, []);

  useEffect(() => () => mat.dispose(), [mat]);

  // keep drawing until the colour change has finished easing in
  const invalidate = useThree((s) => s.invalidate);
  const settle = useRef(0);
  const settled = useRef(false);
  const shown = useRef(finishId);
  const swap = useRef<{ range: [number, number]; start: number } | null>(null);
  const rangeRef = useRef(range);
  rangeRef.current = range;
  useEffect(() => {
    settle.current = performance.now() + 900;
    settled.current = false;
    // new filament colour: snap the colour below the line, keep the old one above it
    const r = shown.current !== finishId && !wireframe && !calm() ? rangeRef.current?.() : null;
    if (r) {
      fx.old.value.copy(mat.color);
      mat.color.set(getFinish(finishId).color);
      swap.current = { range: r, start: performance.now() };
    }
    shown.current = finishId;
    invalidate();
  }, [finishId, wireframe, invalidate, mat, fx]);

  useFrame((_, dt) => {
    const s = swap.current;
    if (s) {
      // timed by the clock, so it finishes on time even at a low frame rate
      const t = (performance.now() - s.start) / 1000 / SWAP_TIME;
      if (t >= 1) {
        swap.current = null;
        fx.swap.value = OFF;
        if (fx.cut.value >= OFF) fx.glow.value = 0;
      } else {
        fx.swap.value = THREE.MathUtils.lerp(s.range[0], s.range[1], easeInOut(t));
        fx.glow.value = 1;
      }
      invalidate();
    }
    if (settled.current) return;
    const done = performance.now() > settle.current;
    if (done) settled.current = true; // land exactly on the target
    else invalidate();
    const f = getFinish(finishId);
    const k = done ? 1 : 1 - Math.exp(-step(dt) * 7);
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
