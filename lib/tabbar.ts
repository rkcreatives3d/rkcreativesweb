// The phone tab bar (components/TabBar.tsx): which pages show it, and how its
// Search button reaches the search panel that lives in the top bar.

/**
 * Pages that keep the screen to themselves on phones: a product page has its
 * own buy bar at the bottom, checkout and the order page are one task, and the
 * owner page is a tool.
 */
export const tabBarOn = (pathname: string) => !/^\/(shop\/[^/]+|checkout|order|owner)(\/|$)/.test(pathname);

const SEARCH = "rk:search";

/** Open the search panel (the top bar listens). */
export const openSearch = () => window.dispatchEvent(new Event(SEARCH));

export function onOpenSearch(fn: () => void) {
  window.addEventListener(SEARCH, fn);
  return () => window.removeEventListener(SEARCH, fn);
}
