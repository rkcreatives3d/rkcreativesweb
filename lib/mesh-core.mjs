// Reading 3D print files (STL, 3MF incl. Bambu/Orca projects, OBJ) into an
// upright, indexed mesh with crisp normals, and writing it as a minimal .glb.
// Shared by the build (scripts/prepare-models.mjs) and the owner page's live
// preview, so what the owner sees is what customers get. Pure JS: runs in
// Node and in the browser.
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { mergeVertices, toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { strFromU8, unzipSync } from "three/examples/jsm/libs/fflate.module.js";

const CREASE = Math.PI / 5; // edges sharper than 36° stay sharp

/** Any supported file (by extension) → triangle soup. `buf` is a Uint8Array. */
export function parseModel(buf, ext) {
  ext = ext.toLowerCase().replace(/^\./, "");
  if (ext === "stl") return fromSTL(buf);
  if (ext === "3mf") return from3MF(buf);
  if (ext === "obj") return fromOBJ(new TextDecoder().decode(buf));
  throw new Error(`can't read .${ext} files`);
}

export const MODEL_EXTENSIONS = ["stl", "3mf", "obj", "glb", "gltf"];

// ── parsers: each returns a flat triangle soup [x,y,z, x,y,z, x,y,z, ...] ──

export function fromSTL(buf) {
  const g = new STLLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  return { positions: g.getAttribute("position").array, zUp: true };
}

export function fromOBJ(text) {
  const v = [];
  const out = [];
  for (const line of text.split("\n")) {
    const p = line.trim().split(/\s+/);
    if (p[0] === "v") v.push([+p[1], +p[2], +p[3]]);
    else if (p[0] === "f") {
      const idx = p.slice(1).map((s) => {
        const i = parseInt(s.split("/")[0], 10);
        return i < 0 ? v.length + i : i - 1;
      });
      for (let k = 1; k < idx.length - 1; k++) out.push(...v[idx[0]], ...v[idx[k]], ...v[idx[k + 1]]);
    }
  }
  return { positions: Float32Array.from(out), zUp: false };
}

const attr = (s, name) => s.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`))?.[1];
const IDENTITY = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
const mat = (s) => (s ? s.trim().split(/\s+/).map(Number) : IDENTITY);
/** 3MF row-vector affine transforms: apply `a`, then `b`. */
function mul(a, b) {
  const A = [[a[0], a[1], a[2], 0], [a[3], a[4], a[5], 0], [a[6], a[7], a[8], 0], [a[9], a[10], a[11], 1]];
  const B = [[b[0], b[1], b[2], 0], [b[3], b[4], b[5], 0], [b[6], b[7], b[8], 0], [b[9], b[10], b[11], 1]];
  const C = A.map((row) => [0, 1, 2, 3].map((j) => row.reduce((s, x, k) => s + x * B[k][j], 0)));
  return [C[0][0], C[0][1], C[0][2], C[1][0], C[1][1], C[1][2], C[2][0], C[2][1], C[2][2], C[3][0], C[3][1], C[3][2]];
}

function parseModelXml(xml) {
  const objects = {};
  for (const m of xml.matchAll(/<object\b([^>]*)>([\s\S]*?)<\/object>/g)) {
    const body = m[2];
    const obj = { components: [] };
    if (body.includes("<mesh")) {
      const v = [];
      for (const vm of body.matchAll(/<vertex\b([^>]*?)\/?>/g)) v.push(+attr(vm[1], "x"), +attr(vm[1], "y"), +attr(vm[1], "z"));
      const t = [];
      for (const tm of body.matchAll(/<triangle\b([^>]*?)\/?>/g)) t.push(+attr(tm[1], "v1"), +attr(tm[1], "v2"), +attr(tm[1], "v3"));
      obj.mesh = { v, t };
    }
    for (const cm of body.matchAll(/<component\b([^>]*?)\/?>/g))
      obj.components.push({ id: attr(cm[1], "objectid"), path: attr(cm[1], "p:path"), m: mat(attr(cm[1], "transform")) });
    objects[attr(m[1], "id")] = obj;
  }
  const items = [...xml.matchAll(/<item\b([^>]*?)\/?>/g)].map((im) => ({ id: attr(im[1], "objectid"), m: mat(attr(im[1], "transform")) }));
  return { objects, items };
}

export function from3MF(buf) {
  const files = unzipSync(new Uint8Array(buf));
  const rootPath = files["3D/3dmodel.model"] ? "3D/3dmodel.model" : Object.keys(files).find((k) => /\.model$/i.test(k));
  const parsed = {};
  const model = (p) => (parsed[p] ??= parseModelXml(strFromU8(files[p.replace(/^\//, "")])));
  const out = [];
  const emit = (p, id, m) => {
    const obj = model(p).objects[id];
    if (!obj) return;
    if (obj.mesh) {
      const { v, t } = obj.mesh;
      for (const i of t) {
        const x = v[i * 3], y = v[i * 3 + 1], z = v[i * 3 + 2];
        out.push(x * m[0] + y * m[3] + z * m[6] + m[9], x * m[1] + y * m[4] + z * m[7] + m[10], x * m[2] + y * m[5] + z * m[8] + m[11]);
      }
    }
    for (const c of obj.components) emit(c.path ?? p, c.id, mul(c.m, m));
  };
  for (const item of model(rootPath).items) emit(rootPath, item.id, item.m);
  return { positions: Float32Array.from(out), zUp: true };
}

// ── triangle soup → indexed mesh with crisp normals → minimal GLB ──

export function toGeometry({ positions, zUp }) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  if (zUp) g.rotateX(-Math.PI / 2); // print bed is Z-up; the web is Y-up
  const creased = toCreasedNormals(g, CREASE);
  return mergeVertices(creased, 1e-4);
}

/** An indexed geometry (position + normal) as the bytes of a minimal .glb file. Works in Node and the browser. */
export function toGLB(geo) {
  const pos = geo.getAttribute("position").array;
  const nor = geo.getAttribute("normal").array;
  const idx = Uint32Array.from(geo.index.array);
  geo.computeBoundingBox();
  const { min, max } = geo.boundingBox;
  const pad = (n) => (n + 3) & ~3;
  const bin = new Uint8Array(pad(pos.byteLength) + pad(nor.byteLength) + pad(idx.byteLength));
  bin.set(new Uint8Array(pos.buffer, pos.byteOffset, pos.byteLength), 0);
  bin.set(new Uint8Array(nor.buffer, nor.byteOffset, nor.byteLength), pad(pos.byteLength));
  bin.set(new Uint8Array(idx.buffer, idx.byteOffset, idx.byteLength), pad(pos.byteLength) + pad(nor.byteLength));
  const count = pos.length / 3;
  const json = {
    asset: { version: "2.0", generator: "rk prepare-models" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2 }] }],
    buffers: [{ byteLength: bin.length }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: pos.byteLength, target: 34962 },
      { buffer: 0, byteOffset: pad(pos.byteLength), byteLength: nor.byteLength, target: 34962 },
      { buffer: 0, byteOffset: pad(pos.byteLength) + pad(nor.byteLength), byteLength: idx.byteLength, target: 34963 },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count, type: "VEC3", min: min.toArray(), max: max.toArray() },
      { bufferView: 1, componentType: 5126, count, type: "VEC3" },
      { bufferView: 2, componentType: 5125, count: idx.length, type: "SCALAR" },
    ],
  };
  const text = new TextEncoder().encode(JSON.stringify(json));
  const jsonBuf = new Uint8Array(pad(text.length)).fill(0x20);
  jsonBuf.set(text);
  const out = new Uint8Array(12 + 8 + jsonBuf.length + 8 + bin.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, 0x46546c67, true); // "glTF"
  view.setUint32(4, 2, true);
  view.setUint32(8, out.length, true);
  view.setUint32(12, jsonBuf.length, true);
  view.setUint32(16, 0x4e4f534a, true); // JSON
  out.set(jsonBuf, 20);
  view.setUint32(20 + jsonBuf.length, bin.length, true);
  view.setUint32(24 + jsonBuf.length, 0x004e4942, true); // BIN
  out.set(bin, 28 + jsonBuf.length);
  return out;
}

