"use client";

import { View } from "@react-three/drei";
import { motion } from "motion/react";
import { HeroScene } from "../three/HeroScene";
import { Monogram } from "../Monogram";
import { ButtonLink } from "../ui";
import { products } from "@/lib/products";
import { site } from "@/lib/site";
import { useIntro } from "@/lib/intro";
import { useFull3D } from "@/lib/lite";

/** Cover page: the RK monogram in 3D with bestsellers orbiting it, and the shop's way in underneath. */
export function Hero() {
  const ready = useIntro((s) => s.done);
  const full3D = useFull3D();
  const show = (delay: number) => ({
    initial: { opacity: 0, y: 24 },
    animate: ready ? { opacity: 1, y: 0 } : undefined,
    transition: { delay, duration: 1, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <section className="relative h-[100svh] min-h-[620px] overflow-hidden [--mark-h:min(36svh,38vw)]">
      <h1 className="sr-only">
        {site.name}: {site.slogan}. {site.tagline}.
      </h1>
      <div className="pointer-events-none absolute left-1/2 top-[42%] h-[60vmin] w-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[120px]" />
      {/* flat monogram: in the page HTML so it shows instantly; fades out under the 3D one */}
      <div
        aria-hidden
        className={`logo-float pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-700 ${
          full3D ? "opacity-0" : "opacity-100"
        }`}
      >
        <Monogram className="h-[var(--mark-h)] w-auto" />
      </div>
      {full3D && (
        <View className="absolute inset-0">
          <HeroScene />
        </View>
      )}

      {/* wordmark under the mark */}
      <motion.div
        {...show(0.1)}
        aria-hidden
        className="pointer-events-none absolute inset-x-0 z-10 px-5 text-center"
        style={{ top: "calc(42% + var(--mark-h) / 2 + 1.75rem)" }}
      >
        <p className="font-display text-2xl font-extrabold uppercase tracking-[0.08em] sm:text-4xl">
          RK <span className="holo-text">Creative Builds</span>
        </p>
        <p className="mt-2 text-xs uppercase tracking-[0.3em] text-pop">{site.slogan}</p>
      </motion.div>

      <motion.div
        {...show(0.2)}
        className="pointer-events-none absolute inset-x-0 top-24 z-20 flex justify-between px-5 tabular-nums text-xs uppercase tracking-[0.12em] text-muted sm:top-28 sm:px-8"
      >
        <span>3D print studio</span>
        <span className="hidden sm:inline">{products.length} designs · printed to order</span>
      </motion.div>

      <motion.div
        {...show(0.45)}
        className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-start justify-between gap-5 px-5 pb-8 sm:flex-row sm:items-end sm:px-8 sm:pb-10"
      >
        <p className="max-w-xs text-sm text-fg/75 sm:text-base">
          Custom 3D prints, unique gifts and one-off builds. Printed to order, finished by hand.
        </p>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/shop/" primary>
            Shop the collection →
          </ButtonLink>
          <ButtonLink href="/custom/">Custom print</ButtonLink>
        </div>
      </motion.div>
    </section>
  );
}
