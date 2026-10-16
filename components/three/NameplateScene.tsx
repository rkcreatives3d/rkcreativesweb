"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Sparkles } from "@react-three/drei";
import { theme } from "@/lib/theme";
import { ViewRig, useFinishMaterial } from "./Studio";
import { buildPlate, type PlateStyle } from "./nameplate";

/** Live 3D preview of a name keychain / desk nameplate. Re-"prints" bottom-up on every change. */
export function NameplateScene({
  text,
  style,
  finish,
  domElement,
}: {
  text: string;
  style: PlateStyle;
  finish: string;
  domElement: HTMLElement;
}) {
  const plateGeo = useMemo(() => buildPlate(text, style), [text, style]);
  useEffect(
    () => () => {
      plateGeo.letters.dispose();
      plateGeo.plate.dispose();
      plateGeo.ring?.dispose();
    },
    [plateGeo],
  );

  // letters in the chosen finish on a contrasting plate
  const letters = useFinishMaterial(finish);
  const plate = useFinishMaterial(finish === "onyx" ? "frost" : "onyx");
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
    group.current.rotation.y = Math.sin(clock.elapsedTime * 0.6) * 0.35;
  });

  // frame the whole plate, wider for long names / narrow screens
  const size = useThree((s) => s.size);
  const tan = Math.tan(THREE.MathUtils.degToRad(17.5));
  const dist = Math.max(4.2, ((plateGeo.width * 1.25) / (2 * tan)) / (size.width / size.height));
  const lift = style === "nameplate" ? -(bounds.min.y + bounds.max.y) / 2 : 0;

  return (
    <>
      <ViewRig position={[0, 0.35, dist]} fov={35} />
      <OrbitControls domElement={domElement} enableZoom={false} enablePan={false} enableDamping minPolarAngle={0.6} maxPolarAngle={Math.PI - 0.6} />
      <group ref={group} position-y={lift}>
        <mesh geometry={plateGeo.letters} material={letters} />
        <mesh geometry={plateGeo.plate} material={plate} />
        {plateGeo.ring && <mesh geometry={plateGeo.ring} material={steel} />}
      </group>
      <Sparkles count={30} scale={[plateGeo.width + 1, 2, 2]} size={2.2} speed={0.3} color={theme.sparkles[0]} />
    </>
  );
}
