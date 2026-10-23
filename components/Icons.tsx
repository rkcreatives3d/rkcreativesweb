// Small line icons that match the rest of the UI (instead of emoji, which look different on every phone).

type P = { size?: number; className?: string };

export function TruckIcon({ size = 16, className = "" }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={`inline-block shrink-0 align-[-0.2em] ${className}`}>
      <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" />
      <circle cx="7" cy="18" r="1.8" />
      <circle cx="17.5" cy="18" r="1.8" />
    </svg>
  );
}

export function MailIcon({ size = 16, className = "" }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={`inline-block shrink-0 ${className}`}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

/** "turn it round": a 360° view */
export function SpinIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <ellipse cx="12" cy="12" rx="9.5" ry="4" />
      <path d="M12 2.5v4M12 17.5v4" opacity=".5" />
      <path d="m17 14.6 2.6 1.1-1 2.6" />
    </svg>
  );
}
