import { create } from "zustand";

/** A short confirmation at the bottom of the screen, e.g. "Added to cart". One at a time. */
export type Toast = { id: number; title: string; detail?: string; image?: string; cart?: boolean };

export const useToast = create<{ toast: Toast | null; show: (t: Omit<Toast, "id">) => void; hide: () => void }>((set) => ({
  toast: null,
  show: (t) => set({ toast: { ...t, id: Date.now() } }),
  hide: () => set({ toast: null }),
}));
