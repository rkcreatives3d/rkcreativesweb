import { shippingFor, site } from "./site";

// ─────────────────────────────────────────────────────────────
//  EDIT ME — delivery estimates by PIN code.
//  Zones are worked out from how close the customer's PIN is to
//  `site.originPin` (same first 3 digits = same city, first 2 = same
//  state / postal circle, first 1 = same region of India). Tune the
//  courier days and any surcharge to match your courier.
// ─────────────────────────────────────────────────────────────

export type ZoneId = "local" | "state" | "region" | "national" | "remote";

export const zones: Record<ZoneId, { label: string; transit: [number, number]; extra: number }> = {
  local: { label: "Same city", transit: [1, 2], extra: 0 },
  state: { label: "Same state", transit: [2, 3], extra: 0 },
  region: { label: "Nearby states", transit: [3, 5], extra: 0 },
  national: { label: "Rest of India", transit: [4, 7], extra: 0 },
  remote: { label: "North-East, J&K, Ladakh & islands", transit: [6, 10], extra: 50 },
};

/** PIN prefixes couriers treat as remote (longer transit, small surcharge). */
const REMOTE = ["18", "19", "78", "79", "744", "6825", "9"];

export const validPin = (pin: string) => /^[1-9]\d{5}$/.test(pin.trim());

export function zoneFor(pin: string): ZoneId | null {
  const p = pin.trim();
  if (!validPin(p)) return null;
  const o = site.originPin;
  if (REMOTE.some((r) => p.startsWith(r))) return "remote";
  if (p.slice(0, 3) === o.slice(0, 3)) return "local";
  if (p.slice(0, 2) === o.slice(0, 2)) return "state";
  if (p[0] === o[0]) return "region";
  return "national";
}

/** `n` working days after `from` (Sundays off). */
function addWorkingDays(from: Date, n: number) {
  const d = new Date(from);
  while (n > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) n--;
  }
  return d;
}

const addDays = (from: Date, n: number) => new Date(from.getTime() + n * 86_400_000);

/** Delivery window for an order placed now; a PIN narrows it to that zone. */
export function deliveryQuote(pin = "", subtotal = 0, from = new Date()) {
  const zone = zoneFor(pin);
  const transit = zone ? zones[zone].transit : site.transit;
  const earliest = addDays(addWorkingDays(from, site.dispatch[0]), transit[0]);
  const latest = addDays(addWorkingDays(from, site.dispatch[1]), transit[1]);
  const fmt = new Intl.DateTimeFormat(site.locale, { weekday: "short", day: "numeric", month: "short" });
  return {
    zone,
    zoneLabel: zone ? zones[zone].label : null,
    window: `${fmt.format(earliest)} – ${fmt.format(latest)}`,
    shipping: shippingTo(subtotal, pin),
  };
}

/** The latest an order placed on `from` should arrive (no PIN: the shop's usual courier days). */
export const latestArrival = (from: Date) => addDays(addWorkingDays(from, site.dispatch[1]), site.transit[1]);

/** Shipping for a cart going to `pin` (remote zones add their surcharge, unless shipping is free). */
export function shippingTo(subtotal: number, pin = "") {
  const base = shippingFor(subtotal);
  const zone = zoneFor(pin);
  return base === 0 || !zone ? base : base + zones[zone].extra;
}
