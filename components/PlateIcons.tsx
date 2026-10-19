import type { PlateIcon } from "@/lib/personalise";

// Flat versions of the 3D icons in three/nameplate.ts, for the picker buttons.
const paths: Record<Exclude<PlateIcon, "none">, string> = {
  heart: "M12 21C9.6 19.1 3 14.6 3 9.1 3 6.1 5 4 7.5 4c1.9 0 3.5 1.2 4.5 2.9C13 5.2 14.6 4 16.5 4 19 4 21 6.1 21 9.1c0 5.5-6.6 10-9 11.9Z",
  star: "m12 2.5 2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.4l-6.1 3.5 1.5-6.8-5.2-4.6 6.9-.7L12 2.5Z",
  crown: "M3 19.5h18V7.5l-4.5 5.4L12 4.5l-4.5 8.4L3 7.5v12Z",
  bolt: "M14.5 2 5 13.4h6.5L9.5 22 19 10.2h-6.5L14.5 2Z",
  paw: "M12 11c3.3 0 6 2.6 6 5.2 0 2.2-1.9 3.3-3.4 3.3-1.1 0-1.7-.5-2.6-.5s-1.5.5-2.6.5C7.9 19.5 6 18.4 6 16.2 6 13.6 8.7 11 12 11ZM4.6 7.2c1.3 0 2.3 1.3 2.3 2.9S5.9 13 4.6 13s-2.3-1.3-2.3-2.9 1-2.9 2.3-2.9Zm14.8 0c1.3 0 2.3 1.3 2.3 2.9S20.7 13 19.4 13s-2.3-1.3-2.3-2.9 1-2.9 2.3-2.9ZM9.2 3c1.3 0 2.3 1.3 2.3 2.9s-1 2.9-2.3 2.9-2.3-1.3-2.3-2.9S7.9 3 9.2 3Zm5.6 0c1.3 0 2.3 1.3 2.3 2.9s-1 2.9-2.3 2.9-2.3-1.3-2.3-2.9S13.5 3 14.8 3Z",
};

export function IconGlyph({ icon, size = 20 }: { icon: PlateIcon; size?: number }) {
  if (icon === "none")
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="8" />
        <path d="M6.5 17.5 17.5 6.5" />
      </svg>
    );
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d={paths[icon]} />
    </svg>
  );
}
