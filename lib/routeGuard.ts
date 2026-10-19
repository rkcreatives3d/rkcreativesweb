// Route guard: checkout can only be reached from inside the site (it needs a
// cart). Every other page can be linked, shared and found on Google.
//
// Injected as a blocking <head> script, so it runs on every full document load
// before anything paints. Landing on /checkout from a typed URL, bookmark or
// another site sends the visitor to the home page. Refresh, back/forward and
// new tabs opened from this site are allowed.
export const routeGuardScript = `(function () {
  if (location.pathname.indexOf("/checkout") !== 0) return;

  var entry = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
  var legacy = performance.navigation && performance.navigation.type;
  var type = entry ? entry.type : legacy === 1 ? "reload" : legacy === 2 ? "back_forward" : "navigate";
  if (type === "reload" || type === "back_forward") return;

  try {
    if (document.referrer && new URL(document.referrer).origin === location.origin) return;
  } catch (e) {}

  document.documentElement.style.visibility = "hidden";
  location.replace("/");
})();`;
