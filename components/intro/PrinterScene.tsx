"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Sparkles, useTexture } from "@react-three/drei";
import { INTRO_LAYERS } from "@/lib/intro";
import { theme } from "@/lib/theme";
import { ViewRig } from "../three/Studio";
import { LOGO_FILL_H, LOGO_FILL_W, LOGO_SHIFT_Y, LOGO_URL, LogoPlaque } from "../three/LogoPlaque";
import { HERO_FOV } from "../three/LogoScene";

// start downloading the logo as soon as the intro's code loads
if (typeof window !== "undefined") useTexture.preload(LOGO_URL);

const S = 3; // printed logo size
const BED = -1.6; // bed surface height
const CY = BED + S / 2; // logo centre height
const IN = 0.45; // printer settles into view
const PRINT = 2.1; // layer-by-layer print
const OUT = 0.95; // printer clears away, camera lands on the cover framing

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

const black = { color: theme.carriage, metalness: 0.5, roughness: 0.35 } as const;
const gold = { color: theme.gold, metalness: 1, roughness: 0.28 } as const;

/** A 3D printer printing the logo, ending framed exactly like the cover page. */
export function PrinterScene({
  onProgress,
  onDone,
}: {
  onProgress: (progress: number, layer: number) => void;
  onDone: () => void;
}) {
  const { camera, size } = useThree();
  const tan = Math.tan(THREE.MathUtils.degToRad(HERO_FOV / 2));
  const aspect = size.width / size.height;
  // start: whole printer in shot; end: the printed logo lands exactly on the cover's logo image
  const startZ = Math.max(9.5, 5.8 / aspect / (2 * tan));
  const { endX, endY, endZ } = useMemo(() => {
    const r = document.getElementById("cover-logo")?.getBoundingClientRect();
    if (!r || !r.width) {
      // no cover image (shouldn't happen): centre it like the old full-screen cover
      const z = Math.max(S / (LOGO_FILL_H * 2 * tan), S / (LOGO_FILL_W * 2 * tan * aspect));
      return { endX: 0, endY: CY - LOGO_SHIFT_Y * 2 * z * tan, endZ: z };
    }
    const visHAt = (z: number) => 2 * z * tan;
    const z = S / (visHAt(1) * (r.height / size.height));
    const fx = (r.left + r.width / 2) / size.width;
    const fy = (r.top + r.height / 2) / size.height;
    return { endX: -(fx - 0.5) * visHAt(z) * aspect, endY: CY - (0.5 - fy) * visHAt(z), endZ: z };
  }, [size, tan, aspect]);

  const reveal = useRef(0);
  const clip = useMemo(() => new THREE.Plane(new THREE.Vector3(0, -1, 0), BED), []);
  const t0 = useRef<number | null>(null);
  const done = useRef(false);
  const look = useMemo(() => new THREE.Vector3(), []);

  const left = useRef<THREE.Group>(null!);
  const right = useRef<THREE.Group>(null!);
  const beam = useRef<THREE.Mesh>(null!);
  const bed = useRef<THREE.Group>(null!);
  const rail = useRef<THREE.Mesh>(null!);
  const hotend = useRef<THREE.Group>(null!);
  const fan = useRef<THREE.Group>(null!);
  const spool = useRef<THREE.Group>(null!);
  const hotLine = useRef<THREE.Mesh>(null!);
  const glow = useRef<THREE.PointLight>(null!);

  const tube = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0.72, 0),
          new THREE.Vector3(0.05, 1.25, -0.1),
          new THREE.Vector3(0.6, 1.85, -0.3),
          new THREE.Vector3(1.7, 2.15, -0.45),
        ]),
        48,
        0.03,
        8,
      ),
    [],
  );

  useFrame(({ clock }, dt) => {
    if (t0.current === null) t0.current = clock.elapsedTime;
    const t = clock.elapsedTime - t0.current;
    const pin = ease(clamp01(t / IN));
    const p = clamp01((t - IN) / PRINT);
    const pout = ease(clamp01((t - IN - PRINT) / OUT));
    const printing = p > 0 && p < 1;

    const layerY = BED + p * S;
    reveal.current = p;
    clip.constant = layerY;
    onProgress(p, Math.round(p * INTRO_LAYERS));

    // nozzle rasters across the current layer; gantry rides up with it
    const x = p === 0 ? -S / 2 : printing ? (S / 2 - 0.08) * Math.sin(t * 10) : (S / 2 - 0.08) * Math.sin((IN + PRINT) * 10);
    hotend.current.position.set(x + pout * 2.5, layerY + pout * 4, 0);
    rail.current.position.y = layerY + 0.62 + pout * 4;
    hotLine.current.position.y = layerY;
    hotLine.current.visible = printing;
    glow.current.intensity = printing ? 3 + Math.sin(t * 40) * 0.6 : 0;
    fan.current.rotation.z += dt * 25;
    spool.current.rotation.z -= dt * (printing ? 2.2 : 0.3);

    // once printed, the machine clears out of shot
    left.current.position.x = -pout * 5;
    right.current.position.x = pout * 6;
    beam.current.position.y = 2.3 + pout * 4;
    bed.current.position.y = BED - pout * 4 - (1 - pin) * 0.6;

    // camera: dolly in, drift while printing, then land on the cover framing
    const drift = Math.sin(t * 0.5) * 0.5 * (1 - pout);
    if (t < IN) camera.position.set(drift, 0.6, startZ + 2.5 * (1 - pin));
    else
      camera.position.set(
        drift + endX * pout,
        THREE.MathUtils.lerp(0.6, endY, pout),
        THREE.MathUtils.lerp(startZ - 0.6 * p, endZ, pout),
      );
    look.set(endX * pout, THREE.MathUtils.lerp(CY + 0.1, endY, pout), 0);
    camera.lookAt(look);

    if (!done.current && pout > 0.85) {
      done.current = true;
      onDone();
    }
  });

  return (
    <>
      <ViewRig position={[0, 0.6, startZ + 2.5]} fov={HERO_FOV} look="warm" />

      {/* the print: logo face + black body, both cut off at the current layer */}
      <LogoPlaque size={S} reveal={reveal} position={[0, CY, 0.002]} />
      <mesh position={[0, CY, -0.05]}>
        <boxGeometry args={[S, S, 0.1]} />
        <meshStandardMaterial color="#0b0b0b" metalness={0.2} roughness={0.5} clippingPlanes={[clip]} />
      </mesh>
      <mesh ref={hotLine} position={[0, BED, 0]}>
        <boxGeometry args={[S, 0.028, 0.12]} />
        <meshBasicMaterial color={theme.amber} toneMapped={false} />
      </mesh>

      {/* bed with the amber light strip from the logo */}
      <group ref={bed} position={[0, BED, 0]}>
        <mesh position={[0, -0.06, 0]}>
          <boxGeometry args={[4, 0.12, 1.7]} />
          <meshStandardMaterial {...black} color="#161616" />
        </mesh>
        <mesh position={[0, -0.06, 0.86]}>
          <boxGeometry args={[3.6, 0.025, 0.02]} />
          <meshBasicMaterial color={theme.amber} toneMapped={false} />
        </mesh>
        <mesh position={[0, -0.4, 0]}>
          <boxGeometry args={[3.3, 0.55, 1.4]} />
          <meshStandardMaterial {...black} color="#0c0c0c" />
        </mesh>
      </group>

      {/* frame */}
      <group ref={left}>
        <Post x={-2.3} />
      </group>
      <group ref={right}>
        <Post x={2.3} />
        <group position={[3.05, -0.4, -0.65]} rotation-y={-0.95}>
          <group ref={spool}>
            <mesh rotation-x={Math.PI / 2}>
              <cylinderGeometry args={[0.72, 0.72, 0.36, 48]} />
              <meshStandardMaterial color={theme.amber} metalness={0.2} roughness={0.35} emissive={theme.amber} emissiveIntensity={0.15} />
            </mesh>
            {[-0.2, 0.2].map((z) => (
              <mesh key={z} rotation-x={Math.PI / 2} position-z={z}>
                <cylinderGeometry args={[0.86, 0.86, 0.04, 48]} />
                <meshStandardMaterial {...black} />
              </mesh>
            ))}
            <mesh rotation-x={Math.PI / 2}>
              <cylinderGeometry args={[0.22, 0.22, 0.5, 24]} />
              <meshStandardMaterial {...gold} />
            </mesh>
          </group>
        </group>
      </group>
      <mesh ref={beam} position={[0, 2.3, -0.4]}>
        <boxGeometry args={[4.76, 0.16, 0.16]} />
        <meshStandardMaterial {...black} />
      </mesh>

      {/* X gantry + hotend */}
      <mesh ref={rail} position={[0, BED + 0.62, -0.15]}>
        <boxGeometry args={[4.6, 0.09, 0.12]} />
        <meshStandardMaterial {...gold} roughness={0.4} />
      </mesh>
      <group ref={hotend} position={[-S / 2, BED, 0]}>
        <mesh position-y={0.1} rotation-x={Math.PI}>
          <coneGeometry args={[0.07, 0.16, 24]} />
          <meshStandardMaterial {...gold} />
        </mesh>
        <mesh position-y={0.24}>
          <boxGeometry args={[0.2, 0.12, 0.2]} />
          <meshStandardMaterial {...gold} color="#b07a2a" />
        </mesh>
        <mesh position-y={0.51}>
          <boxGeometry args={[0.5, 0.42, 0.42]} />
          <meshStandardMaterial {...black} />
        </mesh>
        <mesh position={[0, 0.31, 0]}>
          <boxGeometry args={[0.5, 0.02, 0.43]} />
          <meshBasicMaterial color={theme.amber} toneMapped={false} />
        </mesh>
        {/* front fan */}
        <group position={[0, 0.51, 0.215]}>
          <mesh rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.16, 0.16, 0.02, 32]} />
            <meshStandardMaterial color="#050505" roughness={0.8} />
          </mesh>
          <group ref={fan} position-z={0.015}>
            {Array.from({ length: 7 }, (_, i) => (
              <mesh key={i} rotation-z={(i / 7) * Math.PI * 2}>
                <boxGeometry args={[0.035, 0.27, 0.005]} />
                <meshStandardMaterial color="#2a2a2a" metalness={0.4} roughness={0.5} />
              </mesh>
            ))}
            <mesh rotation-x={Math.PI / 2}>
              <cylinderGeometry args={[0.05, 0.05, 0.02, 20]} />
              <meshStandardMaterial {...gold} />
            </mesh>
          </group>
        </group>
        {/* bowden tube up to the spool side */}
        <mesh geometry={tube}>
          <meshStandardMaterial color={theme.amber} metalness={0.1} roughness={0.3} emissive={theme.amber} emissiveIntensity={0.25} />
        </mesh>
        {/* molten tip */}
        <mesh position-y={0.02}>
          <sphereGeometry args={[0.035, 16, 12]} />
          <meshBasicMaterial color={theme.hot} toneMapped={false} />
        </mesh>
        <pointLight ref={glow} position-y={0.02} color={theme.amber} intensity={0} distance={2.5} />
        <Sparkles count={24} scale={[0.5, 0.25, 0.4]} size={3} speed={2} color={theme.sparkles[0]} />
      </group>
    </>
  );
}

function Post({ x }: { x: number }) {
  return (
    <group position={[x, 0.05, -0.4]}>
      <mesh>
        <boxGeometry args={[0.16, 4.4, 0.16]} />
        <meshStandardMaterial {...black} />
      </mesh>
      <mesh position-z={0.085}>
        <boxGeometry args={[0.025, 4.3, 0.01]} />
        <meshBasicMaterial color={theme.amber} toneMapped={false} />
      </mesh>
    </group>
  );
}
