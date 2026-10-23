"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree, type ThreeElements } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import type { Shape } from "@/lib/products";
import { theme } from "@/lib/theme";
import { getShapeGeometry } from "./shapes";
import { heightRange, setCut, useFinishMaterial } from "./Studio";
import { calm, step } from "./live";

type Props = ThreeElements["group"] & {
  shape: Shape;
  /** real model (GLB) — replaces the procedural `shape` when given */
  model?: string;
  finish: string;
  /** radians per second around Y; 0 = come to rest at the turntable angle */
  spin?: number;
  wireframe?: boolean;
  /**
   * Print the model in, layer by layer from the bed up, while the turntable
   * swings round to rest: it stays hidden while false and prints once true.
   * Leave it out for a model that's simply there.
   */
  printIn?: boolean;
  /** seconds to wait before printing starts (staggers a grid) */
  delay?: number;
};

/** Every model comes to rest at this angle, so a grid of products reads like one turntable. */
export const REST_ANGLE = -0.5;
const TAU = Math.PI * 2;
const PRINT_TIME = 1.5;
const PRINT_SWING = 1.3; // radians the turntable turns while printing
const LED = 6;

export function PrintModel({ shape, model, finish, spin = 0.35, wireframe = false, printIn, delay = 0, ...group }: Props) {
  const root = useRef<THREE.Group>(null!);
  const mat = useFinishMaterial(finish, wireframe, () => heightRange(root.current));
  const inner = useRef<THREE.Mesh>(null!);
  const core = useRef<THREE.Mesh>(null);
  const led = useRef<THREE.PointLight>(null);
  const vel = useRef(spin);
  const target = useRef<number | null>(null);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    target.current = null;
    invalidate();
  }, [spin, invalidate]);

  // print-in progress: -delay..0 waiting, 0..1 printing, 1 = done
  const [ready, setReady] = useState(!model);
  const progress = useRef(printIn === undefined ? 1 : -delay / PRINT_TIME);
  const range = useRef<[number, number] | null>(null);
  useLayoutEffect(() => {
    const fx = mat.userData.fx;
    if (progress.current >= 1) return;
    fx.cut.value = -1e4; // hidden until it prints
    if (printIn && calm()) {
      progress.current = 1;
      fx.cut.value = 1e4;
      if (core.current) core.current.visible = true;
      if (led.current) led.current.intensity = LED;
    }
    invalidate();
  }, [printIn, mat, invalidate]);

  useFrame((_, raw) => {
    const dt = step(raw);
    const r = root.current;
    if (printIn && ready && progress.current < 1) {
      progress.current = Math.min(1, progress.current + dt / PRINT_TIME);
      const t = progress.current;
      if (t > 0) {
        range.current ??= heightRange(r);
        const eased = 1 - Math.pow(1 - t, 1.6);
        if (range.current) setCut(mat.userData.fx, range.current, eased);
        // the lamp's LED switches on once the print has passed it
        // (dimmed, not hidden, so the light count and the compiled shaders never change)
        if (core.current) core.current.visible = eased > 0.5;
        if (led.current) led.current.intensity = eased > 0.5 ? LED : 0;
        if (spin === 0) {
          r.rotation.y = REST_ANGLE - PRINT_SWING * Math.pow(1 - t, 2.4);
          vel.current = 0;
          target.current = REST_ANGLE;
        }
      }
      invalidate();
      if (spin === 0) return;
    }
    if (spin > 0) {
      vel.current += (spin - vel.current) * (1 - Math.exp(-dt * 4));
      r.rotation.y += dt * vel.current;
      if (!model && shape === "gear" && inner.current) inner.current.rotation.z += dt * 1.2;
      invalidate();
      return;
    }
    // stopping: coast forward onto the next rest angle with a critically damped spring
    target.current ??= REST_ANGLE + Math.ceil((r.rotation.y + vel.current * 0.5 - REST_ANGLE) / TAU - 1e-6) * TAU;
    const d = target.current - r.rotation.y;
    if (Math.abs(d) < 1e-4 && Math.abs(vel.current) < 1e-3) {
      r.rotation.y = target.current;
      vel.current = 0;
      return;
    }
    vel.current += (40 * d - 2 * Math.sqrt(40) * vel.current) * dt;
    r.rotation.y += vel.current * dt;
    invalidate();
  });

  return (
    <group {...group}>
      <group ref={root} rotation-y={REST_ANGLE}>
        {model ? (
          <Suspense fallback={<Loading />}>
            <RealModel url={model} material={mat} onReady={() => setReady(true)} />
          </Suspense>
        ) : shape === "serpent" ? (
          <Serpent material={mat} live={spin > 0} />
        ) : (
          <mesh ref={inner} geometry={getShapeGeometry(shape)} material={mat} dispose={null} />
        )}
        {!model && shape === "lattice" && (
          // LED core of the orb lamp
          <>
            <mesh ref={core} scale={0.45} visible={printIn === undefined}>
              <icosahedronGeometry args={[1, 4]} />
              <meshBasicMaterial color="#ffc27a" toneMapped={false} />
            </mesh>
            <pointLight ref={led} color="#ffb35c" intensity={printIn === undefined ? LED : 0} distance={4} />
          </>
        )}
      </group>
    </group>
  );
}

/**
 * A real product model (GLB from scripts/prepare-models.mjs), painted in the
 * chosen finish and scaled to the same ~1.1 radius as the procedural shapes,
 * so it frames identically in every view.
 */
function RealModel({ url, material, onReady }: { url: string; material: THREE.Material; onReady: () => void }) {
  const { scene } = useGLTF(url, false, true);
  const { object, scale, offset } = useMemo(() => {
    const object = scene.clone(true);
    object.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).material = material;
    });
    const sphere = new THREE.Box3().setFromObject(object).getBoundingSphere(new THREE.Sphere());
    return { object, scale: 1.1 / sphere.radius, offset: sphere.center.multiplyScalar(-1) };
  }, [scene, material]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(onReady, []);
  return (
    <group scale={scale}>
      <primitive object={object} position={offset} />
    </group>
  );
}

/** Shown while a model downloads: a slowly turning wireframe sphere. */
function Loading() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ invalidate }, dt) => {
    ref.current.rotation.y += step(dt) * 1.5;
    invalidate();
  });
  return (
    <mesh ref={ref} scale={0.7}>
      <icosahedronGeometry args={[1, 2]} />
      <meshBasicMaterial color={theme.wire} wireframe transparent opacity={0.5} toneMapped={false} />
    </mesh>
  );
}

const SEGMENTS = 18;
const up = new THREE.Vector3(1, 0, 0);

function Serpent({ material, live }: { material: THREE.Material; live: boolean }) {
  const time = useRef(0);
  const segGeo = useMemo(() => new THREE.OctahedronGeometry(1, 0), []);
  const eyeGeo = useMemo(() => new THREE.SphereGeometry(1, 12, 8), []);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const points = useMemo(() => Array.from({ length: SEGMENTS + 1 }, () => new THREE.Vector3()), []);
  const dir = useMemo(() => new THREE.Vector3(), []);

  useEffect(
    () => () => {
      segGeo.dispose();
      eyeGeo.dispose();
    },
    [segGeo, eyeGeo],
  );

  // slithers only while live (the model spins itself and keeps frames coming then)
  useFrame((_, dt) => {
    if (live) time.current += step(dt);
    const t = time.current;
    for (let i = 0; i <= SEGMENTS; i++) {
      const u = i / SEGMENTS;
      points[i].set(
        (u - 0.5) * 2.5,
        Math.sin(t * 2.2 - i * 0.55) * 0.22,
        Math.cos(t * 1.4 - i * 0.45) * 0.2,
      );
    }
    for (let i = 0; i < SEGMENTS; i++) {
      const m = refs.current[i];
      if (!m) continue;
      const u = i / (SEGMENTS - 1);
      const thick = i === SEGMENTS - 1 ? 0.22 : 0.08 + 0.1 * Math.sin(u * Math.PI * 0.9 + 0.15);
      m.position.copy(points[i]).lerp(points[i + 1], 0.5);
      dir.subVectors(points[i + 1], points[i]).normalize();
      m.quaternion.setFromUnitVectors(up, dir);
      m.scale.set(i === SEGMENTS - 1 ? 0.24 : 0.11, thick, thick);
    }
  });

  return (
    <group rotation={[0.2, 0, 0.15]}>
      {Array.from({ length: SEGMENTS }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            refs.current[i] = m;
          }}
          geometry={segGeo}
          material={material}
        />
      ))}
      <SerpentEyes refs={refs} geometry={eyeGeo} />
    </group>
  );
}

function SerpentEyes({
  refs,
  geometry,
}: {
  refs: React.RefObject<(THREE.Mesh | null)[]>;
  geometry: THREE.BufferGeometry;
}) {
  const eyes = useRef<THREE.Group>(null!);
  useFrame(() => {
    const head = refs.current[SEGMENTS - 1];
    if (!head) return;
    eyes.current.position.copy(head.position);
    eyes.current.quaternion.copy(head.quaternion);
  });
  return (
    <group ref={eyes}>
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={geometry} position={[0.12, 0.1, s * 0.11]} scale={0.045}>
          <meshBasicMaterial color="#fff1c7" toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}
