"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import { products } from "@/lib/products";
import { modelFor } from "@/lib/models";
import { pointer } from "@/lib/pointer";
import { theme } from "@/lib/theme";
import { ViewRig } from "./Studio";
import { useLive } from "./live";
import { PrintModel } from "./PrintModel";
import { BrandMark, HERO_CAM_Z, HERO_FOV, MARK_FILL_H, MARK_FILL_W, MARK_SHIFT_Y, getMarkGeometry } from "./brandMark";

const RING = new THREE.Euler(1.2, 0.2, 0);

/** Cover page: the 3D RK monogram with real bestsellers orbiting it (click one to open it). */
export function HeroScene() {
  const size = useThree((s) => s.size);
  const { width: mw, height: mh } = getMarkGeometry();
  const visH = 2 * HERO_CAM_Z * Math.tan(THREE.MathUtils.degToRad(HERO_FOV / 2));
  const visW = visH * (size.width / size.height);
  const scale = Math.min((visH * MARK_FILL_H) / mh, (visW * MARK_FILL_W) / mw);
  const lift = visH * MARK_SHIFT_Y;
  const orbit = mw * scale * 0.78;
  const featured = useMemo(() => products.filter((p) => p.tags?.includes("bestseller")).slice(0, 4), []);

  // animate only while the cover is on screen; the canvas idles once it's scrolled away
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const check = () => setVisible(window.scrollY < window.innerHeight * 1.05);
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);
  useLive(visible);

  const rig = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    const k = 1 - Math.exp(-Math.min(dt, 0.05) * 3);
    const scroll = Math.min(window.scrollY / window.innerHeight, 1.5);
    const r = rig.current;
    r.rotation.y += (pointer.x * 0.35 - r.rotation.y) * k;
    r.rotation.x += (-pointer.y * 0.2 - r.rotation.x) * k;
    r.position.y = lift + scroll * 1.6;
  });

  return (
    <>
      <ViewRig position={[0, 0, HERO_CAM_Z]} fov={HERO_FOV} />
      <group ref={rig}>
        <Float speed={1.2} rotationIntensity={0.12} floatIntensity={0.3}>
          <BrandMark scale={scale} />
        </Float>
        {/* glowing orbit line, partly behind the mark */}
        <mesh rotation={RING} scale={orbit}>
          <torusGeometry args={[1, 0.0035, 8, 200]} />
          <meshBasicMaterial color={theme.amber} toneMapped={false} transparent opacity={0.5} />
        </mesh>
        {featured.map((p, i) => (
          <Orbiter key={p.slug} slug={p.slug} radius={orbit} phase={(i / featured.length) * Math.PI * 2} size={scale * 0.13}>
            <PrintModel shape={p.shape} model={modelFor(p)} finish={p.finishes[0]} spin={visible ? 0.7 : 0} />
          </Orbiter>
        ))}
      </group>
      <Sparkles count={50} scale={[visW * 0.9, visH * 0.7, 3]} size={2.4} speed={0.3} color={theme.sparkles[0]} />
    </>
  );
}

/** A product on the orbit ring. Hover grows it, click opens its page. */
function Orbiter({ slug, radius, phase, size, children }: { slug: string; radius: number; phase: number; size: number; children: React.ReactNode }) {
  const router = useRouter();
  const ref = useRef<THREE.Group>(null!);
  const [hover, setHover] = useState(false);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock }, dt) => {
    const a = clock.elapsedTime * 0.25 + phase;
    v.set(Math.cos(a) * radius, Math.sin(a) * radius, 0).applyEuler(RING);
    ref.current.position.copy(v);
    const s = ref.current.scale.x + ((hover ? size * 1.35 : size) - ref.current.scale.x) * (1 - Math.exp(-Math.min(dt, 0.05) * 8));
    ref.current.scale.setScalar(s);
  });
  return (
    <group
      ref={ref}
      scale={size}
      onClick={(e) => {
        e.stopPropagation();
        router.push(`/shop/${slug}/`);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = "";
      }}
    >
      {children}
    </group>
  );
}
