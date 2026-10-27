// A product's cover photo, kept as the owner took it: no cut-out, no crop, no
// colour change. Only what the website needs:
//   - the hidden data in a phone photo (where it was taken, the phone) is
//     removed, so a photo never gives away the owner's location;
//   - a photo too big for one upload (3 MB) is made smaller, nothing else;
//   - formats browsers can't show (an iPhone's HEIC) become JPEG;
//   - a small copy (900 px, the whole picture) for shop cards and thumbnails.

/** Most one request to the sign-in server can carry once base64'd (Vercel: 4.5 MB). */
export const RAW_MAX = 3_000_000;
const SMALL = 900;

export type RawCover = { bytes: Uint8Array<ArrayBuffer>; ext: "jpg" | "png" | "webp"; small: Uint8Array<ArrayBuffer>; notes: string[] };

const mb = (n: number) => `${(n / 1_000_000).toFixed(1)} MB`;

async function jpeg(bitmap: ImageBitmap, max: number, quality: number) {
  const k = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bitmap.width * k);
  c.height = Math.round(bitmap.height * k);
  const g = c.getContext("2d")!;
  g.fillStyle = "#ffffff"; // JPEG has no transparency
  g.fillRect(0, 0, c.width, c.height);
  g.drawImage(bitmap, 0, 0, c.width, c.height);
  const blob = await new Promise<Blob>((res) => c.toBlob((b) => res(b!), "image/jpeg", quality));
  return new Uint8Array(await blob.arrayBuffer());
}

/**
 * A JPEG without its metadata (EXIF: GPS position, camera; XMP), byte for byte
 * otherwise, so the picture is untouched. Also reports the EXIF orientation:
 * without it a sideways-stored photo would show sideways.
 */
export function stripJpegMetadata(src: Uint8Array<ArrayBuffer>): { bytes: Uint8Array<ArrayBuffer>; orientation: number } {
  if (src[0] !== 0xff || src[1] !== 0xd8) return { bytes: src, orientation: 1 };
  const keep: Uint8Array[] = [src.subarray(0, 2)];
  let orientation = 1;
  let i = 2;
  while (i + 4 <= src.length) {
    if (src[i] !== 0xff) return { bytes: src, orientation: 1 }; // not what we expected: leave it alone
    const marker = src[i + 1];
    if (marker === 0xff) {
      i++; // padding before a marker
      continue;
    }
    // start of the picture data: the rest goes as it is
    if (marker === 0xda) {
      keep.push(src.subarray(i));
      break;
    }
    const len = (src[i + 2] << 8) | src[i + 3];
    const seg = src.subarray(i, i + 2 + len);
    const head = String.fromCharCode(...seg.subarray(4, 33));
    if (marker === 0xe1 && head.startsWith("Exif\0")) orientation = readOrientation(seg.subarray(10)) ?? 1;
    // APP1 (EXIF, XMP) and comments go; everything else (incl. the colour profile) stays
    if (!(marker === 0xe1 || marker === 0xfe)) keep.push(seg);
    i += 2 + len;
  }
  const out = new Uint8Array(keep.reduce((n, s) => n + s.length, 0));
  let at = 0;
  for (const s of keep) {
    out.set(s, at);
    at += s.length;
  }
  return { bytes: out, orientation };
}

/** The orientation tag (0x0112) from a TIFF block, if it's there. */
function readOrientation(tiff: Uint8Array) {
  if (tiff.length < 8) return null;
  const little = tiff[0] === 0x49;
  const u16 = (p: number) => (little ? tiff[p] | (tiff[p + 1] << 8) : (tiff[p] << 8) | tiff[p + 1]);
  const u32 = (p: number) => (little ? u16(p) | (u16(p + 2) << 16) : (u16(p) << 16) | u16(p + 2)) >>> 0;
  const ifd = u32(4);
  if (ifd + 2 > tiff.length) return null;
  const n = u16(ifd);
  for (let k = 0; k < n; k++) {
    const e = ifd + 2 + k * 12;
    if (e + 12 > tiff.length) return null;
    if (u16(e) === 0x0112) return u16(e + 8);
  }
  return null;
}

/** The cover photo to upload, and its small copy. Throws if the browser can't open the file. */
export async function rawCover(file: File): Promise<RawCover> {
  const notes: string[] = [];
  const bitmap = await createImageBitmap(file); // also checks it's a picture this browser can open
  let bytes = new Uint8Array(await file.arrayBuffer());
  let ext: RawCover["ext"];
  if (file.type === "image/jpeg") {
    ext = "jpg";
    const clean = stripJpegMetadata(bytes);
    // stored sideways and turned by a tag: the tag goes with the rest of the metadata,
    // so the picture is saved the right way up instead (at top quality)
    bytes = clean.orientation > 1 ? await jpeg(bitmap, 1e9, 0.95) : clean.bytes;
  } else if (file.type === "image/png" || file.type === "image/webp") ext = file.type === "image/png" ? "png" : "webp";
  else {
    ext = "jpg";
    bytes = await jpeg(bitmap, 1e9, 0.92);
    notes.push(`Saved as JPEG (from ${file.type.replace("image/", "").toUpperCase() || "this format"}) so every browser can show it.`);
  }
  if (bytes.length > RAW_MAX) {
    const was = bytes.length;
    for (const max of [3200, 2600, 2048, 1600]) {
      bytes = await jpeg(bitmap, max, 0.9);
      ext = "jpg";
      if (bytes.length <= RAW_MAX) break;
    }
    notes.push(`Made smaller to fit the website (it was ${mb(was)}); the picture itself is the same.`);
  }
  const small = await jpeg(bitmap, SMALL, 0.85);
  bitmap.close();
  return { bytes, ext, small, notes };
}
