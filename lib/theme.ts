// 3D side of the brand palette, taken from the RK Creative Builds logo:
// black, molten amber filament, brushed gold. DOM colours live in app/globals.css.

type Panel = [color: string, intensity: number];

export const theme = {
  /** studio env: background + 7 light panels (key, left, right, back, front, floor, kicker) */
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
  rings: ["#ff9a1a", "#7a4a12"],
  hot: "#fff1c7",
  carriage: "#141414",
  wire: "#ff9a1a",
} as const;
