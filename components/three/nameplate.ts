import * as THREE from "three";
import { FontLoader, type Font } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import fontData from "@/lib/fonts/saira-extrabold.typeface.json";

// Personalised prints: a name in raised Saira letters on a rounded plate.
// "keychain" adds a ring tab and a metal ring; "nameplate" stands the plate up
// on a weighted base, tilted back like a desk sign.

export type PlateStyle = "keychain" | "nameplate";

export const MAX_NAME = 14;

let font: Font | null = null;
const getFont = () => (font ??= new FontLoader().parse(fontData as never));

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
};

export function buildPlate(text: string, style: PlateStyle): Plate {
  const t = text.trim().slice(0, MAX_NAME) || "NAME";
  const letters = new TextGeometry(t, {
    font: getFont(),
    size: 0.42,
    depth: 0.09,
    curveSegments: 6,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.01,
    bevelSegments: 2,
  });
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
  if (style === "keychain") {
    const hx = -pw / 2 - tab / 2 + 0.02;
    const hole = new THREE.Path();
    hole.absarc(hx, 0, 0.075, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    // split key ring through the hole, standing across the plate
    ring = new THREE.TorusGeometry(0.2, 0.022, 10, 48).rotateY(Math.PI / 2).translate(hx - 0.02, -0.12, -0.03);
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
  return { letters, plate, ring, width: pw + tab };
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
