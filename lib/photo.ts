/**
 * A photo scaled down to at most `max` px on its longest side, as JPEG bytes:
 * phones take huge photos, and the site only needs a fraction of that.
 * Transparent images get a white background (JPEG has no transparency).
 */
export async function resizePhoto(file: File, max = 1600, quality = 0.85): Promise<Uint8Array<ArrayBuffer>> {
  const bitmap = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bitmap.width * k);
  c.height = Math.round(bitmap.height * k);
  const g = c.getContext("2d")!;
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, c.width, c.height);
  g.drawImage(bitmap, 0, 0, c.width, c.height);
  const blob = await new Promise<Blob>((res) => c.toBlob((b) => res(b!), "image/jpeg", quality));
  return new Uint8Array(await blob.arrayBuffer());
}

/** Bytes as base64 (for JSON uploads). */
export function toBase64(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
