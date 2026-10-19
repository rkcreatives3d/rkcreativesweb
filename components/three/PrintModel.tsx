"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree, type ThreeElements } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import type { Shape } from "@/lib/products";
import { getShapeGeometry } from "./shapes";
import { useFinishMaterial } from "./Studio";
import { step } from "./live";

type Props = ThreeElements["group"] & {
  shape: Shape;
  /** real model (GLB) — replaces the procedural `shape` when given */
  model?: string;
  finish: string;
  /** radians per second around Y; 0 = come to rest at the turntable angle */
  spin?: number;
  wireframe?: boolean;
};

/** Every model comes to rest at this angle, so a grid of products reads like one turntable. */
export const REST_ANGLE = -0.5;
const TAU = Math.PI * 2;

export function PrintModel({ shape, model, finish, spin = 0.35, wireframe = false, ...group }: Props) {
  const mat = useFinishMaterial(finish, wireframe);
  const root = useRef<THREE.Group>(null!);
  const inner = useRef<THREE.Mesh>(null!);
  const vel = useRef(spin);
  const target = useRef<number | null>(null);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    target.current = null;
    invalidate();
  }, [spin, invalidate]);

  useFrame((_, raw) => {
    const dt = step(raw);
    const r = root.current;
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
            <RealModel url={model} material={mat} />
          </Suspense>
        ) : shape === "serpent" ? (
          <Serpent material={mat} live={spin > 0} />
        ) : (
          <mesh ref={inner} geometry={getShapeGeometry(shape)} material={mat} dispose={null} />
        )}
        {!model && shape === "lattice" && (
          <>
            {/* LED core of the orb lamp */}
            <mesh scale={0.45}>
              <icosahedronGeometry args={[1, 4]} />
              <meshBasicMaterial color="#ffc27a" toneMapped={false} />
            </mesh>
            <pointLight color="#ffb35c" intensity={6} distance={4} />
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
function RealModel({ url, material }: { url: string; material: THREE.Material }) {
  const { scene } = useGLTF(url, false, true);
  const { object, scale, offset } = useMemo(() => {
    const object = scene.clone(true);
    object.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).material = material;
    });
    const sphere = new THREE.Box3().setFromObject(object).getBoundingSphere(new THREE.Sphere());
    return { object, scale: 1.1 / sphere.radius, offset: sphere.center.multiplyScalar(-1) };
  }, [scene, material]);
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
      <meshBasicMaterial color="#d4973f" wireframe transparent opacity={0.35} toneMapped={false} />
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
