// Types for mesh-core.mjs (plain JS so the Node build script can use it too).
import type { BufferGeometry } from "three";

export type TriangleSoup = { positions: Float32Array | ArrayLike<number>; zUp: boolean };
export const MODEL_EXTENSIONS: string[];
export function parseModel(buf: Uint8Array, ext: string): TriangleSoup;
export function fromSTL(buf: Uint8Array): TriangleSoup;
export function fromOBJ(text: string): TriangleSoup;
export function from3MF(buf: Uint8Array): TriangleSoup;
export function toGeometry(soup: TriangleSoup): BufferGeometry;
export function toGLB(geo: BufferGeometry): Uint8Array<ArrayBuffer>;
