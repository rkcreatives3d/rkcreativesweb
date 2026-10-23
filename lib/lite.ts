import { create } from "zustand";

// Lite mode: studio pictures instead of live 3D, for phones with 2 GB of
// memory or less and data-saver users. Decided before first paint by
// `bootScript` (sets the `lite` class on <html>), and switchable from the
// footer. Everything else, 4 GB phones included, gets the 3D site.

/** the visitor's own choice ("1" Lite, "0" 3D). v2: choices from before 3D got lighter are forgotten */
export const LITE_KEY = "rk-lite-v2";
/** this visit only: 3D ran too slowly, so the site switched itself to Lite (tried again next visit) */
export const AUTO_LITE_KEY = "rk-lite-auto";
export const INTRO_KEY = "rk-intro";
export const GPU_KEY = "rk-gpu";

/** Blocking <head> script: pick Lite mode and whether the intro plays, before paint. */
export const bootScript = `(function () {
  var d = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem("${LITE_KEY}"); } catch (e) {}
  // budget phones: 2 GB of memory or less (3 GB phones report 2), data saver or a 2G connection.
  // 4 GB phones get the 3D site. (deviceMemory is Chrome-only; iPhones don't report it and get 3D.)
  var n = navigator, mem = n.deviceMemory || 8, c = n.connection || {};
  var auto = null;
  try { auto = sessionStorage.getItem("${AUTO_LITE_KEY}"); } catch (e) {}
  var slow = mem <= 2 || c.saveData || /2g/.test(c.effectiveType || "") || auto === "1";
  // no WebGL, or WebGL drawn in software (no usable graphics chip): 3D would crawl.
  // Checked once per device and remembered, so later visits skip the test.
  var gpu = null;
  try { gpu = localStorage.getItem("${GPU_KEY}"); } catch (e) {}
  if (saved === null && !slow && gpu === null) {
    gpu = "ok";
    try {
      var gl = document.createElement("canvas").getContext("webgl");
      if (!gl) gpu = "weak";
      else {
        var info = gl.getExtension("WEBGL_debug_renderer_info");
        var name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
        if (/swiftshader|llvmpipe|software|basic render/i.test(name)) gpu = "weak";
        var lose = gl.getExtension("WEBGL_lose_context");
        if (lose) lose.loseContext();
      }
      localStorage.setItem("${GPU_KEY}", gpu);
    } catch (e) {}
  }
  if (saved === "1" || (saved === null && (slow || gpu === "weak"))) d.classList.add("lite");

  // the opening animation: home page only, once per visit, not for reduced motion.
  // It's plain CSS, so budget phones (Lite mode) get it too.
  var seen = null;
  try { seen = sessionStorage.getItem("${INTRO_KEY}"); } catch (e) {}
  var calm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (location.pathname !== "/" || seen || calm) d.classList.add("no-intro");
  else {
    try { sessionStorage.setItem("${INTRO_KEY}", "1"); } catch (e) {}
    // skip on a tap or Esc, working from the very first paint, before the page's JavaScript loads
    var skip = function () { d.classList.add("intro-skipped", "intro-done"); };
    document.addEventListener("click", function (e) { if (e.target && e.target.closest && e.target.closest("#intro")) skip(); }, true);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") skip(); });
    // scrolling means "let me in" (touch scrolling is blocked on the overlay itself)
    addEventListener("wheel", skip, { passive: true, once: true });
  }
})();`;

type LiteState = {
  ready: boolean;
  lite: boolean;
  /** Lite mode, but the visitor asked to see this product in 3D anyway */
  demand: boolean;
  want3D: () => void;
  /** Lite mode was switched on automatically because 3D ran too slowly */
  auto: boolean;
  set: (lite: boolean) => void;
  /** switch to Lite because the device is struggling (remembered, and announced once) */
  fallBack: () => void;
};

export const useLite = create<LiteState>((set) => ({
  ready: false, // false until <Providers> has read the boot decision on the client
  lite: false,
  demand: false,
  want3D: () => set({ demand: true }),
  auto: false,
  set: (lite) => {
    document.documentElement.classList.toggle("lite", lite);
    try {
      localStorage.setItem(LITE_KEY, lite ? "1" : "0");
    } catch {}
    set({ lite, auto: false });
  },
  fallBack: () => {
    document.documentElement.classList.add("lite");
    try {
      sessionStorage.setItem(AUTO_LITE_KEY, "1");
    } catch {}
    set({ lite: true, auto: true, demand: false });
  },
}));

/** The visitor chose the 3D site themselves, so never switch it off for them. */
export function choseFull3D() {
  try {
    return localStorage.getItem(LITE_KEY) === "0";
  } catch {
    return false;
  }
}

/** Lite mode is on (photos / flat art instead of 3D). False until decided on the client. */
export const useLiteMode = () => useLite((s) => s.lite);

/** True once we know this device should draw 3D: the full site, or Lite with 3D asked for on a product. */
export const useFull3D = () => useLite((s) => s.ready && (!s.lite || s.demand));
