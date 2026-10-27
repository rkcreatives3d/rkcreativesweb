import type { Finish, FinishKind, Product, Size } from "@/lib/products";
import type shopData from "@/content/shop.json";
import type { Review } from "@/lib/content";

// Pure helpers for the owner page: the editable content, new ids, colour
// materials, photo resizing, and a plain-English list of what changed.

export type Shop = typeof shopData;
export type Content = { products: Product[]; finishes: Finish[]; shop: Shop; renders: Record<string, string[]>; reviews: Review[] };

/** A review waiting on the inbox branch for the owner's decision. */
export type InboxReview = Review & { id: string; photo?: boolean; photoUrl?: string; photoBytes?: Uint8Array<ArrayBuffer> };

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "item";

export function uniqueId(base: string, taken: Iterable<string>) {
  const used = new Set(taken);
  let id = slugify(base);
  for (let n = 2; used.has(id); n++) id = `${slugify(base)}-${n}`;
  return id;
}

/** Occasion tags the shop filters by (lib/occasions.ts), with labels for the owner. */
export const TAGS = [
  ["bestseller", "Bestseller"],
  ["gift", "Gift"],
  ["birthday", "Birthday"],
  ["festive", "Diwali & festive"],
  ["desk", "For the desk"],
  ["car", "Car & keys"],
] as const;

export const SHAPES = ["vase", "knot", "lattice", "gear", "planter", "mobius", "serpent", "crystal", "saturn", "stand", "keychain", "nameplate"] as const;

export function newSize(taken: Size[]): Size {
  const labels = ["Small", "Medium", "Large", "Extra large"];
  const ids = ["S", "M", "L", "XL"];
  const i = taken.length;
  const id = ids[i] && !taken.some((s) => s.id === ids[i]) ? ids[i] : uniqueId(`size-${i + 1}`, taken.map((s) => s.id));
  return { id, label: labels[i] ?? `Size ${i + 1}`, dims: "", priceDelta: 0 };
}

export function newProduct(name: string, taken: string[], finishes: Finish[], category: string): Product {
  return {
    slug: uniqueId(name, taken),
    name,
    tagline: "",
    description: "",
    price: 499,
    category,
    shape: "vase",
    finishes: finishes.slice(0, Math.min(3, finishes.length)).map((f) => f.id),
    sizes: [{ id: "S", label: "Small", dims: "", priceDelta: 0 }],
    material: "PLA",
    printTime: "",
    tags: [],
    hidden: true, // new products start hidden until the owner switches them on
  };
}

// ── colours ──

function shade(hex: string, amount: number) {
  const n = parseInt(hex.replace("#", "").padEnd(6, "0").slice(0, 6), 16);
  const ch = (v: number) => Math.round(amount >= 0 ? v + (255 - v) * amount : v * (1 + amount));
  const r = ch(n >> 16), g = ch((n >> 8) & 255), b = ch(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** A filament from a name, a colour and how it looks; the material settings follow from the look. */
export function makeFinish(id: string, name: string, color: string, kind: FinishKind): Finish {
  const look = {
    matte: { metalness: 0, roughness: 0.62, clearcoat: 0.12 },
    silk: { metalness: 0.9, roughness: 0.25, clearcoat: 0.55 },
    glossy: { metalness: 0.3, roughness: 0.25, clearcoat: 1 },
  }[kind];
  return {
    id,
    name,
    kind,
    color,
    swatch: kind === "matte" ? color : `linear-gradient(135deg, ${shade(color, 0.25)}, ${color} 60%)`,
    ...look,
    iridescence: 0,
    emissive: "#000000",
    emissiveIntensity: 0,
  };
}

// ── photos ──

export { resizePhoto } from "@/lib/photo";

// ── what changed ──

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export function summarize(before: Content, after: Content, uploads: { path: string }[], modelsChanged: string[]): string[] {
  const out: string[] = [];
  const old = new Map(before.products.map((p) => [p.slug, p]));
  const now = new Map(after.products.map((p) => [p.slug, p]));
  for (const p of after.products) {
    const o = old.get(p.slug);
    if (!o) {
      out.push(`New product: ${p.name}${p.hidden ? " (hidden)" : ""}`);
      continue;
    }
    const bits: string[] = [];
    if (o.price !== p.price) bits.push(`price ${rupees(o.price)} → ${rupees(p.price)}`);
    if (!!o.hidden !== !!p.hidden) bits.push(p.hidden ? "hidden from the shop" : "shown in the shop");
    if (o.name !== p.name) bits.push(`renamed from “${o.name}”`);
    if (JSON.stringify(o.sizes) !== JSON.stringify(p.sizes)) bits.push("sizes");
    if (JSON.stringify(o.finishes) !== JSON.stringify(p.finishes)) bits.push("colours");
    if (o.cover !== p.cover) bits.push(p.cover ? "cover photo" : "cover photo removed");
    if (JSON.stringify(o.images ?? []) !== JSON.stringify(p.images ?? [])) bits.push("photos");
    if (modelsChanged.includes(p.slug)) bits.push("3D model");
    const rest = { ...o, price: 0, hidden: false, name: "", sizes: [], finishes: [], images: [], cover: "", coverSmall: "" };
    const restNow = { ...p, price: 0, hidden: false, name: "", sizes: [], finishes: [], images: [], cover: "", coverSmall: "" };
    if (JSON.stringify(rest) !== JSON.stringify(restNow)) bits.push("details");
    if (bits.length) out.push(`${p.name}: ${bits.join(", ")}`);
  }
  for (const o of before.products) if (!now.has(o.slug)) out.push(`Deleted: ${o.name}`);
  const order = (c: Content) => c.products.map((p) => p.slug).filter((s) => old.has(s) && now.has(s)).join();
  if (order(before) !== order(after)) out.push("Shop order changed");
  if (JSON.stringify(before.finishes) !== JSON.stringify(after.finishes)) out.push("Colours updated");
  if (JSON.stringify(before.shop) !== JSON.stringify(after.shop)) out.push("Shop settings updated");
  const oldIds = new Set(before.reviews.map((r) => r.id));
  const newIds = new Set(after.reviews.map((r) => r.id));
  const added = after.reviews.filter((r) => !oldIds.has(r.id)).length;
  const removed = before.reviews.filter((r) => !newIds.has(r.id)).length;
  if (added) out.push(`${added} review${added === 1 ? "" : "s"} approved`);
  if (removed) out.push(`${removed} review${removed === 1 ? "" : "s"} removed`);
  const photos = uploads.filter((u) => u.path.startsWith("public/products/")).length;
  if (photos) out.push(`${photos} new photo${photos === 1 ? "" : "s"}`);
  return out;
}
