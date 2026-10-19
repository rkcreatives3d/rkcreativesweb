"use client";

import { View } from "@react-three/drei";
import { motion } from "motion/react";
import { LogoScene } from "../three/LogoScene";
import { HoloLink } from "../ui";
import { products } from "@/lib/products";
import { site } from "@/lib/site";
import { useIntro } from "@/lib/intro";
import { useFull3D } from "@/lib/lite";

/** Cover page: the brand logo in 3D, with the shop's way in underneath. */
export function Hero() {
  const ready = useIntro((s) => s.done);
  const full3D = useFull3D();
  const show = (delay: number) => ({
    initial: { opacity: 0, y: 24 },
    animate: ready ? { opacity: 1, y: 0 } : undefined,
    transition: { delay, duration: 1, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <section className="relative h-[100svh] min-h-[620px] overflow-hidden">
      <h1 className="sr-only">
        {site.name}: {site.slogan}. {site.tagline}.
      </h1>
      <div className="pointer-events-none absolute left-1/2 top-[46%] h-[60vmin] w-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[120px]" />
      {/* plain logo: in the page HTML so it shows instantly; fades out under the identical 3D plaque */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo.jpg"
        alt=""
        aria-hidden
        className={`logo-feather logo-float pointer-events-none absolute left-1/2 top-[46%] h-[min(70svh,86vw)] w-[min(70svh,86vw)] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-700 ${
          full3D ? "opacity-0" : "opacity-100"
        }`}
      />
      {full3D && (
        <View className="absolute inset-0">
          <LogoScene />
        </View>
      )}

      <motion.div
        {...show(0.2)}
        className="pointer-events-none absolute inset-x-0 top-24 z-20 flex justify-between px-5 font-mono text-[10px] uppercase tracking-[0.3em] text-muted sm:top-28 sm:px-8 sm:text-[11px]"
      >
        <span>[ 3D print studio ]</span>
        <span className="hidden sm:inline">{String(products.length).padStart(3, "0")} objects · printed to order</span>
      </motion.div>

      <motion.div
        {...show(0.45)}
        className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-start justify-between gap-5 px-5 pb-8 sm:flex-row sm:items-end sm:px-8 sm:pb-10"
      >
        <p className="max-w-xs text-sm text-fg/75 sm:text-base">
          Custom 3D prints, unique gifts and one-off builds. Printed to order, finished by hand.
        </p>
        <div className="flex flex-wrap gap-3">
          <HoloLink href="/shop/" solid>
            Shop the collection →
          </HoloLink>
          <HoloLink href="/custom/">Custom print</HoloLink>
        </div>
      </motion.div>

      <div className="pointer-events-none absolute bottom-8 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-muted lg:flex">
        Scroll
        <span className="scroll-line h-10 w-px bg-gradient-to-b from-accent to-transparent" />
      </div>
    </section>
  );
}
