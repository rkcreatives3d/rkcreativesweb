import { canvasBytes, drawShadow, drawStage } from "./stage";

// Cleans up a product photo: finds the product (U²-Net "u2netp", a small open
// model, Apache-2.0, in public/vendor), cuts it out, and sets it on the shop's
// stage with a soft shadow, square. Runs on the owner's device; the 5 MB model
// and the ONNX runtime download the first time it's used.

const MODEL = "/vendor/u2netp.onnx";
const WASM = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/";
const IN = 320; // the model's input size

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

/** The product on the shop's stage, as JPEG bytes (`size` px square). Throws if no product is found. */
export async function cleanBackground(photo: Blob, size = 1200): Promise<Uint8Array<ArrayBuffer>> {
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
  const cut = canvas(W, H);
  const cg = cut.getContext("2d", { willReadFrequently: true })!;
  cg.drawImage(bmp, 0, 0);
  cg.globalCompositeOperation = "destination-in";
  cg.imageSmoothingQuality = "high";
  cg.drawImage(m, 0, 0, W, H);

  // 4. the product's bounds (from the mask, in photo pixels)
  let x0 = IN, y0 = IN, x1 = 0, y1 = 0;
  for (let y = 0; y < IN; y++)
    for (let x = 0; x < IN; x++)
      if (md.data[(y * IN + x) * 4 + 3] > 40) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
  const bx = (x0 / IN) * W, by = (y0 / IN) * H, bw = ((x1 - x0 + 1) / IN) * W, bh = ((y1 - y0 + 1) / IN) * H;

  // 5. on the stage: fitted to 76% of the frame, standing on a soft shadow
  const sq = canvas(size, size);
  const g = sq.getContext("2d")!;
  drawStage(g, size);
  const k = Math.min((size * 0.76) / bw, (size * 0.76) / bh);
  const dw = bw * k, dh = bh * k;
  const dx = (size - dw) / 2;
  const dy = size * 0.86 - dh;
  drawShadow(g, size / 2, size * 0.86, Math.max(dw * 0.42, size * 0.12), size * 0.035);
  g.imageSmoothingQuality = "high";
  g.drawImage(cut, bx, by, bw, bh, dx, dy, dw, dh);
  return canvasBytes(sq, "image/jpeg", 0.88);
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
