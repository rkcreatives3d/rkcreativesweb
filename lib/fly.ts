// Add-to-cart flourish: a glowing dot arcs from the clicked button into the
// cart icon in the nav, which then bumps. Resolves when the dot lands.

const POINTS = 12;

export function flyToCart(from: Element, background = "#ff9a1a"): Promise<void> {
  const target = document.querySelector("[data-cart-target]");
  if (!target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return Promise.resolve();

  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const lift = Math.min(220, 80 + Math.abs(dx) * 0.25);

  const dot = document.createElement("div");
  dot.setAttribute("aria-hidden", "true");
  Object.assign(dot.style, {
    position: "fixed",
    left: `${a.left + a.width / 2 - 11}px`,
    top: `${a.top + a.height / 2 - 11}px`,
    width: "22px",
    height: "22px",
    borderRadius: "999px",
    background,
    boxShadow: "0 0 24px 6px rgba(255,154,26,0.55)",
    zIndex: "95",
    pointerEvents: "none",
  });
  document.body.appendChild(dot);

  // quadratic arc: up and over, shrinking as it lands
  const frames = Array.from({ length: POINTS + 1 }, (_, i) => {
    const t = i / POINTS;
    const x = dx * t;
    const y = dy * t - lift * 4 * t * (1 - t);
    return { transform: `translate(${x}px, ${y}px) scale(${1.2 - 0.85 * t})`, opacity: t > 0.9 ? 0.5 : 1 };
  });
  const flight = dot.animate(frames, { duration: 750, easing: "cubic-bezier(.45,0,.25,1)" });

  return flight.finished.then(() => {
    dot.remove();
    target.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.18) rotate(-6deg)" }, { transform: "scale(1)" }],
      { duration: 380, easing: "cubic-bezier(.3,1.6,.5,1)" },
    );
  });
}
