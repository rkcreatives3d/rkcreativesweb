// Add-to-cart feedback: the cart in the top bar (or the phone tab bar) gives a
// small bump, so the eye knows where the item went. One confirmation per
// action: the "Added to cart" pop-up (quick add) or the cart drawer (product
// and Personalise pages) says the rest.

export function bumpCart() {
  // the one that's showing: phones hide the top bar's bag where the tab bar has one
  const target = [...document.querySelectorAll("[data-cart-target]")].find((el) => el.getClientRects().length);
  if (!target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  target.animate([{ transform: "scale(1)" }, { transform: "scale(1.15)" }, { transform: "scale(1)" }], {
    duration: 320,
    easing: "cubic-bezier(.3,1.5,.5,1)",
  });
}
