"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { choseFull3D, useLite } from "@/lib/lite";

// The shared canvas renders on demand (frameloop="demand"): a frame is drawn
// only when something asks for one. Anything that moves calls `useLive(true)`
// or `invalidate()` while it's moving, and the page stops drawing (and the GPU
// idles) once everything on screen has come to rest.

/** Keep rendering every frame while `active` is true. */
export function useLive(active = true) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (active) invalidate();
  }, [active, invalidate]);
  useFrame(() => {
    if (active) invalidate();
  });
}

/** Frame delta, capped so the first frame after an idle spell doesn't jump. */
export const step = (dt: number) => Math.min(dt, 1 / 20);

/** Visitor asked for less motion: effects jump straight to their end state. */
export const calm = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Smooth start and finish, for 0..1 progress. */
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Keeps frames coming for a moment after the page itself moves (scroll,
 * resize, clicks, keys), so every <View> stays glued to its element while
 * DOM animations play out.
 */
export function FrameDriver() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let until = 0;
    let raf = 0;
    const tick = () => {
      invalidate();
      raf = performance.now() < until ? requestAnimationFrame(tick) : 0;
    };
    const poke = () => {
      until = performance.now() + 1200;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const opts = { passive: true, capture: true } as const;
    const events = ["scroll", "resize", "pointerdown", "keydown", "wheel", "touchmove"] as const;
    for (const e of events) window.addEventListener(e, poke, opts);
    poke();
    return () => {
      for (const e of events) window.removeEventListener(e, poke, opts);
      cancelAnimationFrame(raf);
    };
  }, [invalidate]);
  return null;
}

/**
 * Watches real frame times while the 3D is animating. If the device can't
 * keep up (under ~24 fps), it first drops to 1× resolution, then switches
 * the site to Lite mode and says so. Never overrides someone who switched
 * 3D back on themselves.
 */
export function FpsGuard() {
  const setDpr = useThree((s) => s.setDpr);
  const samples = useRef<number[]>([]);
  const strikes = useRef(0);
  const born = useRef(performance.now());
  const last = useRef(0);

  useFrame(() => {
    const now = performance.now();
    const gap = now - last.current;
    last.current = now;
    // skip the first seconds (shader compiles) and the gaps between on-demand bursts
    if (now - born.current < 3000 || gap > 1000) return;
    samples.current.push(gap);
    if (samples.current.length < 60) return;
    const sorted = samples.current.sort((a, b) => a - b);
    const median = sorted[sorted.length >> 1];
    samples.current = [];
    if (median < 1000 / 24 || choseFull3D()) return;
    strikes.current++;
    if (strikes.current === 1) setDpr(1);
    else useLite.getState().fallBack();
  });
  return null;
}
