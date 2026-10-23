import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Two small lists kept in this browser only (no account needed):
// products the visitor saved with the heart, and the ones they looked at.

const MAX_RECENT = 8;

type ShelfState = {
  saved: string[];
  recent: string[];
  toggleSaved: (slug: string) => void;
  viewed: (slug: string) => void;
};

export const useShelf = create<ShelfState>()(
  persist(
    (set) => ({
      saved: [],
      recent: [],
      toggleSaved: (slug) => set((s) => ({ saved: s.saved.includes(slug) ? s.saved.filter((x) => x !== slug) : [slug, ...s.saved] })),
      viewed: (slug) => set((s) => ({ recent: [slug, ...s.recent.filter((x) => x !== slug)].slice(0, MAX_RECENT) })),
    }),
    {
      name: "rk-shelf",
      storage: createJSONStorage(() => window.localStorage),
      // rehydrated on the client in <Providers>, so the server and first client render match
      skipHydration: true,
    },
  ),
);
