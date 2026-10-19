"use client";

import { motion, useScroll, useSpring, useTransform, useVelocity } from "motion/react";
import { Marquee } from "../ui";

/** Two crossing ticker bands that lean into the direction you scroll. */
export function MarqueeStrip() {
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 300 });
  const skew = useTransform(velocity, [-2500, 2500], [7, -7], { clamp: true });
  const skewBack = useTransform(skew, (s) => -s);

  return (
    <div className="relative z-20 -my-6 py-10" aria-label="Materials and services">
      <motion.div style={{ skewX: skew }}>
        <div className="-rotate-2 scale-105 holo-pan py-3 text-[var(--on-grad)]">
          <Marquee
            className="font-display text-2xl font-extrabold display-case tracking-tight sm:text-4xl"
            items={["Custom prints", "Unique gifts", "Endless ideas", "Printed to order", "Hand finished"]}
          />
        </div>
      </motion.div>
      <motion.div style={{ skewX: skewBack }}>
        <div className="rotate-1 scale-105 border-y border-fg/15 bg-page py-3">
          <Marquee
            reverse
            className="font-display text-2xl font-extrabold display-case tracking-tight text-outline sm:text-4xl"
            items={["Bring ideas to life", "Silk PLA · PETG", "0.12 mm layers", "Gift ready", "Made in small batches"]}
          />
        </div>
      </motion.div>
    </div>
  );
}
