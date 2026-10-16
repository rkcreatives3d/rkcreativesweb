import { create } from "zustand";

/** Whether the opening print animation has finished (or was skipped). */
export const useIntro = create<{ done: boolean; finish: () => void }>((set) => ({
  done: false,
  finish: () => set({ done: true }),
}));
