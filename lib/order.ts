import { site, formatPrice } from "./site";
import { getFinish, getProduct } from "./products";
import { cartSubtotal, lineTotal, type CartItem } from "./cart";
import { deliveryQuote } from "./delivery";
import { optionsLabel } from "./personalise";

export type Customer = {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
  notes: string;
};

export const newOrderId = () =>
  `${site.orderPrefix}-${Date.now().toString(36).slice(-4).toUpperCase()}${Math.random()
    .toString(36)
    .slice(2, 4)
    .toUpperCase()}`;

/** One cart line in words, e.g. "Vortex Vase — Brushed Gold, Medium (18 cm tall) — print "ANU"". */
export function describeItem(i: CartItem) {
  const p = getProduct(i.slug);
  if (!p) return null;
  const size = p.sizes.find((s) => s.id === i.size);
  const opts = optionsLabel(i.options);
  const text = (i.engraving ? ` — print "${i.engraving}"` : "") + (opts ? ` (${opts})` : "");
  return { name: p.name, detail: `${getFinish(i.finish).name}, ${size?.label ?? i.size} (${size?.dims ?? ""})${text}` };
}

export function orderTotals(items: CartItem[], pincode = "") {
  const subtotal = cartSubtotal(items);
  const quote = deliveryQuote(pincode, subtotal);
  return { subtotal, shipping: quote.shipping, total: subtotal + quote.shipping, delivery: quote.window };
}

export function buildOrderMessage(orderId: string, items: CartItem[], c: Customer) {
  const lines = items.map((i, n) => {
    const d = describeItem(i);
    return d ? `${n + 1}) ${d.name} — ${d.detail} × ${i.qty} = ${formatPrice(lineTotal(i))}` : "";
  });
  const { subtotal, shipping, delivery } = orderTotals(items, c.pincode);

  return [
    `NEW ORDER — ${orderId}`,
    "",
    ...lines,
    "",
    `Subtotal: ${formatPrice(subtotal)}`,
    `Shipping: ${shipping === 0 ? "FREE" : formatPrice(shipping)}`,
    `TOTAL: ${formatPrice(subtotal + shipping)}`,
    "",
    `Name: ${c.name}`,
    `Phone: ${c.phone}`,
    c.email ? `Email: ${c.email}` : null,
    `Address: ${c.address}, ${c.city} — ${c.pincode}`,
    `Estimated delivery: ${delivery}`,
    c.notes ? `Notes: ${c.notes}` : null,
    "",
    "Please confirm availability and payment details.",
  ]
    .filter((l) => l !== null)
    .join("\n");
}

// ── Last order ───────────────────────────────────────────────
// Kept in this browser only, so the confirmation page can show it, resend it
// and offer UPI payment after the cart has been cleared.

const LAST_ORDER = "rk-last-order";

export type OrderSnapshot = {
  id: string;
  via: "whatsapp" | "email";
  url: string;
  lines: { name: string; detail: string; qty: number; total: number }[];
  subtotal: number;
  shipping: number;
  total: number;
  delivery: string;
  name: string;
  at: number;
};

export function saveOrder(o: OrderSnapshot) {
  try {
    localStorage.setItem(LAST_ORDER, JSON.stringify(o));
  } catch {}
}

export function loadOrder(): OrderSnapshot | null {
  try {
    const raw = localStorage.getItem(LAST_ORDER);
    return raw ? (JSON.parse(raw) as OrderSnapshot) : null;
  } catch {
    return null;
  }
}
