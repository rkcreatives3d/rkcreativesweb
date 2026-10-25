import type { Product } from "@/lib/products";
import type { Content } from "./edit";
import type { ModelChange, Upload } from "./store";
import { listFiles, type FileChange } from "./github";
import { PATHS } from "./repo";

// Turning the owner's working copy into one commit: which studio pictures to
// (re)make, which files to write, which to delete.

export type RenderJob = { product: Product; modelUrl?: string; finishes: string[] };
export type ShotFiles = { finish: string; large: Uint8Array; small: Uint8Array; xl?: Uint8Array; cover?: Uint8Array };

const json = (v: unknown) => JSON.stringify(v, null, 2) + "\n";
/** Largest piece of a 3D file sent in one request (base64 makes it a third bigger: still under 4.5 MB). */
export const PART_BYTES = 3_000_000;
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Products whose studio pictures are missing or out of date, and the colours to take. */
export function renderJobs(original: Content, draft: Content, models: Record<string, ModelChange>, publishedModel: (p: Product) => string | undefined): RenderJob[] {
  const oldFinish = new Map(original.finishes.map((f) => [f.id, f]));
  const restyled = new Set(draft.finishes.filter((f) => oldFinish.has(f.id) && !same(oldFinish.get(f.id), f)).map((f) => f.id));
  const jobs: RenderJob[] = [];
  for (const p of draft.products) {
    const change = models[p.slug];
    const modelUrl = change === undefined ? publishedModel(p) : (change?.url ?? undefined);
    // photos-only products show their photos everywhere; no pictures needed
    if (!modelUrl && p.images?.length) continue;
    const have = draft.renders[p.slug] ?? [];
    const finishes = change !== undefined ? p.finishes : p.finishes.filter((f) => !have.includes(f) || restyled.has(f));
    if (finishes.length) jobs.push({ product: p, modelUrl, finishes });
  }
  return jobs;
}

/** Photo paths a product uses. */
const photosOf = (p: Product) => [...(p.images ?? []), ...(p.scalePhoto ? [p.scalePhoto] : []), ...Object.values(p.colorPhotos ?? {}).flat()].filter(Boolean) as string[];

export async function buildChanges(
  token: string,
  original: Content,
  draft: Content,
  uploads: Record<string, Upload>,
  models: Record<string, ModelChange>,
  shots: Record<string, ShotFiles[]>,
): Promise<{ changes: FileChange[]; content: Content }> {
  const changes: FileChange[] = [];
  const renders = structuredClone(draft.renders);
  const live = new Set(draft.products.map((p) => p.slug));

  // studio pictures
  for (const [slug, list] of Object.entries(shots)) {
    const p = draft.products.find((x) => x.slug === slug);
    if (!p) continue;
    for (const s of list) {
      changes.push({ path: `public/renders/${slug}/${s.finish}.webp`, content: s.large });
      changes.push({ path: `public/renders/${slug}/${s.finish}-sm.webp`, content: s.small });
      if (s.xl && s.finish === p.finishes[0]) changes.push({ path: `public/renders/${slug}/${s.finish}-xl.webp`, content: s.xl });
      if (s.cover && s.finish === p.finishes[0]) changes.push({ path: `public/renders/${slug}/cover.jpg`, content: s.cover });
    }
    renders[slug] = [...new Set([...(renders[slug] ?? []), ...list.map((s) => s.finish)])].filter((f) => p.finishes.includes(f));
  }

  // deleted products: everything of theirs goes
  const gone = original.products.filter((p) => !live.has(p.slug)).map((p) => p.slug);
  for (const slug of gone) delete renders[slug];
  const prefixes = [
    ...gone.flatMap((s) => [`models/${s}.`, `public/products/${s}/`, `public/renders/${s}/`]),
    ...Object.keys(models)
      .filter((s) => live.has(s))
      .map((s) => `models/${s}.`),
  ];
  const existing = prefixes.length ? await listFiles(token, prefixes) : [];
  for (const path of existing) changes.push({ path, delete: true });

  // new or removed 3D files (the build turns models/<slug>.<ext> into the web model).
  // Big files go in pieces (<slug>.<ext>.part1, .part2 …) that the build joins back
  // together: some hosts (Vercel) take at most 4.5 MB per request to the sign-in server.
  for (const [slug, m] of Object.entries(models)) {
    if (!m || !live.has(slug)) continue;
    if (m.bytes.length <= PART_BYTES) changes.push({ path: `models/${slug}.${m.ext}`, content: m.bytes });
    else
      for (let i = 0, n = 1; i < m.bytes.length; i += PART_BYTES, n++)
        changes.push({ path: `models/${slug}.${m.ext}.part${n}`, content: m.bytes.subarray(i, i + PART_BYTES) });
  }

  // photos: new ones still in use are written; owner-uploaded ones no longer used are deleted
  const cover = (c: Content) => (c.shop.home?.heroImage ? [c.shop.home.heroImage] : []);
  const used = new Set([...draft.products.flatMap(photosOf), ...draft.reviews.flatMap((r) => (r.image ? [r.image] : [])), ...cover(draft)]);
  for (const [path, u] of Object.entries(uploads)) if (used.has(path)) changes.push({ path: `public${path}`, content: u.bytes });
  for (const p of original.products) {
    if (!live.has(p.slug)) continue;
    for (const path of photosOf(p)) if (!used.has(path) && path.startsWith(`/products/${p.slug}/`)) changes.push({ path: `public${path}`, delete: true });
  }

  // a replaced or removed home page cover photo goes
  for (const path of cover(original)) if (!used.has(path) && path.startsWith("/home/")) changes.push({ path: `public${path}`, delete: true });

  // reviews taken off the site: their photos go too
  for (const r of original.reviews) if (r.image && !used.has(r.image) && r.image.startsWith("/reviews/")) changes.push({ path: `public${r.image}`, delete: true });

  const content: Content = { ...draft, renders };
  if (!same(original.products, content.products)) changes.push({ path: PATHS.products, content: json(content.products) });
  if (!same(original.finishes, content.finishes)) changes.push({ path: PATHS.finishes, content: json(content.finishes) });
  if (!same(original.shop, content.shop)) changes.push({ path: PATHS.shop, content: json(content.shop) });
  if (!same(original.renders, content.renders)) changes.push({ path: PATHS.renders, content: json(content.renders) });
  if (!same(original.reviews, content.reviews)) changes.push({ path: PATHS.reviews, content: json(content.reviews) });

  // a path written and deleted in the same commit: the write wins
  const written = new Set(changes.filter((c) => !("delete" in c)).map((c) => c.path));
  return { changes: changes.filter((c) => !("delete" in c) || !written.has(c.path)), content };
}
