"use client";

import { AnimatePresence, motion } from "motion/react";
import { useLite } from "@/lib/lite";

/** Shown once when the site switches itself to Lite mode on a slow device. */
export function LiteNotice() {
  const { auto, set } = useLite();
  const dismiss = () => useLite.setState({ auto: false });
  return (
    <AnimatePresence>
      {auto && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-[calc(var(--tabbar-h,0px)+max(1.25rem,env(safe-area-inset-bottom)))] left-5 right-5 z-[60] mx-auto flex max-w-md items-center gap-4 rounded-xl border border-fg/10 bg-page-2/95 p-4 text-sm shadow-2xl backdrop-blur sm:right-auto"
        >
          <p className="flex-1 text-muted">
            <span className="font-semibold text-fg">Switched to Lite mode</span> for this visit, so the site runs smoothly on this device.
          </p>
          <button onClick={() => set(false)} className="shrink-0 font-semibold text-accent hover:underline">
            Use 3D
          </button>
          <button onClick={dismiss} aria-label="Dismiss" className="shrink-0 text-lg leading-none text-muted hover:text-fg">
            ×
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
