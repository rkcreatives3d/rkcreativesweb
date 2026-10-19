import { create } from "zustand";

// Lite mode: photos and flat artwork instead of live 3D, for budget phones and
// data-saver users. Decided before first paint by `bootScript` (sets the
// `lite` class on <html>), and switchable from the footer.

export const LITE_KEY = "rk-lite";
export const INTRO_KEY = "rk-intro";

/** Blocking <head> script: pick Lite mode and whether the intro plays, before paint. */
export const bootScript = `(function () {
  var d = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem("${LITE_KEY}"); } catch (e) {}
  // budget phones: little memory, few cores, data saver or a 2G connection.
  // (deviceMemory is Chrome-only and capped at 8; iPhones report neither and get 3D.)
  var n = navigator, mem = n.deviceMemory || 8, cores = n.hardwareConcurrency || 8, c = n.connection || {};
  var slow = mem <= 2 || (mem <= 4 && cores <= 4) || c.saveData || /2g/.test(c.effectiveType || "");
  if (saved === "1" || (saved === null && slow)) d.classList.add("lite");

  // the printing intro: home page, first visit ever, never in Lite mode
  var seen = null;
  try { seen = localStorage.getItem("${INTRO_KEY}"); } catch (e) {}
  var calm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (location.pathname !== "/" || seen || calm || d.classList.contains("lite")) d.classList.add("no-intro");
})();`;

type LiteState = {
  ready: boolean;
  lite: boolean;
  /** Lite mode was switched on automatically because 3D ran too slowly */
  auto: boolean;
  set: (lite: boolean) => void;
  /** switch to Lite because the device is struggling (remembered, and announced once) */
  fallBack: () => void;
};

export const useLite = create<LiteState>((set) => ({
  ready: false, // false until <Providers> has read the boot decision on the client
  lite: false,
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
      localStorage.setItem(LITE_KEY, "1");
    } catch {}
    set({ lite: true, auto: true });
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

/** No WebGL, or WebGL drawn in software (no usable GPU): 3D would crawl. */
export function weakGpu() {
  try {
    const gl = document.createElement("canvas").getContext("webgl");
    if (!gl) return true;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return /swiftshader|llvmpipe|software|basic render/i.test(name);
  } catch {
    return false;
  }
}

/** Lite mode is on (photos / flat art instead of 3D). False until decided on the client. */
export const useLiteMode = () => useLite((s) => s.lite);

/** True once we know the device should get the full 3D experience. */
export const useFull3D = () => useLite((s) => s.ready && !s.lite);
