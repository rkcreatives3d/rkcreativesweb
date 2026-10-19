"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

const ease = [0.76, 0, 0.24, 1] as const;

/**
 * After each in-site navigation, a black panel (with the logo) and an amber
 * panel lift off the new page. The first load is covered by the intro instead.
 */
export function PageTransition() {
  const pathname = usePathname();
  const first = useRef(true);
  const [run, setRun] = useState<number | null>(null);

  // layout effect: cover the new page before it paints
  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setRun(Date.now());
  }, [pathname]);

  if (run === null) return null;
  return (
    <div key={run} aria-hidden className="pointer-events-none fixed inset-0 z-[85]">
      <motion.div
        className="absolute inset-0 bg-accent"
        initial={{ y: "0%" }}
        animate={{ y: "-100%" }}
        transition={{ duration: 0.75, delay: 0.14, ease }}
        onAnimationComplete={() => setRun(null)}
      />
      <motion.div
        className="absolute inset-0 grid place-items-center bg-page"
        initial={{ y: "0%" }}
        animate={{ y: "-100%" }}
        transition={{ duration: 0.75, ease }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <motion.img
          src="/brand/logo-160.jpg"
          alt=""
          className="h-20 w-20 rounded-full ring-1 ring-accent/40"
          initial={{ scale: 0.85, opacity: 1 }}
          animate={{ scale: 1.1, opacity: 0 }}
          transition={{ duration: 0.45 }}
        />
      </motion.div>
    </div>
  );
}
