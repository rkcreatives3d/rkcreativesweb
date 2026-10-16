import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getProduct, unitPrice, type Product } from "./products";
import { site } from "./site";

export type CartItem = {
  key: string;
  slug: string;
  finish: string;
  size: string;
  qty: number;
  /** name / message to print on the item, if any */
  engraving?: string;
};

type CartState = {
  items: CartItem[];
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (item: Omit<CartItem, "key" | "qty">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const keyOf = (i: Pick<CartItem, "slug" | "finish" | "size" | "engraving">) =>
  `${i.slug}|${i.finish}|${i.size}|${i.engraving ?? ""}`;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      open: false,
      setOpen: (open) => set({ open }),
      add: (item, qty = 1) =>
        set((s) => {
          const clean = { ...item, engraving: item.engraving?.trim() || undefined };
          const key = keyOf(clean);
          const existing = s.items.find((i) => i.key === key);
          const items = existing
            ? s.items.map((i) => (i.key === key ? { ...i, qty: Math.min(99, i.qty + qty) } : i))
            : [...s.items, { ...clean, key, qty }];
          return { items };
        }),
      setQty: (key, qty) =>
        set((s) => ({
          items:
            qty <= 0
              ? s.items.filter((i) => i.key !== key)
              : s.items.map((i) => (i.key === key ? { ...i, qty: Math.min(99, qty) } : i)),
        })),
      remove: (key) => set((s) => ({ items: s.items.filter((i) => i.key !== key) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "layr-cart",
      storage: createJSONStorage(() => window.localStorage),
      partialize: (s) => ({ items: s.items }),
      // Rehydrated on the client in <Providers> so server and first client render match.
      skipHydration: true,
    },
  ),
);

/** Engraving add-on charged for this product, if any. */
export const engravingCharge = (p: Product, engraving?: string) =>
  engraving && p.personalisation === "optional" ? site.engravingPrice : 0;

export const itemPrice = (p: Product, size: string, engraving?: string) =>
  unitPrice(p, size) + engravingCharge(p, engraving);

export const lineTotal = (i: CartItem) => {
  const p = getProduct(i.slug);
  return p ? itemPrice(p, i.size, i.engraving) * i.qty : 0;
};

export const cartSubtotal = (items: CartItem[]) => items.reduce((sum, i) => sum + lineTotal(i), 0);

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.qty, 0);
