"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Product } from "@/lib/products";
import { MODEL_EXTENSIONS, parseModel, toGeometry, toGLB } from "@/lib/mesh-core.mjs";
import { ViewRig } from "../three/Studio";
import { canvasBytes, drawShadow, drawStage } from "@/lib/owner/stage";
import { PrintModel } from "../three/PrintModel";

// The owner page's own 3D: a turntable preview of a product (with an uploaded
// file before it's published), and the studio pictures the shop shows in the
// cart, Lite mode and share cards, taken with the same camera and lighting as
// the shop's product cards.

/** A print file the owner picked, as a .glb blob URL the 3D view can load (read exactly like the build does). */
export async function fileToModel(file: File): Promise<{ url: string; bytes: Uint8Array<ArrayBuffer>; ext: string; triangles: number | null }> {
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (!MODEL_EXTENSIONS.includes(ext) || ext === "gltf") throw new Error("Use an .stl, .3mf, .obj or .glb file.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (ext === "glb") return { url: URL.createObjectURL(new Blob([bytes], { type: "model/gltf-binary" })), bytes, ext, triangles: null };
  const soup = parseModel(bytes, ext);
  if (!soup.positions.length) throw new Error("No shape found in that file.");
  const geo = toGeometry(soup);
  const glb = toGLB(geo);
  return { url: URL.createObjectURL(new Blob([glb], { type: "model/gltf-binary" })), bytes, ext, triangles: geo.index!.count / 3 };
}

/** Drag-to-turn preview, slowly spinning. */
export function ModelPreview({ product, finish, modelUrl }: { product: Product; finish: string; modelUrl?: string }) {
  return (
    <div className="stage relative aspect-square overflow-hidden rounded-2xl border border-line">
      <Canvas dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }} frameloop="always">
        <ViewRig position={[0, 0.25, 4.5]} fov={35} />
        <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={1.4} />
        <PrintModel key={modelUrl ?? product.shape} shape={product.shape} model={modelUrl} finish={finish} spin={0} />
      </Canvas>
      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-page/80 px-2.5 py-1 text-xs font-semibold">Drag to turn</span>
    </div>
  );
}

export type Shot = { finish: string; large: Uint8Array; small: Uint8Array; xl?: Uint8Array; cover?: Uint8Array };

const SIZE = 720;

/**
 * The 3D picture with its floor shadow, transparent like the site's other
 * studio pictures (they sit on the stage in CSS); the share-card JPEG gets the
 * stage itself (lib/owner/stage.ts).
 */
function composite(src: HTMLCanvasElement, size: number, type: string, quality: number): Promise<Uint8Array> {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  if (type === "image/jpeg") drawStage(g, size);
  drawShadow(g, size * 0.5, size * 0.835, size * 0.23, size * 0.035);
  g.imageSmoothingQuality = "high";
  g.drawImage(src, 0, 0, size, size);
  return canvasBytes(c, type, quality);
}

function Grab({ onGrab }: { onGrab: (canvas: HTMLCanvasElement) => void }) {
  const gl = useThree((s) => s.gl);
  const frames = useRef(0);
  const done = useRef(false);
  useFrame(() => {
    // a few frames after the model is up: materials and lighting have settled
    if (done.current || ++frames.current < 4) return;
    done.current = true;
    onGrab(gl.domElement);
  });
  return null;
}

/**
 * Takes the studio pictures of one product, one per colour, off screen.
 * Calls `onDone` with them (or `onError`).
 */
export function StudioCapture({
  product,
  modelUrl,
  finishes,
  onShot,
  onDone,
  onError,
}: {
  product: Product;
  modelUrl?: string;
  finishes: string[];
  onShot?: (done: number) => void;
  onDone: (shots: Shot[]) => void;
  onError: (e: Error) => void;
}) {
  const [i, setI] = useState(0);
  const [ready, setReady] = useState(false);
  const shots = useRef<Shot[]>([]);
  // never wait forever on a model that doesn't load
  useEffect(() => {
    const t = setTimeout(() => onError(new Error(`The 3D model of ${product.name} didn't load.`)), 60_000);
    return () => clearTimeout(t);
  }, [i, product.name, onError]);

  const grab = async (canvas: HTMLCanvasElement) => {
    const finish = finishes[i];
    const shot: Shot = {
      finish,
      large: await composite(canvas, SIZE, "image/webp", 0.82),
      small: await composite(canvas, 200, "image/webp", 0.8),
      // the main colour also gets the big picture the home page uses
      xl: i === 0 ? await composite(canvas, 1200, "image/webp", 0.86) : undefined,
      cover: i === 0 ? await composite(canvas, 630, "image/jpeg", 0.85) : undefined,
    };
    shots.current.push(shot);
    onShot?.(shots.current.length);
    if (i + 1 < finishes.length) {
      setReady(false);
      setI(i + 1);
    } else onDone(shots.current);
  };

  return (
    <div aria-hidden style={{ position: "fixed", left: -10000, top: 0, width: SIZE, height: SIZE, pointerEvents: "none" }}>
      <Canvas dpr={2} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }} frameloop="always">
        <ViewRig position={[0, 0.25, 4.5]} fov={35} />
        <PrintModel key={finishes[i]} shape={product.shape} model={modelUrl} finish={finishes[i]} spin={0} onReady={() => setReady(true)} />
        {ready && <Grab key={`grab-${i}`} onGrab={grab} />}
      </Canvas>
    </div>
  );
}
