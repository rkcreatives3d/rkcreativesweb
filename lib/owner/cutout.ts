import { canvasBytes, drawShadow, drawStage } from "./stage";

// Cleans up a product photo: finds the product (U²-Net "u2netp", a small open
// model, Apache-2.0, in public/vendor), cuts it out, and sets it on the shop's
// stage with a soft shadow, square. Runs on the owner's device; the 5 MB model
// and the ONNX runtime download the first time it's used.

const MODEL = "/vendor/u2netp.onnx";
const WASM = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/";
const IN = 320; // the model's input size
const WORK = 1600; // working size for the cut-out
const LOW = 160; // size of the coarse colour maps in refineEdges

type Ort = typeof import("onnxruntime-web/wasm");
let loading: Promise<{ ort: Ort; session: import("onnxruntime-web/wasm").InferenceSession }> | null = null;

function load() {
  loading ??= (async () => {
    const ort = await import("onnxruntime-web/wasm");
    ort.env.wasm.wasmPaths = WASM;
    ort.env.wasm.numThreads = 1; // threads need cross-origin isolation; one is plenty for a photo
    const session = await ort.InferenceSession.create(MODEL, { executionProviders: ["wasm"] });
    return { ort, session };
  })().catch((e) => {
    loading = null;
    throw e;
  });
  return loading;
}

const canvas = (w: number, h: number) => Object.assign(document.createElement("canvas"), { width: w, height: h });
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * The product on the shop's stage, as JPEG bytes (`size` px square). With
 * `transparent`, just the product and its floor shadow, as a WebP with a
 * transparent background (for the home page cover, which has its own backdrop).
 * Throws if no product is found.
 */
export async function cleanBackground(photo: Blob, size = 1200, transparent = false): Promise<Uint8Array<ArrayBuffer>> {
  const bmp = await createImageBitmap(photo);
  const W = bmp.width;
  const H = bmp.height;

  // 1. what the model sees: 320×320, scaled to 0..1 by the brightest value, then ImageNet-normalised
  const small = canvas(IN, IN);
  const sg = small.getContext("2d", { willReadFrequently: true })!;
  sg.drawImage(bmp, 0, 0, IN, IN);
  const px = sg.getImageData(0, 0, IN, IN).data;
  let max = 1;
  for (let i = 0; i < px.length; i += 4) max = Math.max(max, px[i], px[i + 1], px[i + 2]);
  const mean = [0.485, 0.456, 0.406];
  const std = [0.229, 0.224, 0.225];
  const input = new Float32Array(3 * IN * IN);
  for (let i = 0; i < IN * IN; i++)
    for (let c = 0; c < 3; c++) input[c * IN * IN + i] = (px[i * 4 + c] / max - mean[c]) / std[c];

  // 2. the model's guess of where the product is, 0..1 per pixel
  const { ort, session } = await load();
  const out = await session.run({ [session.inputNames[0]]: new ort.Tensor("float32", input, [1, 3, IN, IN]) });
  const pred = out[session.outputNames[0]].data as Float32Array;
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of pred) {
    lo = Math.min(lo, v);
    hi = Math.max(hi, v);
  }

  // 3. as an alpha mask (edges firmed up a little), keeping only the product: the biggest
  //    connected shape (reflections and bits of furniture nearby are dropped), then scaled up
  const alpha = new Float32Array(IN * IN);
  for (let i = 0; i < IN * IN; i++) alpha[i] = smooth(0.25, 0.75, (pred[i] - lo) / (hi - lo || 1));
  const keep = largestBlob(alpha);
  const m = canvas(IN, IN);
  const mg = m.getContext("2d")!;
  const md = mg.createImageData(IN, IN);
  let covered = 0;
  for (let i = 0; i < IN * IN; i++) {
    const a = keep[i] ? alpha[i] : 0;
    md.data[i * 4 + 3] = Math.round(a * 255);
    covered += a;
  }
  const share = covered / (IN * IN);
  if (share < 0.02 || share > 0.92) throw new Error(`no clear product in this photo (covers ${Math.round(share * 100)}%)`);
  mg.putImageData(md, 0, 0);
  // worked on at up to 1600 px: plenty for the 1200 px result, and quick on a phone
  const ks = Math.min(1, WORK / Math.max(W, H));
  const WW = Math.round(W * ks);
  const HH = Math.round(H * ks);
  const cut = canvas(WW, HH);
  const cg = cut.getContext("2d", { willReadFrequently: true })!;
  cg.imageSmoothingQuality = "high";
  cg.drawImage(bmp, 0, 0, WW, HH);
  const big = canvas(WW, HH);
  const bgx = big.getContext("2d", { willReadFrequently: true })!;
  bgx.imageSmoothingQuality = "high";
  bgx.drawImage(m, 0, 0, WW, HH);
  const photoPx = cg.getImageData(0, 0, WW, HH);
  refineEdges(photoPx, bgx.getImageData(0, 0, WW, HH).data, cut, m);
  cg.putImageData(photoPx, 0, 0);

  // 4. the product's bounds (from the mask, in working pixels)
  let x0 = IN, y0 = IN, x1 = 0, y1 = 0;
  for (let y = 0; y < IN; y++)
    for (let x = 0; x < IN; x++)
      if (md.data[(y * IN + x) * 4 + 3] > 40) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
  const bx = (x0 / IN) * WW, by = (y0 / IN) * HH, bw = ((x1 - x0 + 1) / IN) * WW, bh = ((y1 - y0 + 1) / IN) * HH;

  // 5. on the stage: fitted to 76% of the frame, standing on a soft shadow
  const sq = canvas(size, size);
  const g = sq.getContext("2d")!;
  if (!transparent) drawStage(g, size);
  const k = Math.min((size * 0.76) / bw, (size * 0.76) / bh);
  const dw = bw * k, dh = bh * k;
  const dx = (size - dw) / 2;
  const dy = size * 0.86 - dh;
  drawShadow(g, size / 2, size * 0.86, Math.max(dw * 0.42, size * 0.12), size * 0.035);
  g.imageSmoothingQuality = "high";
  g.drawImage(cut, bx, by, bw, bh, dx, dy, dw, dh);
  return transparent ? canvasBytes(sq, "image/webp", 0.9) : canvasBytes(sq, "image/jpeg", 0.88);
}

/**
 * Sharpens the model's soft mask with the photo's own colours (a simple local
 * matting step), and writes the result into `px` as its alpha:
 * - near every pixel, the typical background colour (from pixels the mask
 *   calls background) and product colour (from pixels it calls product)
 * - where those two clearly differ, pixels that look like the background go:
 *   bits of wall seen through gaps (between arms, under handles), which the
 *   coarse mask covers over. Where they don't differ (a black base on a dark
 *   counter), the mask is trusted as it is.
 * - soft edge pixels have the background's colour taken out of them, so no
 *   light (or dark) fringe from the old background shows on the stage.
 */
function refineEdges(px: ImageData, maskPx: Uint8ClampedArray, photo: HTMLCanvasElement, mask: HTMLCanvasElement) {
  const { width: W, height: H, data } = px;
  // coarse maps, LOW px on the long side
  const lw = W >= H ? LOW : Math.max(1, Math.round((LOW * W) / H));
  const lh = W >= H ? Math.max(1, Math.round((LOW * H) / W)) : LOW;
  const read = (src: HTMLCanvasElement) => {
    const c = canvas(lw, lh);
    const g = c.getContext("2d", { willReadFrequently: true })!;
    g.imageSmoothingQuality = "high";
    g.drawImage(src, 0, 0, lw, lh);
    return g.getImageData(0, 0, lw, lh).data;
  };
  const cs = read(photo);
  const as = read(mask);
  const n = lw * lh;
  // weighted colour sums for "background" and "product" pixels, then blurred: local averages
  const bw = new Float32Array(n), fw = new Float32Array(n);
  const bc = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
  const fc = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
  for (let i = 0; i < n; i++) {
    const a = as[i * 4 + 3] / 255;
    const isB = a < 0.03 ? 1 : 0, isF = a > 0.97 ? 1 : 0;
    bw[i] = isB;
    fw[i] = isF;
    for (let c = 0; c < 3; c++) {
      bc[c][i] = cs[i * 4 + c] * isB;
      fc[c][i] = cs[i * 4 + c] * isF;
    }
  }
  for (const [arr, r] of [[bw, 10], ...bc.map((x) => [x, 10] as const), [fw, 4], ...fc.map((x) => [x, 4] as const)] as const)
    for (let pass = 0; pass < 3; pass++) boxBlur(arr, lw, lh, r);

  // per full-size pixel, sampled bilinearly from the coarse maps
  const sx = lw / W, sy = lh / H;
  for (let y = 0; y < H; y++) {
    const fy = Math.min(lh - 1, Math.max(0, (y + 0.5) * sy - 0.5));
    const y0 = Math.floor(fy), y1 = Math.min(lh - 1, y0 + 1), ty = fy - y0;
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const A = maskPx[i * 4 + 3] / 255;
      if (A === 0) {
        data[i * 4 + 3] = 0;
        continue;
      }
      const fx = Math.min(lw - 1, Math.max(0, (x + 0.5) * sx - 0.5));
      const x0 = Math.floor(fx), x1 = Math.min(lw - 1, x0 + 1), tx = fx - x0;
      const k00 = y0 * lw + x0, k01 = y0 * lw + x1, k10 = y1 * lw + x0, k11 = y1 * lw + x1;
      const at = (arr: Float32Array) =>
        (arr[k00] * (1 - tx) + arr[k01] * tx) * (1 - ty) + (arr[k10] * (1 - tx) + arr[k11] * tx) * ty;
      const wb = at(bw), wf = at(fw);
      const B = [0, 0, 0], F = [0, 0, 0];
      let dd = 0, dot = 0;
      for (let c = 0; c < 3; c++) {
        B[c] = at(bc[c]) / Math.max(wb, 1e-6);
        F[c] = at(fc[c]) / Math.max(wf, 1e-6);
        const d = B[c] - F[c];
        dd += d * d;
        dot += (data[i * 4 + c] - F[c]) * d;
      }
      // how far from the product's colour towards the background's (0 = product, 1 = background)
      const t = dot / Math.max(dd, 1);
      const trust = smooth(50, 90, Math.sqrt(dd)) * smooth(0.003, 0.02, wb) * smooth(0.02, 0.08, wf);
      const a = A * (1 - trust + trust * (1 - smooth(0.5, 0.85, t)));
      // take the background's colour out of soft edge pixels
      if (a > 0.02 && a < 0.98 && wb > 0.02)
        for (let c = 0; c < 3; c++) data[i * 4 + c] = (data[i * 4 + c] - (1 - a) * B[c]) / a;
      data[i * 4 + 3] = Math.round(a * 255);
    }
  }
}

/** In-place box blur of radius r (three passes come close to a Gaussian). */
function boxBlur(a: Float32Array, w: number, h: number, r: number) {
  const tmp = new Float32Array(Math.max(w, h));
  const run = (len: number, get: (i: number) => number, set: (i: number, v: number) => void) => {
    let sum = 0;
    for (let i = -r; i <= r; i++) sum += get(Math.min(len - 1, Math.max(0, i)));
    for (let i = 0; i < len; i++) {
      tmp[i] = sum / (2 * r + 1);
      sum += get(Math.min(len - 1, i + r + 1)) - get(Math.max(0, i - r));
    }
    for (let i = 0; i < len; i++) set(i, tmp[i]);
  };
  for (let y = 0; y < h; y++) run(w, (i) => a[y * w + i], (i, v) => (a[y * w + i] = v));
  for (let x = 0; x < w; x++) run(h, (i) => a[i * w + x], (i, v) => (a[i * w + x] = v));
}

/** Pixels of the largest connected region (alpha > 0.5), grown by 2 px so soft edges stay. */
function largestBlob(alpha: Float32Array): Uint8Array {
  const label = new Int32Array(IN * IN);
  let best = 0;
  let bestSize = 0;
  let next = 0;
  const stack: number[] = [];
  for (let start = 0; start < IN * IN; start++) {
    if (label[start] || alpha[start] <= 0.5) continue;
    next++;
    let size = 0;
    stack.push(start);
    label[start] = next;
    while (stack.length) {
      const i = stack.pop()!;
      size++;
      const x = i % IN;
      for (const j of [i - 1, i + 1, i - IN, i + IN]) {
        if (j < 0 || j >= IN * IN || label[j] || alpha[j] <= 0.5) continue;
        if ((j === i - 1 && x === 0) || (j === i + 1 && x === IN - 1)) continue;
        label[j] = next;
        stack.push(j);
      }
    }
    if (size > bestSize) {
      bestSize = size;
      best = next;
    }
  }
  const keep = new Uint8Array(IN * IN);
  for (let i = 0; i < IN * IN; i++) if (label[i] === best) keep[i] = 1;
  // grow by 2 px
  for (let pass = 0; pass < 2; pass++) {
    const grown = keep.slice();
    for (let i = 0; i < IN * IN; i++) {
      if (keep[i]) continue;
      const x = i % IN;
      if ((x > 0 && keep[i - 1]) || (x < IN - 1 && keep[i + 1]) || keep[i - IN] || keep[i + IN]) grown[i] = 1;
    }
    keep.set(grown);
  }
  return keep;
}
