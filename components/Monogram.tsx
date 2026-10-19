/** RK monogram (Saira outlines): cream R, brushed-gold K. Used in the nav. */
export function Monogram({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="5 11 108 69" className={className} role="img" aria-label="RK">
      <defs>
        <linearGradient id="rk-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f5d287" />
          <stop offset="0.55" stopColor="#d4973f" />
          <stop offset="1" stopColor="#a8681c" />
        </linearGradient>
      </defs>
      <path d="M56.5 80L37.6 80L30.6 56.5L23.7 56.5L23.7 80L5.4 80L5.4 11.2L35.2 11.2Q43.6 11.2 47.9 13.7Q52.1 16.2 53.6 20.9Q55 25.7 55 33.8L55 33.8Q55 41.4 53.5 46.4Q52 51.3 47.5 53.8L47.5 53.8L56.5 80ZM29.3 42.8Q32.8 42.8 34.3 42.3Q35.7 41.7 36.2 39.9Q36.7 38.2 36.7 34L36.7 34Q36.7 29.8 36.3 28.1Q35.9 26.5 34.4 25.9Q32.9 25.3 29.3 25.3L29.3 25.3L23.7 25.3L23.7 42.8L29.3 42.8Z" fill="#f4efe6" />
      <path d="M112.6 80L92.7 80L79.2 52.2L76.6 52.2L76.6 80L58.3 80L58.3 11.2L76.6 11.2L76.6 37.9L79.2 37.9L93 11.2L112.4 11.2L94 43.8L112.6 80Z" fill="url(#rk-gold)" />
    </svg>
  );
}
