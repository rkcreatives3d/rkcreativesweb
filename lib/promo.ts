import { latestArrival } from "./delivery";
import { getOccasion } from "./occasions";
import { products } from "./products";
import { site } from "./site";

// The festival banner on the home page (content/shop.json "promo", edited on
// the owner page). Dates are the shop's own calendar days, YYYY-MM-DD.

const p = site.promo;

/** "2026-11-07" → the end of that day, local time (null if empty or not a date). */
function endOf(day: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day.trim());
  return m ? new Date(+m[1], +m[2] - 1, +m[3], 23, 59, 59) : null;
}

/** Where the banner leads: the shop filtered to its occasion. */
export const promoHref = getOccasion(p.occasion) ? `/shop/?for=${p.occasion}` : "/shop/";

/** The pieces it's about (for its pictures). */
export const promoProducts = () => {
  const o = getOccasion(p.occasion);
  return o ? products.filter(o.test) : [];
};

/** Switched on, has a headline, and its last day hasn't passed. */
export function promoLive(now = new Date()) {
  if (!p.on || !p.title.trim()) return false;
  const ends = endOf(p.ends);
  return !ends || now <= ends;
}

/**
 * The last day an order can be placed and still arrive by `deliverBy`, counting
 * the slowest making and courier days (so the promise holds). null when there's
 * no arrive-by date, or it's already too late to order.
 */
export function lastOrderDay(now = new Date()) {
  const by = endOf(p.deliverBy);
  if (!by) return null;
  let last: Date | null = null;
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  for (let i = 0; i < 60 && latestArrival(day) <= by; i++) {
    last = new Date(day);
    day.setDate(day.getDate() + 1);
  }
  return last;
}
