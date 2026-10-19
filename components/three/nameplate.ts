import * as THREE from "three";
import { FontLoader, type Font } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import sairaData from "@/lib/fonts/saira-extrabold.typeface.json";
import type { PlateFont, PlateIcon } from "@/lib/personalise";

// Personalised prints: a name in raised letters (three lettering styles, plus
// an optional icon) on a rounded plate. "keychain" adds a ring tab and a metal
// ring; "nameplate" stands the plate up on a weighted base, tilted back like a
// desk sign.

export type { PlateStyle } from "@/lib/personalise";
import type { PlateStyle } from "@/lib/personalise";

export { MAX_NAME } from "@/lib/personalise";
import { MAX_NAME } from "@/lib/personalise";

// Bold is built in; Script (Pacifico) and Bubbly (Titan One) download on first use.
const fonts: Partial<Record<PlateFont, Font>> = {};
const fontFiles: Record<Exclude<PlateFont, "bold">, () => Promise<{ default: unknown }>> = {
  script: () => import("@/lib/fonts/pacifico.typeface.json"),
  bubbly: () => import("@/lib/fonts/titan-one.typeface.json"),
};
const getFont = (id: PlateFont = "bold") => fonts[id] ?? (fonts.bold ??= new FontLoader().parse(sairaData as never));

export const plateFontLoaded = (id: PlateFont) => id === "bold" || !!fonts[id];

export async function loadPlateFont(id: PlateFont) {
  if (plateFontLoaded(id)) return;
  const data = await fontFiles[id as Exclude<PlateFont, "bold">]();
  fonts[id] = new FontLoader().parse(data.default as never);
}

// ── Icons, drawn in a 1 × 1 box around the origin ────────────
function iconShapes(icon: PlateIcon): THREE.Shape[] {
  const poly = (pts: [number, number][]) => new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  switch (icon) {
    case "heart": {
      const s = new THREE.Shape();
      s.moveTo(0, -0.5);
      s.bezierCurveTo(-0.1, -0.38, -0.5, -0.15, -0.5, 0.12);
      s.bezierCurveTo(-0.5, 0.36, -0.4, 0.5, -0.25, 0.5);
      s.bezierCurveTo(-0.1, 0.5, 0, 0.4, 0, 0.28);
      s.bezierCurveTo(0, 0.4, 0.1, 0.5, 0.25, 0.5);
      s.bezierCurveTo(0.4, 0.5, 0.5, 0.36, 0.5, 0.12);
      s.bezierCurveTo(0.5, -0.15, 0.1, -0.38, 0, -0.5);
      return [s];
    }
    case "star":
      return [
        poly(
          Array.from({ length: 10 }, (_, i) => {
            const a = Math.PI / 2 + (i * Math.PI) / 5;
            const r = i % 2 ? 0.23 : 0.55;
            return [Math.cos(a) * r, Math.sin(a) * r - 0.04] as [number, number];
          }),
        ),
      ];
    case "crown":
      return [poly([[-0.5, -0.38], [0.5, -0.38], [0.5, 0.32], [0.25, 0.02], [0, 0.45], [-0.25, 0.02], [-0.5, 0.32]])];
    case "bolt":
      return [poly([[0.14, 0.5], [-0.3, -0.06], [-0.03, -0.06], [-0.14, -0.5], [0.3, 0.08], [0.03, 0.08]])];
    case "paw": {
      const disc = (x: number, y: number, rx: number, ry = rx) => {
        const s = new THREE.Shape();
        s.absellipse(x, y, rx, ry, 0, Math.PI * 2, false, 0);
        return s;
      };
      return [disc(0, -0.2, 0.3, 0.24), disc(-0.36, 0.1, 0.11, 0.13), disc(-0.13, 0.32, 0.11, 0.13), disc(0.13, 0.32, 0.11, 0.13), disc(0.36, 0.1, 0.11, 0.13)];
    }
    default:
      return [];
  }
}

const raised = { depth: 0.09, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.01, bevelSegments: 2 };

function roundedRect(w: number, h: number, r: number, x0 = -w / 2, y0 = -h / 2) {
  const s = new THREE.Shape();
  s.moveTo(x0 + r, y0);
  s.lineTo(x0 + w - r, y0);
  s.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
  s.lineTo(x0 + w, y0 + h - r);
  s.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
  s.lineTo(x0 + r, y0 + h);
  s.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r);
  s.lineTo(x0, y0 + r);
  s.quadraticCurveTo(x0, y0, x0 + r, y0);
  return s;
}

export type Plate = {
  letters: THREE.BufferGeometry;
  plate: THREE.BufferGeometry;
  ring: THREE.BufferGeometry | null;
  /** overall width, for framing the camera */
  width: number;
  /** where a key would hang from the ring (keychains only) */
  hang?: THREE.Vector3;
};

export function buildPlate(text: string, style: PlateStyle, font: PlateFont = "bold", icon: PlateIcon = "none"): Plate {
  const t = text.trim().slice(0, MAX_NAME) || "NAME";
  let letters: THREE.BufferGeometry = new TextGeometry(t, { font: getFont(font), size: 0.42, curveSegments: 6, ...raised });
  const shapes = iconShapes(icon);
  if (shapes.length) {
    // the icon sits after the name, about cap height
    letters.computeBoundingBox();
    const tb = letters.boundingBox!;
    const s = 0.36;
    const geo = new THREE.ExtrudeGeometry(shapes, { curveSegments: 10, ...raised });
    geo.scale(s, s, 1).translate(tb.max.x + 0.08 + s / 2, 0.16, 0);
    const merged = mergeGeometries([letters, geo]);
    if (merged) {
      letters.dispose();
      letters = merged;
    }
    geo.dispose();
  }
  letters.computeBoundingBox();
  const bb = letters.boundingBox!;
  const w = bb.max.x - bb.min.x;
  const h = bb.max.y - bb.min.y;
  letters.translate(-(bb.min.x + w / 2), -(bb.min.y + h / 2), 0.01);

  const pad = 0.17;
  const pw = w + pad * 2;
  const ph = h + pad * 2;
  const tab = style === "keychain" ? 0.36 : 0;
  const shape = roundedRect(pw + tab, ph, Math.min(ph / 2, 0.2), -pw / 2 - tab, -ph / 2);
  let ring: THREE.BufferGeometry | null = null;
  let hang: THREE.Vector3 | undefined;
  if (style === "keychain") {
    const hx = -pw / 2 - tab / 2 + 0.02;
    const hole = new THREE.Path();
    hole.absarc(hx, 0, 0.075, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    // split key ring through the hole, standing across the plate
    ring = new THREE.TorusGeometry(0.2, 0.022, 10, 48).rotateY(Math.PI / 2).translate(hx - 0.02, -0.12, -0.03);
    hang = new THREE.Vector3(hx - 0.02, -0.32, -0.03);
  }
  const plate = new THREE.ExtrudeGeometry(shape, {
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 2,
    curveSegments: 10,
  });
  plate.translate(0, 0, -0.095);

  if (style === "nameplate") {
    // tilt the sign back and give it a weighted base underneath
    const tilt = new THREE.Matrix4().makeRotationX(-0.38).setPosition(0, ph / 2 + 0.06, 0);
    letters.applyMatrix4(tilt);
    plate.applyMatrix4(tilt);
    const base = new THREE.BoxGeometry(pw + 0.1, 0.1, 0.6).translate(0, 0.05, -0.12);
    const merged = mergeParts([plate, base]);
    return { letters, plate: merged, ring: null, width: pw + 0.1 };
  }
  return { letters, plate, ring, width: pw + tab, hang };
}

/** A house key with its ring hole at the origin (for the "with keys" preview). */
export function buildKey() {
  const head = new THREE.Shape();
  head.absarc(0, -0.13, 0.2, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, -0.05, 0.045, 0, Math.PI * 2, true);
  head.holes.push(hole);
  const blade = new THREE.Shape(
    (
      [
        [-0.05, -0.28], [-0.05, -0.98], [0.02, -1.04], [0.07, -0.98], [0.07, -0.9], [0.12, -0.86], [0.07, -0.82],
        [0.07, -0.74], [0.13, -0.7], [0.07, -0.66], [0.07, -0.28],
      ] as [number, number][]
    ).map(([x, y]) => new THREE.Vector2(x, y)),
  );
  return new THREE.ExtrudeGeometry([head, blade], { depth: 0.03, bevelEnabled: false, curveSegments: 16 }).translate(0, 0.05, -0.015);
}

function mergeParts(parts: THREE.BufferGeometry[]) {
  const flat = parts.map((g) => {
    const n = g.index ? g.toNonIndexed() : g;
    n.deleteAttribute("uv");
    n.clearGroups();
    return n;
  });
  const geo = new THREE.BufferGeometry();
  const total = flat.reduce((n, g) => n + g.getAttribute("position").count, 0);
  const pos = new Float32Array(total * 3);
  const nor = new Float32Array(total * 3);
  let o = 0;
  for (const g of flat) {
    pos.set(g.getAttribute("position").array as Float32Array, o * 3);
    nor.set(g.getAttribute("normal").array as Float32Array, o * 3);
    o += g.getAttribute("position").count;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  return geo;
}
