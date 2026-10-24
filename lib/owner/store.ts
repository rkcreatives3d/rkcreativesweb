import { create } from "zustand";
import type { Finish, Product } from "@/lib/products";
import type { Content, InboxReview, Shop } from "./edit";

// The owner page's working copy. Nothing reaches the website until "Publish":
// edits change `draft`; photos and 3D files wait in `uploads` / `models`.

export const TOKEN_KEY = "rk-owner-token";

export type Upload = { bytes: Uint8Array<ArrayBuffer>; url: string };
/** a 3D file picked for a product, or null = remove its model */
export type ModelChange = { bytes: Uint8Array<ArrayBuffer>; ext: string; url: string; name: string } | null;

type OwnerState = {
  token: string;
  login: string;
  /** false: signed in with the password, but the host has no GitHub key yet, so Publish can't save */
  canPublish: boolean;
  original: Content | null;
  draft: Content | null;
  /** blob shas of the content files when loaded, to notice edits made elsewhere */
  shas: Record<string, string>;
  /** new photos, by their public path ("/products/<slug>/…") */
  uploads: Record<string, Upload>;
  models: Record<string, ModelChange>;
  /** reviews waiting for approval (null until loaded) */
  inbox: InboxReview[] | null;
  /** inbox reviews decided (approved or rejected): taken out of the inbox on publish */
  inboxDone: string[];
  signIn: (token: string, login: string) => void;
  setInbox: (inbox: InboxReview[] | null) => void;
  approveReview: (r: InboxReview) => void;
  rejectReview: (id: string) => void;
  removeReview: (id: string) => void;
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
  canPublish: true,
  original: null,
  draft: null,
  shas: {},
  uploads: {},
  models: {},
  inbox: null,
  inboxDone: [],
  signIn: (token, login) => set({ token, login }),
  setInbox: (inbox) => set({ inbox }),
  approveReview: (r) => {
    const image = r.photoBytes ? `/reviews/${r.id}.jpg` : undefined;
    if (r.photoBytes && image) get().addUpload(image, r.photoBytes);
    const review = { id: r.id, name: r.name, city: r.city, product: r.product, rating: r.rating, text: r.text, date: r.date, image };
    set((s) => ({
      draft: s.draft && { ...s.draft, reviews: [JSON.parse(JSON.stringify(review)), ...s.draft.reviews] },
      inboxDone: [...s.inboxDone, r.id],
    }));
  },
  rejectReview: (id) => set((s) => ({ inboxDone: [...s.inboxDone, id] })),
  removeReview: (id) => set((s) => ({ draft: s.draft && { ...s.draft, reviews: s.draft.reviews.filter((r) => r.id !== id) } })),
  signOut: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {}
    set({ token: "", login: "", original: null, draft: null, uploads: {}, models: {}, inbox: null, inboxDone: [] });
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
          // swap with the nearest product in the same domain: that's the order customers see in it
          const i = ps.findIndex((p) => p.slug === slug);
          if (i < 0) return ps;
          let j = i + by;
          while (j >= 0 && j < ps.length && ps[j].category !== ps[i].category) j += by;
          if (j < 0 || j >= ps.length) return ps;
          const next = [...ps];
          [next[i], next[j]] = [next[j], next[i]];
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
  published: () =>
    set((s) => ({
      original: structuredClone(s.draft),
      uploads: {},
      models: {},
      inbox: s.inbox && s.inbox.filter((r) => !s.inboxDone.includes(r.id)),
      inboxDone: [],
    })),
  discard: () => set((s) => ({ draft: structuredClone(s.original), uploads: {}, models: {}, inboxDone: [] })),
}));

/** Unpublished changes? */
export function isDirty() {
  const s = useOwner.getState();
  return (
    !!s.draft &&
    (JSON.stringify(s.draft) !== JSON.stringify(s.original) || Object.keys(s.uploads).length > 0 || Object.keys(s.models).length > 0 || s.inboxDone.length > 0)
  );
}

/** Where to show a photo from: a new upload (blob URL) or the published site. */
export const photoSrc = (path: string) => useOwner.getState().uploads[path]?.url ?? path;
