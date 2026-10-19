"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { View } from "@react-three/drei";
import { products } from "@/lib/products";
import { useLiteMode } from "@/lib/lite";
import { formatPrice } from "@/lib/site";
import { CarouselScene, type CarouselState } from "../three/CarouselScene";
import { KineticText, SectionLabel } from "../ui";

const featured = products.slice(0, 8);
const STEP = (Math.PI * 2) / featured.length;

export function Featured() {
  const router = useRouter();
  const state = useRef<CarouselState>({ target: 0, current: 0 });
  const drag = useRef({ active: false, startX: 0, startTarget: 0, moved: false, last: 0 });
  const [active, setActive] = useState(0);
  const onActive = useCallback((i: number) => setActive(i), []);

  const go = (dir: number) => {
    drag.current.last = performance.now();
    state.current.target = Math.round(state.current.target / STEP) * STEP - dir * STEP;
  };

  // auto-advance when idle
  useEffect(() => {
    const id = setInterval(() => {
      if (!drag.current.active && performance.now() - drag.current.last > 4000) {
        state.current.target = Math.round(state.current.target / STEP) * STEP - STEP;
      }
    }, 2800);
    return () => clearInterval(id);
  }, []);

  const p = featured[active];
  const lite = useLiteMode();
  if (lite) return null; // the product grid below covers it without 3D

  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div>
          <SectionLabel>Featured drop</SectionLabel>
          <h2 className="mt-4 font-display text-5xl font-extrabold display-case leading-[0.9] tracking-tight sm:text-7xl">
            <KineticText text="Spin the" />
            <br />
            <KineticText text="orbit" holo delay={0.2} />
          </h2>
        </div>
        <p className="max-w-xs text-sm text-muted">Drag to spin. Tap the front object to open it.</p>
      </div>

      <div
        className="relative mt-6 h-[62vh] min-h-[420px] cursor-grab touch-pan-y select-none active:cursor-grabbing"
        data-cursor
        onPointerDown={(e) => {
          drag.current = { active: true, startX: e.clientX, startTarget: state.current.target, moved: false, last: performance.now() };
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d.active) return;
          const dx = e.clientX - d.startX;
          if (Math.abs(dx) > 6) d.moved = true;
          state.current.target = d.startTarget + dx * 0.006;
        }}
        onPointerUp={() => {
          const d = drag.current;
          if (!d.active) return;
          d.active = false;
          d.last = performance.now();
          state.current.target = Math.round(state.current.target / STEP) * STEP;
          if (!d.moved) router.push(`/shop/${featured[active].slug}/`);
        }}
        onPointerCancel={() => {
          drag.current.active = false;
        }}
      >
        <View className="absolute inset-0">
          <CarouselScene items={featured} state={state} onActive={onActive} />
        </View>
      </div>

      <div className="mx-auto mt-2 flex max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <button onClick={() => go(-1)} aria-label="Previous" className="orbit-btn">
          ←
        </button>
        <div className="min-w-0 flex-1 text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={p.slug}
              initial={{ y: 20, opacity: 0, filter: "blur(8px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ y: -20, opacity: 0, filter: "blur(8px)" }}
              transition={{ duration: 0.35 }}
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted">
                {String(active + 1).padStart(2, "0")} / {String(featured.length).padStart(2, "0")} · {p.category}
              </p>
              <Link href={`/shop/${p.slug}/`} className="mt-2 block font-display text-3xl font-bold hover:text-accent sm:text-4xl">
                {p.name}
              </Link>
              <p className="mt-1 font-mono text-sm text-muted">from {formatPrice(p.price)}</p>
            </motion.div>
          </AnimatePresence>
        </div>
        <button onClick={() => go(1)} aria-label="Next" className="orbit-btn">
          →
        </button>
      </div>
    </section>
  );
}
