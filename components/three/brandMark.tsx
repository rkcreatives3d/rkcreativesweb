"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { ThreeElements } from "@react-three/fiber";
import { FontLoader, type Font } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import fontData from "@/lib/fonts/saira-extrabold.typeface.json";

// The RK monogram as real 3D letters, styled after the logo: a glossy black R
// with gold edges and a brushed-gold K tucked in front of it. Shared by the
// hero and the opening animation, which ends on exactly the hero's framing.

export const HERO_CAM_Z = 6.2;
export const HERO_FOV = 35;
/** the mark fills this much of the view height (or width on narrow screens)… */
export const MARK_FILL_H = 0.36;
export const MARK_FILL_W = 0.62;
/** …and sits this far above centre, as a fraction of the view height */
export const MARK_SHIFT_Y = 0.08;

let font: Font | null = null;
let cached: { r: THREE.BufferGeometry; k: THREE.BufferGeometry; width: number; height: number } | null = null;

/** R and K geometries (unit-ish size), centred together. Groups: 0 = faces, 1 = sides/bevel. */
export function getMarkGeometry() {
  if (cached) return cached;
  font ??= new FontLoader().parse(fontData as never);
  const opts = {
    font,
    size: 1,
    depth: 0.26,
    curveSegments: 10,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.028,
    bevelSegments: 4,
  };
  const r = new TextGeometry("R", opts);
  const k = new TextGeometry("K", opts);
  r.computeBoundingBox();
  // K tucked slightly over the R and a touch in front, like the logo
  k.translate(r.boundingBox!.max.x - 0.06, 0, 0.1);
  const box = new THREE.Box3();
  for (const g of [r, k]) {
    g.computeBoundingBox();
    box.union(g.boundingBox!);
  }
  const c = box.getCenter(new THREE.Vector3());
  r.translate(-c.x, -c.y, -c.z);
  k.translate(-c.x, -c.y, -c.z);
  const size = box.getSize(new THREE.Vector3());
  cached = { r, k, width: size.x, height: size.y };
  return cached;
}

/** The mark's four materials; pass clipping planes to "print" it. */
export function useMarkMaterials(clip?: THREE.Plane[]) {
  const mats = useMemo(
    () => ({
      rFace: new THREE.MeshPhysicalMaterial({ color: "#0d0c0e", metalness: 0.5, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08 }),
      rSide: new THREE.MeshPhysicalMaterial({ color: "#d4973f", metalness: 1, roughness: 0.28 }),
      kFace: new THREE.MeshPhysicalMaterial({ color: "#d9a441", metalness: 1, roughness: 0.38 }),
      kSide: new THREE.MeshPhysicalMaterial({ color: "#a8681c", metalness: 1, roughness: 0.3 }),
    }),
    [],
  );
  useEffect(() => {
    for (const m of Object.values(mats)) m.clippingPlanes = clip ?? null;
  }, [mats, clip]);
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);
  return mats;
}

export function BrandMark({ clip, ...group }: { clip?: THREE.Plane[] } & ThreeElements["group"]) {
  const { r, k } = getMarkGeometry();
  const m = useMarkMaterials(clip);
  return (
    <group {...group}>
      <mesh geometry={r} material={[m.rFace, m.rSide]} dispose={null} />
      <mesh geometry={k} material={[m.kFace, m.kSide]} dispose={null} />
    </group>
  );
}
