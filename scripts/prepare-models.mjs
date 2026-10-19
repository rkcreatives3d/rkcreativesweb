#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
//  Turns your print files into small, web-ready 3D models.
//
//    models/vortex-vase.stl   →   public/models/vortex-vase.glb
//
//  Name each file after the product's slug (see lib/products.ts) and that
//  product shows the real model in 3D everywhere on the site. Supports
//  .stl, .3mf (incl. Bambu Studio / Orca projects), .obj, .glb and .gltf.
//
//  Runs automatically before `npm run build`; run `npm run models` after
//  adding files while developing. Unchanged files are skipped.
// ─────────────────────────────────────────────────────────────
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { mergeVertices, toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { strFromU8, unzipSync } from "three/examples/jsm/libs/fflate.module.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "models");
const OUT = path.join(ROOT, "public/models");
const LIST = path.join(ROOT, "lib/models.generated.json");
const GLTFPACK = path.join(ROOT, "node_modules/.bin/gltfpack");
const MAX_TRIANGLES = 100_000; // plenty of detail for a phone screen, still a light download
const CREASE = Math.PI / 5; // edges sharper than 36° stay sharp

// ── parsers: each returns a flat triangle soup [x,y,z, x,y,z, x,y,z, ...] ──

function fromSTL(buf) {
  const g = new STLLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  return { positions: g.getAttribute("position").array, zUp: true };
}

function fromOBJ(text) {
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

function from3MF(buf) {
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

function toGeometry({ positions, zUp }) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  if (zUp) g.rotateX(-Math.PI / 2); // print bed is Z-up; the web is Y-up
  const creased = toCreasedNormals(g, CREASE);
  return mergeVertices(creased, 1e-4);
}

function writeGLB(geo, file) {
  const pos = geo.getAttribute("position").array;
  const nor = geo.getAttribute("normal").array;
  const idx = Uint32Array.from(geo.index.array);
  geo.computeBoundingBox();
  const { min, max } = geo.boundingBox;
  const pad = (n) => (n + 3) & ~3;
  const bin = Buffer.alloc(pad(pos.byteLength) + pad(nor.byteLength) + pad(idx.byteLength));
  Buffer.from(pos.buffer, pos.byteOffset, pos.byteLength).copy(bin, 0);
  Buffer.from(nor.buffer, nor.byteOffset, nor.byteLength).copy(bin, pad(pos.byteLength));
  Buffer.from(idx.buffer, idx.byteOffset, idx.byteLength).copy(bin, pad(pos.byteLength) + pad(nor.byteLength));
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
  let jsonBuf = Buffer.from(JSON.stringify(json));
  jsonBuf = Buffer.concat([jsonBuf, Buffer.alloc(pad(jsonBuf.length) - jsonBuf.length, 0x20)]);
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0); // "glTF"
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonBuf.length + 8 + bin.length, 8);
  const chunk = (buf, type) => {
    const h = Buffer.alloc(8);
    h.writeUInt32LE(buf.length, 0);
    h.writeUInt32LE(type, 4);
    return Buffer.concat([h, buf]);
  };
  fs.writeFileSync(file, Buffer.concat([header, chunk(jsonBuf, 0x4e4f534a), chunk(bin, 0x004e4942)]));
  return idx.length / 3;
}

// ── main ──

fs.mkdirSync(OUT, { recursive: true });
const sources = fs.existsSync(SRC) ? fs.readdirSync(SRC).filter((f) => /\.(stl|3mf|obj|glb|gltf)$/i.test(f)) : [];
const list = {};
const kb = (n) => `${Math.round(n / 1024)} KB`;

for (const name of sources) {
  const slug = path.parse(name).name.toLowerCase();
  const src = path.join(SRC, name);
  const dst = path.join(OUT, `${slug}.glb`);
  const srcStat = fs.statSync(src);
  if (!fs.existsSync(dst) || fs.statSync(dst).mtimeMs < srcStat.mtimeMs) {
    const ext = path.extname(name).toLowerCase();
    try {
      let input = src;
      let triangles = null;
      if (ext !== ".glb" && ext !== ".gltf") {
        const buf = fs.readFileSync(src);
        const soup = ext === ".stl" ? fromSTL(buf) : ext === ".3mf" ? from3MF(buf) : fromOBJ(buf.toString("utf8"));
        if (!soup.positions.length) throw new Error("no triangles found");
        input = path.join(os.tmpdir(), `rk-${slug}-${process.pid}.glb`);
        triangles = writeGLB(toGeometry(soup), input);
      }
      const ratio = triangles ? Math.min(1, MAX_TRIANGLES / triangles) : 1;
      // -si: simplify to `ratio` of the triangles; -cc: meshopt compression (vertices are quantized too)
      execFileSync(GLTFPACK, ["-i", input, "-o", dst, "-si", ratio.toFixed(3), "-cc"], { stdio: "pipe" });
      if (input !== src) fs.rmSync(input);
      const tris = triangles ? `${triangles.toLocaleString()} → ~${Math.round(triangles * ratio).toLocaleString()} triangles, ` : "";
      console.log(`✓ ${name} → public/models/${slug}.glb (${tris}${kb(srcStat.size)} → ${kb(fs.statSync(dst).size)})`);
    } catch (err) {
      console.warn(`✗ ${name}: ${err.message.split("\n")[0]}`);
      continue;
    }
  }
  list[slug] = `/models/${slug}.glb?v=${Math.round(fs.statSync(dst).mtimeMs).toString(36)}`;
}

// drop outputs whose source file was removed
for (const f of fs.readdirSync(OUT)) if (f.endsWith(".glb") && !list[path.parse(f).name]) fs.rmSync(path.join(OUT, f));

fs.writeFileSync(LIST, JSON.stringify(list, null, 2) + "\n");
console.log(`${Object.keys(list).length} model(s) ready${sources.length ? "" : " (put .stl / .3mf / .obj / .glb files in models/)"}.`);
