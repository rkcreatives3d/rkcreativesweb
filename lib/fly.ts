// Add-to-cart feedback: the cart in the top bar gives a small bump, so the eye
// knows where the item went. One confirmation per action: the "Added to cart"
// pop-up (quick add) or the cart drawer (product and Personalise pages) says
// the rest.

export function bumpCart() {
  const target = document.querySelector("[data-cart-target]");
  if (!target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  target.animate([{ transform: "scale(1)" }, { transform: "scale(1.15)" }, { transform: "scale(1)" }], {
    duration: 320,
    easing: "cubic-bezier(.3,1.5,.5,1)",
  });
}
