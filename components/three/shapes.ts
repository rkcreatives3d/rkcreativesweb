import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ParametricGeometry } from "three/examples/jsm/geometries/ParametricGeometry.js";
import type { Shape } from "@/lib/products";
import { buildPlate } from "./nameplate";

// Procedural stand-ins for real print files. Each builder returns a geometry
// that is centred and normalised to a ~1.1 unit radius so every product frames
// the same way in a view. Results are cached and shared between views.

const cache = new Map<Shape, THREE.BufferGeometry>();

export function getShapeGeometry(shape: Exclude<Shape, "serpent">) {
  let geo = cache.get(shape);
  if (!geo) {
    geo = normalise(builders[shape]());
    cache.set(shape, geo);
  }
  return geo;
}

function normalise(geo: THREE.BufferGeometry, radius = 1.1) {
  geo.computeBoundingBox();
  const centre = geo.boundingBox!.getCenter(new THREE.Vector3());
  geo.translate(-centre.x, -centre.y, -centre.z);
  geo.computeBoundingSphere();
  const s = radius / geo.boundingSphere!.radius;
  geo.scale(s, s, s);
  geo.computeBoundingSphere();
  return geo;
}

/** Merge mixed indexed / non-indexed parts. `flat` gives faceted shading. */
function merge(parts: THREE.BufferGeometry[], flat = false) {
  const prepared = parts.map((g) => {
    const n = g.index ? g.toNonIndexed() : g;
    n.deleteAttribute("uv");
    n.clearGroups();
    if (flat) n.computeVertexNormals();
    return n;
  });
  const merged = mergeGeometries(prepared, false);
  if (!merged) throw new Error("Failed to merge geometry");
  return merged;
}

const builders: Record<Exclude<Shape, "serpent">, () => THREE.BufferGeometry> = {
  vase() {
    const rings = 110;
    const seg = 140;
    const twist = Math.PI * 0.85;
    const height = 2.4;
    const pos: number[] = [];
    const idx: number[] = [];

    const radiusAt = (h: number) =>
      0.45 + 0.35 * Math.sin(Math.PI * h * 1.1) + 0.25 * THREE.MathUtils.smoothstep(h, 0.8, 1);

    for (let i = 0; i <= rings; i++) {
      const h = i / rings;
      const y = h * height - height / 2;
      const r = radiusAt(h);
      for (let j = 0; j < seg; j++) {
        const a = (j / seg) * Math.PI * 2;
        const rr = r * (1 + 0.1 * Math.cos(7 * (a + h * twist)));
        pos.push(Math.cos(a) * rr, y, Math.sin(a) * rr);
      }
    }
    for (let i = 0; i < rings; i++) {
      for (let j = 0; j < seg; j++) {
        const a = i * seg + j;
        const b = (i + 1) * seg + j;
        const c = (i + 1) * seg + ((j + 1) % seg);
        const d = i * seg + ((j + 1) % seg);
        idx.push(a, b, d, b, c, d);
      }
    }
    // bottom cap
    const centre = pos.length / 3;
    pos.push(0, -height / 2, 0);
    for (let j = 0; j < seg; j++) idx.push(centre, j, (j + 1) % seg);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
  },

  knot() {
    return new THREE.TorusKnotGeometry(0.62, 0.2, 280, 36, 2, 3);
  },

  lattice() {
    const ico = new THREE.IcosahedronGeometry(1, 1);
    const p = ico.getAttribute("position");
    const verts: THREE.Vector3[] = [];
    const vIndex = new Map<string, number>();
    const edges = new Set<string>();
    const key = (v: THREE.Vector3) =>
      `${Math.round(v.x * 1000)},${Math.round(v.y * 1000)},${Math.round(v.z * 1000)}`;

    for (let t = 0; t < p.count; t += 3) {
      const ids = [0, 1, 2].map((o) => {
        const v = new THREE.Vector3().fromBufferAttribute(p, t + o);
        const k = key(v);
        if (!vIndex.has(k)) {
          vIndex.set(k, verts.length);
          verts.push(v);
        }
        return vIndex.get(k)!;
      });
      for (const [a, b] of [
        [ids[0], ids[1]],
        [ids[1], ids[2]],
        [ids[2], ids[0]],
      ]) {
        edges.add(a < b ? `${a}-${b}` : `${b}-${a}`);
      }
    }

    const up = new THREE.Vector3(0, 1, 0);
    const parts: THREE.BufferGeometry[] = [];
    for (const e of edges) {
      const [a, b] = e.split("-").map((n) => verts[Number(n)]);
      const len = a.distanceTo(b);
      const strut = new THREE.CylinderGeometry(0.035, 0.035, len, 8, 1, true);
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const q = new THREE.Quaternion().setFromUnitVectors(up, b.clone().sub(a).normalize());
      strut.applyMatrix4(new THREE.Matrix4().compose(mid, q, new THREE.Vector3(1, 1, 1)));
      parts.push(strut);
    }
    for (const v of verts) {
      const node = new THREE.SphereGeometry(0.07, 12, 8);
      node.translate(v.x, v.y, v.z);
      parts.push(node);
    }
    return merge(parts);
  },

  gear() {
    const teeth = 12;
    const ro = 1;
    const ri = 0.84;
    const step = (Math.PI * 2) / teeth;
    const shape = new THREE.Shape();
    for (let k = 0; k < teeth; k++) {
      const a0 = k * step;
      const pts: [number, number][] = [
        [ri, a0],
        [ro, a0 + step * 0.18],
        [ro, a0 + step * 0.42],
        [ri, a0 + step * 0.6],
      ];
      pts.forEach(([r, a], n) => {
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (k === 0 && n === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      });
    }
    shape.closePath();

    const hub = new THREE.Path();
    hub.absarc(0, 0, 0.22, 0, Math.PI * 2, true);
    shape.holes.push(hub);
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      const hole = new THREE.Path();
      hole.absarc(Math.cos(a) * 0.54, Math.sin(a) * 0.54, 0.15, 0, Math.PI * 2, true);
      shape.holes.push(hole);
    }
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.28,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.03,
      bevelSegments: 3,
      curveSegments: 24,
    });
  },

  planter() {
    const hex = (r: number) => {
      const s = new THREE.Shape();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      s.closePath();
      return s;
    };
    const wall = hex(0.8);
    const inner = hex(0.68);
    wall.holes.push(new THREE.Path(inner.getPoints()));

    const height = 1.4;
    const tube = new THREE.ExtrudeGeometry(wall, {
      depth: height,
      steps: 24,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 1,
    });
    const base = new THREE.ExtrudeGeometry(hex(0.8), { depth: 0.12, bevelEnabled: false });

    const g = merge([tube, base]);
    g.rotateX(-Math.PI / 2);
    // taper + twist as it rises
    const p = g.getAttribute("position");
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const h = THREE.MathUtils.clamp(v.y / height, 0, 1);
      const s = 0.8 + 0.35 * h;
      const a = h * 0.7;
      const x = v.x * s;
      const z = v.z * s;
      p.setXYZ(i, x * Math.cos(a) - z * Math.sin(a), v.y, x * Math.sin(a) + z * Math.cos(a));
    }
    g.computeVertexNormals();
    return g;
  },

  mobius() {
    const w = 0.5;
    return new ParametricGeometry(
      (u, v, target) => {
        const t = u * Math.PI * 2;
        const s = (v - 0.5) * 2 * w;
        const r = 1 + (s / 2) * Math.cos(t / 2);
        target.set(r * Math.cos(t), (s / 2) * Math.sin(t / 2), r * Math.sin(t));
      },
      240,
      18,
    ).rotateX(0.5);
  },

  crystal() {
    const piece = (r: number, h: number) => {
      const body = new THREE.CylinderGeometry(r, r * 0.88, h, 6, 1);
      body.translate(0, h / 2, 0);
      const tip = new THREE.ConeGeometry(r, r * 1.7, 6, 1);
      tip.translate(0, h + r * 0.85, 0);
      return [body, tip];
    };
    const layout: [number, number, number, number, number, number][] = [
      // r, h, tiltX, tiltZ, offsetX, offsetZ
      [0.24, 1.3, 0.05, 0.05, 0, 0],
      [0.18, 0.95, 0.35, -0.45, 0.28, 0.08],
      [0.16, 0.8, -0.4, 0.5, -0.3, 0.05],
      [0.14, 0.65, 0.6, 0.2, 0.05, 0.3],
      [0.13, 0.6, -0.55, -0.25, -0.05, -0.3],
      [0.11, 0.45, 0.2, 0.9, -0.45, -0.15],
      [0.1, 0.4, -0.3, -0.95, 0.45, -0.2],
    ];
    const parts: THREE.BufferGeometry[] = [];
    for (const [r, h, tx, tz, ox, oz] of layout) {
      const m = new THREE.Matrix4().compose(
        new THREE.Vector3(ox, -0.5, oz),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(tx, 0, tz)),
        new THREE.Vector3(1, 1, 1),
      );
      for (const g of piece(r, h)) parts.push(g.applyMatrix4(m));
    }
    const rock = new THREE.DodecahedronGeometry(0.7, 0);
    rock.scale(1, 0.38, 0.9);
    rock.translate(0, -0.55, 0);
    parts.push(rock);
    return merge(parts, true);
  },

  saturn() {
    const planet = new THREE.SphereGeometry(0.72, 64, 40);
    const ring = new THREE.TorusGeometry(1.28, 0.06, 12, 160);
    ring.scale(1, 1, 0.25);
    ring.rotateX(Math.PI / 2);
    const ring2 = new THREE.TorusGeometry(1.08, 0.03, 8, 160);
    ring2.scale(1, 1, 0.25);
    ring2.rotateX(Math.PI / 2);
    const g = merge([planet, ring, ring2]);
    g.rotateZ(0.35);
    g.rotateX(0.3);
    return g;
  },

  stand() {
    const s = new THREE.Shape();
    const pts: [number, number][] = [
      [-0.8, 0],
      [0.8, 0],
      [0.8, 0.1],
      [0.62, 0.1],
      [0.0, 1.25],
      [-0.13, 1.2],
      [0.45, 0.1],
      [-0.66, 0.1],
      [-0.66, 0.3],
      [-0.8, 0.3],
    ];
    pts.forEach(([x, y], i) => (i === 0 ? s.moveTo(x, y) : s.lineTo(x, y)));
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, {
      depth: 0.9,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.025,
      bevelSegments: 3,
    });
    g.rotateY(-0.6);
    return g;
  },

  keychain() {
    const { letters, plate, ring } = buildPlate("NAME", "keychain");
    return merge([letters, plate, ...(ring ? [ring] : [])]).rotateZ(-0.12);
  },

  nameplate() {
    const { letters, plate } = buildPlate("NAME", "nameplate");
    return merge([letters, plate]).rotateY(-0.35);
  },
};
