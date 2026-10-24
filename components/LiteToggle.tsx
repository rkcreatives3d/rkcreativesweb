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
      className="py-1 text-left hover:text-fg hover:underline"
    >
      {lite ? "Lite mode is on · use 3D" : "Lite mode for slow phones"}
    </button>
  );
}
