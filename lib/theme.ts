// 3D side of the brand palette, taken from the RK Creative Builds logo:
// black, molten amber filament, brushed gold. DOM colours live in app/globals.css.

type Panel = [color: string, intensity: number];

export const theme = {
  /**
   * Product lighting: a neutral white "photo studio", so every filament colour
   * shows true (white looks white, black reads as black, not brown).
   */
  neutralEnv: {
    bg: "#0d0d0e",
    panels: [
      ["#ffffff", 3.6],
      ["#ffffff", 2.2],
      ["#f3f5f8", 2],
      ["#6b6d70", 1.4],
      ["#ffffff", 2.2],
      ["#bdbdbd", 1.1],
      ["#ffffff", 1.2],
    ] as Panel[],
  },
  /** cover + intro only: the warm amber/gold studio from the logo. 7 panels (key, left, right, back, front, floor, kicker) */
  env: {
    bg: "#0a0604",
    panels: [
      ["#fff4e0", 4],
      ["#ff9a1a", 3.2],
      ["#f5d287", 2.6],
      ["#3a2410", 1.4],
      ["#ffffff", 2.4],
      ["#ff9a1a", 2],
      ["#ffffff", 1],
    ] as Panel[],
  },
  light: { ambient: 0.15, key: 0.7 },
  amber: "#ff9a1a",
  gold: "#d4973f",
  sparkles: ["#ffb347", "#f5d287"],
  rings: ["#d4973f", "#4a4136"],
  hot: "#fff1c7",
  carriage: "#141414",
  wire: "#d4973f",
} as const;
