"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import type { Shape } from "@/lib/products";
import { getShapeGeometry } from "./shapes";
import { useFinishMaterial } from "./Studio";

type Props = ThreeElements["group"] & {
  shape: Shape;
  finish: string;
  /** radians per second around Y */
  spin?: number;
  wireframe?: boolean;
};

export function PrintModel({ shape, finish, spin = 0.35, wireframe = false, ...group }: Props) {
  const mat = useFinishMaterial(finish, wireframe);
  const root = useRef<THREE.Group>(null!);
  const inner = useRef<THREE.Mesh>(null!);
  const speed = useRef(spin);

  useFrame((_, dt) => {
    speed.current += (spin - speed.current) * (1 - Math.exp(-dt * 4));
    root.current.rotation.y += dt * speed.current;
    if (shape === "gear" && inner.current) inner.current.rotation.z += dt * 1.2;
  });

  return (
    <group {...group}>
      <group ref={root}>
        {shape === "serpent" ? (
          <Serpent material={mat} />
        ) : (
          <mesh ref={inner} geometry={getShapeGeometry(shape)} material={mat} dispose={null} />
        )}
        {shape === "lattice" && (
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

const SEGMENTS = 18;
const up = new THREE.Vector3(1, 0, 0);

function Serpent({ material }: { material: THREE.Material }) {
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

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
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
