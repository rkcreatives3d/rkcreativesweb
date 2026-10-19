import { site, formatPrice, shippingFor } from "./site";
import { getFinish, getProduct } from "./products";
import { cartSubtotal, lineTotal, type CartItem } from "./cart";

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

export function buildOrderMessage(orderId: string, items: CartItem[], c: Customer) {
  const lines = items.map((i, n) => {
    const p = getProduct(i.slug);
    if (!p) return "";
    const size = p.sizes.find((s) => s.id === i.size);
    const text = i.engraving ? ` — print "${i.engraving}"` : "";
    return `${n + 1}) ${p.name} — ${getFinish(i.finish).name}, ${size?.label ?? i.size} (${size?.dims ?? ""})${text} × ${i.qty} = ${formatPrice(lineTotal(i))}`;
  });
  const subtotal = cartSubtotal(items);
  const shipping = shippingFor(subtotal);

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
    c.notes ? `Notes: ${c.notes}` : null,
    "",
    "Please confirm availability and payment details.",
  ]
    .filter((l) => l !== null)
    .join("\n");
}
