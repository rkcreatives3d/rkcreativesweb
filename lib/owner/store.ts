import { create } from "zustand";
import type { Finish, Product } from "@/lib/products";
import type { Content, Shop } from "./edit";

// The owner page's working copy. Nothing reaches the website until "Publish":
// edits change `draft`; photos and 3D files wait in `uploads` / `models`.

export const TOKEN_KEY = "rk-owner-token";

export type Upload = { bytes: Uint8Array<ArrayBuffer>; url: string };
/** a 3D file picked for a product, or null = remove its model */
export type ModelChange = { bytes: Uint8Array<ArrayBuffer>; ext: string; url: string; name: string } | null;

type OwnerState = {
  token: string;
  login: string;
  original: Content | null;
  draft: Content | null;
  /** blob shas of the content files when loaded, to notice edits made elsewhere */
  shas: Record<string, string>;
  /** new photos, by their public path ("/products/<slug>/…") */
  uploads: Record<string, Upload>;
  models: Record<string, ModelChange>;
  signIn: (token: string, login: string) => void;
  signOut: () => void;
  loaded: (content: Content, shas: Record<string, string>) => void;
  setProduct: (slug: string, p: Product) => void;
  addProduct: (p: Product) => void;
  removeProduct: (slug: string) => void;
  moveProduct: (slug: string, by: number) => void;
  setFinishes: (f: Finish[], products?: Product[]) => void;
  setShop: (s: Shop) => void;
  addUpload: (path: string, bytes: Uint8Array<ArrayBuffer>) => string;
  dropUpload: (path: string) => void;
  setModel: (slug: string, m: ModelChange) => void;
  undoModel: (slug: string) => void;
  published: () => void;
  discard: () => void;
};

const mapProducts = (d: Content, fn: (ps: Product[]) => Product[]): Content => ({ ...d, products: fn(d.products) });

export const useOwner = create<OwnerState>((set, get) => ({
  token: "",
  login: "",
  original: null,
  draft: null,
  shas: {},
  uploads: {},
  models: {},
  signIn: (token, login) => set({ token, login }),
  signOut: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {}
    set({ token: "", login: "", original: null, draft: null, uploads: {}, models: {} });
  },
  loaded: (content, shas) => set({ original: structuredClone(content), draft: structuredClone(content), shas, uploads: {}, models: {} }),
  setProduct: (slug, p) => set((s) => ({ draft: s.draft && mapProducts(s.draft, (ps) => ps.map((x) => (x.slug === slug ? p : x))) })),
  addProduct: (p) => set((s) => ({ draft: s.draft && mapProducts(s.draft, (ps) => [p, ...ps]) })),
  removeProduct: (slug) =>
    set((s) => {
      // photos and a 3D file picked for it but never published just go
      const uploads = Object.fromEntries(Object.entries(s.uploads).filter(([k]) => !k.startsWith(`/products/${slug}/`)));
      const models = { ...s.models };
      delete models[slug];
      return { draft: s.draft && mapProducts(s.draft, (ps) => ps.filter((x) => x.slug !== slug)), uploads, models };
    }),
  moveProduct: (slug, by) =>
    set((s) => ({
      draft:
        s.draft &&
        mapProducts(s.draft, (ps) => {
          const i = ps.findIndex((p) => p.slug === slug);
          const j = Math.max(0, Math.min(ps.length - 1, i + by));
          if (i < 0 || i === j) return ps;
          const next = [...ps];
          next.splice(j, 0, next.splice(i, 1)[0]);
          return next;
        }),
    })),
  setFinishes: (finishes, products) => set((s) => ({ draft: s.draft && { ...s.draft, finishes, products: products ?? s.draft.products } })),
  setShop: (shop) => set((s) => ({ draft: s.draft && { ...s.draft, shop } })),
  addUpload: (path, bytes) => {
    const url = URL.createObjectURL(new Blob([bytes], { type: "image/jpeg" }));
    set((s) => ({ uploads: { ...s.uploads, [path]: { bytes, url } } }));
    return url;
  },
  dropUpload: (path) =>
    set((s) => {
      const uploads = { ...s.uploads };
      if (uploads[path]) URL.revokeObjectURL(uploads[path].url);
      delete uploads[path];
      return { uploads };
    }),
  setModel: (slug, m) => set((s) => ({ models: { ...s.models, [slug]: m } })),
  undoModel: (slug) =>
    set((s) => {
      const models = { ...s.models };
      delete models[slug];
      return { models };
    }),
  published: () => set((s) => ({ original: structuredClone(s.draft), uploads: {}, models: {} })),
  discard: () => set((s) => ({ draft: structuredClone(s.original), uploads: {}, models: {} })),
}));

/** Unpublished changes? */
export function isDirty() {
  const s = useOwner.getState();
  return !!s.draft && (JSON.stringify(s.draft) !== JSON.stringify(s.original) || Object.keys(s.uploads).length > 0 || Object.keys(s.models).length > 0);
}

/** Where to show a photo from: a new upload (blob URL) or the published site. */
export const photoSrc = (path: string) => useOwner.getState().uploads[path]?.url ?? path;
