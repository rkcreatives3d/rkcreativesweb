"use client";

import { lazy, Suspense, type ComponentType } from "react";
import { useFull3D } from "@/lib/lite";

// The 3D engine (three.js, React Three Fiber, drei) is about 400 KB. Page code
// never imports it directly: it goes through this file, so it downloads only
// after the page is on screen and the browser is idle, and never in Lite mode.

/** React.lazy, except a chunk that fails to download (flaky network) renders nothing instead of breaking the page. */
function safeLazy<P extends object>(load: () => Promise<ComponentType<P>>) {
  const Nothing: ComponentType<P> = () => null;
  return lazy(() => load().then((C) => ({ default: C }), () => ({ default: Nothing })));
}

const ViewHost = safeLazy(() => import("./ViewHost").then((m) => m.default));

/** A window into the shared 3D canvas. Renders nothing until 3D is switched on. */
export function View3D({ className, children }: { className?: string; children: React.ReactNode }) {
  const full3D = useFull3D();
  if (!full3D) return null;
  return (
    <Suspense fallback={null}>
      <ViewHost className={className}>{children}</ViewHost>
    </Suspense>
  );
}

const scenes = () => import("./scenes");
export const LogoScene = safeLazy(() => scenes().then((m) => m.LogoScene));
export const CardScene = safeLazy(() => scenes().then((m) => m.CardScene));
export const ViewerScene = safeLazy(() => scenes().then((m) => m.ViewerScene));
export const SlicerScene = safeLazy(() => scenes().then((m) => m.SlicerScene));
export const NameplateScene = safeLazy(() => scenes().then((m) => m.NameplateScene));

export const CanvasRoot = safeLazy(() => import("./CanvasRoot").then((m) => m.default));
