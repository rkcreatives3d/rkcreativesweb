import { getFinish, type Finish } from "./products";

// Colour preview for product photos. Takes a photo of a print in one colour and
// repaints just the print in another finish, keeping its shading and detail:
//   1. find the print: the photo's transparency (cut-out PNGs), or a plain
//      background flood-filled in from the edges;
//   2. stretch the print's brightness so dark and light prints both have range;
//   3. map that brightness onto a gradient made from the finish colour.
// Runs in the browser, cached per photo + finish. Returns null when the
// background is too busy to separate the print safely.

type RGB = [number, number, number];

const MAX_SIDE = 1000;
const cache = new Map<string, Promise<string | null>>();

const hexToRgb = (hex: string): RGB => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** Shadow → mid → highlight colours for a finish. */
function ramp(f: Finish): RGB[] {
  if (f.id === "holo")
    return [
      [30, 18, 52],
      [112, 64, 210],
      [57, 200, 235],
      [190, 240, 120],
      [255, 244, 214],
    ];
  const c = hexToRgb(f.color);
  const black: RGB = [8, 7, 6];
  const white: RGB = [255, 252, 246];
  const light = (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
  return [
    mix(black, c, light > 0.6 ? 0.3 : 0.12),
    mix(black, c, 0.55),
    c,
    mix(c, white, 0.2 + f.metalness * 0.1),
    mix(c, white, 0.48 + f.metalness * 0.2),
  ];
}

function sample(stops: RGB[], t: number): RGB {
  const x = Math.min(0.9999, Math.max(0, t)) * (stops.length - 1);
  const i = Math.floor(x);
  return mix(stops[i], stops[i + 1], x - i);
}

/** 1 where the print is, 0 for background (soft edges). Null if it can't tell. */
function findPrint(px: Uint8ClampedArray, w: number, h: number): Float32Array | null {
  const n = w * h;
  const border: number[] = [];
  for (let x = 0; x < w; x++) border.push(x, (h - 1) * w + x);
  for (let y = 1; y < h - 1; y++) border.push(y * w, y * w + w - 1);

  // cut-out PNG: use its alpha
  const clear = border.filter((i) => px[i * 4 + 3] < 250).length;
  if (clear > border.length * 0.5) {
    const m = new Float32Array(n);
    for (let i = 0; i < n; i++) m[i] = px[i * 4 + 3] / 255;
    return m;
  }

  // plain background: mean + spread of the border colour
  let r = 0, g = 0, b = 0;
  for (const i of border) (r += px[i * 4]), (g += px[i * 4 + 1]), (b += px[i * 4 + 2]);
  r /= border.length;
  g /= border.length;
  b /= border.length;
  let spread = 0;
  for (const i of border) spread += Math.hypot(px[i * 4] - r, px[i * 4 + 1] - g, px[i * 4 + 2] - b);
  spread /= border.length;
  if (spread > 30) return null; // busy background: don't guess

  // flood-fill background in from the edges
  const tol = Math.max(26, spread * 2.5 + 14);
  const bg = new Uint8Array(n);
  const queue = new Int32Array(n);
  let head = 0, tail = 0;
  const near = (i: number) => Math.hypot(px[i * 4] - r, px[i * 4 + 1] - g, px[i * 4 + 2] - b) < tol;
  for (const i of border) if (!bg[i] && near(i)) (bg[i] = 1), (queue[tail++] = i);
  while (head < tail) {
    const i = queue[head++];
    const x = i % w;
    for (const j of [i - w, i + w, x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1])
      if (j >= 0 && j < n && !bg[j] && near(j)) (bg[j] = 1), (queue[tail++] = j);
  }

  // soften the edge with two small box blurs
  let m: Float32Array = new Float32Array(n);
  for (let i = 0; i < n; i++) m[i] = bg[i] ? 0 : 1;
  for (let pass = 0; pass < 2; pass++) {
    const out = new Float32Array(n);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let s = 0, c = 0;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const yy = y + dy, xx = x + dx;
            if (yy >= 0 && yy < h && xx >= 0 && xx < w) (s += m[yy * w + xx]), c++;
          }
        out[y * w + x] = s / c;
      }
    m = out;
  }
  const covered = m.reduce((s, v) => s + v, 0) / n;
  return covered > 0.02 && covered < 0.95 ? m : null; // found nothing / everything: give up
}

async function paint(src: string, finishId: string): Promise<string | null> {
  const img = new Image();
  img.decoding = "async";
  img.src = src;
  await img.decode();
  const k = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * k);
  const h = Math.round(img.naturalHeight * k);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;

  const mask = findPrint(px, w, h);
  if (!mask) return null;

  // brightness range of the print itself (2nd–98th percentile)
  const hist = new Uint32Array(256);
  let count = 0;
  for (let i = 0; i < w * h; i++)
    if (mask[i] > 0.5) {
      hist[Math.round(0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2])]++;
      count++;
    }
  const pct = (p: number) => {
    let acc = 0;
    for (let v = 0; v < 256; v++) if ((acc += hist[v]) >= count * p) return v;
    return 255;
  };
  const lo = pct(0.02);
  const hi = Math.max(lo + 1, pct(0.98));

  const stops = ramp(getFinish(finishId));
  for (let i = 0; i < w * h; i++) {
    const m = mask[i];
    if (m <= 0) continue;
    const o = i * 4;
    const lum = 0.299 * px[o] + 0.587 * px[o + 1] + 0.114 * px[o + 2];
    // clamp before pow: pixels outside the percentile range would give NaN
    const c = sample(stops, Math.pow(Math.min(1, Math.max(0, (lum - lo) / (hi - lo))), 1.15));
    px[o] += (c[0] - px[o]) * m;
    px[o + 1] += (c[1] - px[o + 1]) * m;
    px[o + 2] += (c[2] - px[o + 2]) * m;
  }
  ctx.putImageData(data, 0, 0);
  const cutout = px[3] < 250;
  return canvas.toDataURL(cutout ? "image/png" : "image/jpeg", 0.9);
}

/** Recoloured copy of `src` in `finishId` (data URL), or null if the photo can't be separated. */
export function recolor(src: string, finishId: string): Promise<string | null> {
  const key = `${src}|${finishId}`;
  let job = cache.get(key);
  if (!job) {
    job = paint(src, finishId).catch((err) => {
      console.warn(`Colour preview failed for ${src}`, err);
      return null;
    });
    cache.set(key, job);
  }
  return job;
}
