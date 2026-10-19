"use client";

import { motion, useScroll, useSpring } from "motion/react";

/** Thin gold bar across the top of the page showing how far you've scrolled. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 40, mass: 0.3 });
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[45] h-[2px] origin-left bg-gradient-to-r from-accent-3 via-accent to-accent-2"
      style={{ scaleX }}
    />
  );
}
