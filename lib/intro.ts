import { create } from "zustand";

/** layer counter shown during the opening animation */
export const INTRO_LAYERS = 240;

/** Whether the opening print animation has finished (or was skipped). */
export const useIntro = create<{ done: boolean; finish: () => void }>((set) => ({
  done: false,
  finish: () => set({ done: true }),
}));
