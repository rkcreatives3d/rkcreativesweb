"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { PlateFont, PlateIcon } from "@/lib/personalise";
import { ViewRig, useFinishMaterial } from "./Studio";
import { buildKey, buildPlate, loadPlateFont, plateFontLoaded, type PlateStyle } from "./nameplate";
import { useLive } from "./live";

/**
 * Live 3D preview of a name keychain / desk nameplate. Re-"prints" bottom-up
 * on every change. `context` shows it in use: on a set of keys, or on a desk
 * next to a mug and a pen, so the size reads at a glance.
 */
export function NameplateScene({
  text,
  style,
  finish,
  font = "bold",
  icon = "none",
  context = false,
  domElement,
  visible = true,
}: {
  text: string;
  style: PlateStyle;
  finish: string;
  font?: PlateFont;
  icon?: PlateIcon;
  context?: boolean;
  domElement: HTMLElement;
  /** animates only while on screen */
  visible?: boolean;
}) {
  useLive(visible);
  // Script and Bubbly download on first use; keep showing the last font until then
  const [shownFont, setShownFont] = useState<PlateFont>(() => (plateFontLoaded(font) ? font : "bold"));
  useEffect(() => {
    let live = true;
    if (plateFontLoaded(font)) setShownFont(font);
    else loadPlateFont(font).then(() => live && setShownFont(font), () => {});
    return () => {
      live = false;
    };
  }, [font]);
  const plateGeo = useMemo(() => buildPlate(text, style, shownFont, icon), [text, style, shownFont, icon]);
  useEffect(
    () => () => {
      plateGeo.letters.dispose();
      plateGeo.plate.dispose();
      plateGeo.ring?.dispose();
    },
    [plateGeo],
  );

  // letters in the chosen finish on a contrasting plate: grey by default, white behind black letters
  const letters = useFinishMaterial(finish);
  const plate = useFinishMaterial(finish === "onyx" ? "frost" : finish === "graphite" || finish === "silver" ? "onyx" : "graphite");
  const steel = useMemo(() => new THREE.MeshStandardMaterial({ color: "#c9ccd2", metalness: 1, roughness: 0.25 }), []);
  useEffect(() => () => steel.dispose(), [steel]);

  // print-in: a horizontal cut rises through the model whenever it changes
  const cut = useMemo(() => new THREE.Plane(new THREE.Vector3(0, -1, 0), -10), []);
  useEffect(() => {
    for (const m of [letters, plate, steel]) m.clippingPlanes = [cut];
  }, [letters, plate, steel, cut]);
  const printStart = useRef(0);
  const clock = useThree((s) => s.clock);
  useEffect(() => {
    printStart.current = clock.elapsedTime;
  }, [plateGeo, clock]);

  const group = useRef<THREE.Group>(null!);
  const bounds = useMemo(() => {
    const b = new THREE.Box3();
    for (const g of [plateGeo.letters, plateGeo.plate]) {
      g.computeBoundingBox();
      b.union(g.boundingBox!);
    }
    return b;
  }, [plateGeo]);

  useFrame(({ clock }) => {
    const t = Math.min(1, (clock.elapsedTime - printStart.current) / 0.7);
    const eased = 1 - Math.pow(1 - t, 3);
    const y0 = bounds.min.y + group.current.position.y - 0.05;
    const y1 = bounds.max.y + group.current.position.y + 0.3;
    cut.constant = t >= 1 ? 100 : THREE.MathUtils.lerp(y0, y1, eased);
    group.current.rotation.y = Math.sin(clock.elapsedTime * 0.6) * (context ? 0.22 : 0.35);
  });

  // frame the whole thing, wider for long names, props or narrow screens
  const size = useThree((s) => s.size);
  const tan = Math.tan(THREE.MathUtils.degToRad(17.5));
  const keys = context && style === "keychain" && plateGeo.hang;
  const desk = context && style === "nameplate";
  const span = plateGeo.width + (desk ? 1.9 : keys ? 0.4 : 0);
  const dist = Math.max(keys ? 5 : 4.2, (span * 1.25) / (2 * tan) / (size.width / size.height));
  const lift = style === "nameplate" ? -(bounds.min.y + bounds.max.y) / 2 : keys ? 0.4 : 0;

  return (
    <>
      {/* on the desk the camera looks down a little, so the desk top reads as a surface */}
      <ViewRig position={desk ? [0, 1.5, dist] : [0, 0.35, dist]} fov={35} />
      <OrbitControls domElement={domElement} enableZoom={false} enablePan={false} enableDamping minPolarAngle={0.6} maxPolarAngle={Math.PI - 0.6} />
      <group ref={group} position={[-(bounds.min.x + bounds.max.x) / 2, lift, 0]}>
        <mesh geometry={plateGeo.letters} material={letters} />
        <mesh geometry={plateGeo.plate} material={plate} />
        {plateGeo.ring && <mesh geometry={plateGeo.ring} material={steel} />}
        {keys && <Keys at={plateGeo.hang!} />}
        {desk && <Desk width={plateGeo.width} />}
      </group>
    </>
  );
}

/** Two keys hanging off the ring. */
function Keys({ at }: { at: THREE.Vector3 }) {
  const geo = useMemo(() => buildKey(), []);
  const mats = useMemo(
    () => [
      new THREE.MeshStandardMaterial({ color: "#c9a45c", metalness: 1, roughness: 0.3 }),
      new THREE.MeshStandardMaterial({ color: "#b9bec6", metalness: 1, roughness: 0.25 }),
    ],
    [],
  );
  useEffect(
    () => () => {
      geo.dispose();
      mats.forEach((m) => m.dispose());
    },
    [geo, mats],
  );
  return (
    <group position={at}>
      <mesh geometry={geo} material={mats[0]} rotation={[0, 0.5, 0.22]} />
      <mesh geometry={geo} material={mats[1]} rotation={[0, -0.3, -0.6]} position-z={0.03} scale={0.9} />
    </group>
  );
}

/** A desk top with a mug and a pen beside the nameplate. */
function Desk({ width }: { width: number }) {
  const mats = useMemo(
    () => ({
      wood: new THREE.MeshStandardMaterial({ color: "#3a2a1f", roughness: 0.75 }),
      mug: new THREE.MeshPhysicalMaterial({ color: "#ece6dc", roughness: 0.35, clearcoat: 0.6, side: THREE.DoubleSide }),
      coffee: new THREE.MeshStandardMaterial({ color: "#2b1a10", roughness: 0.2 }),
      pen: new THREE.MeshStandardMaterial({ color: "#0d0d0f", metalness: 0.3, roughness: 0.3 }),
    }),
    [],
  );
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);
  const x = width / 2 + 0.75;
  return (
    <group>
      <mesh position={[0, -0.03, 0]} material={mats.wood}>
        <boxGeometry args={[width + 4, 0.06, 2.6]} />
      </mesh>
      <group position={[x, 0, -0.35]}>
        <mesh position-y={0.36} material={mats.mug}>
          <cylinderGeometry args={[0.3, 0.27, 0.72, 40, 1, true]} />
        </mesh>
        <mesh position-y={0.01} material={mats.mug}>
          <cylinderGeometry args={[0.27, 0.27, 0.02, 40]} />
        </mesh>
        <mesh position-y={0.62} material={mats.coffee}>
          <cylinderGeometry args={[0.29, 0.29, 0.01, 40]} />
        </mesh>
        <mesh position={[0.32, 0.38, 0]} rotation-z={-Math.PI * 0.6} material={mats.mug}>
          <torusGeometry args={[0.15, 0.04, 12, 32, Math.PI * 1.2]} />
        </mesh>
      </group>
      <mesh position={[-width / 2 - 0.7, 0.025, 0.35]} rotation={[0, 0.5, Math.PI / 2]} material={mats.pen}>
        <cylinderGeometry args={[0.025, 0.025, 1.1, 16]} />
      </mesh>
    </group>
  );
}
