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
import { parseModel, toGeometry, toGLB } from "../lib/mesh-core.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "models");
const OUT = path.join(ROOT, "public/models");
const LIST = path.join(ROOT, "lib/models.generated.json");
const GLTFPACK = path.join(ROOT, "node_modules/.bin/gltfpack");
const MAX_TRIANGLES = 100_000; // plenty of detail for a phone screen, still a light download

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
        const soup = parseModel(new Uint8Array(fs.readFileSync(src)), ext);
        if (!soup.positions.length) throw new Error("no triangles found");
        input = path.join(os.tmpdir(), `rk-${slug}-${process.pid}.glb`);
        const geo = toGeometry(soup);
        fs.writeFileSync(input, toGLB(geo));
        triangles = geo.index.count / 3;
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
