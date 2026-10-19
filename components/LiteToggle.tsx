"use client";

import { useLite } from "@/lib/lite";

/** Footer switch between the full 3D site and Lite mode (remembered on this device). */
export function LiteToggle() {
  const { ready, lite, set } = useLite();
  if (!ready) return <span />;
  return (
    <button
      onClick={() => set(!lite)}
      aria-pressed={lite}
      className="rounded-full border border-fg/15 px-3 py-1.5 tracking-[0.2em] transition-colors hover:border-accent hover:text-fg"
    >
      {lite ? "Lite mode on · switch to 3D" : "Slow phone? Lite mode"}
    </button>
  );
}
