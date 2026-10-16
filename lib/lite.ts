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
  var n = navigator, mem = n.deviceMemory || 8, cores = n.hardwareConcurrency || 8;
  var slow = mem <= 2 || (mem <= 4 && cores <= 4) || (n.connection && n.connection.saveData);
  if (saved === "1" || (saved === null && slow)) d.classList.add("lite");

  // the printing intro: home page only, once per visit, never in Lite mode
  var seen = null;
  try { seen = sessionStorage.getItem("${INTRO_KEY}"); } catch (e) {}
  var calm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (location.pathname !== "/" || seen || calm || d.classList.contains("lite")) d.classList.add("no-intro");
})();`;

export const useLite = create<{ ready: boolean; lite: boolean; set: (lite: boolean) => void }>((set) => ({
  ready: false, // false until <Providers> has read the boot decision on the client
  lite: false,
  set: (lite) => {
    document.documentElement.classList.toggle("lite", lite);
    try {
      localStorage.setItem(LITE_KEY, lite ? "1" : "0");
    } catch {}
    set({ lite });
  },
}));

/** Lite mode is on (photos / flat art instead of 3D). False until decided on the client. */
export const useLiteMode = () => useLite((s) => s.lite);

/** True once we know the device should get the full 3D experience. */
export const useFull3D = () => useLite((s) => s.ready && !s.lite);
