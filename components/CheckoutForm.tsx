"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { useCart, cartSubtotal, lineTotal } from "@/lib/cart";
import { getFinish, getProduct } from "@/lib/products";
import { buildOrderMessage, newOrderId, type Customer } from "@/lib/order";
import { dispatchLabel, formatPrice, mailtoUrl, shippingFor, site, whatsappUrl } from "@/lib/site";
import { HoloLink, Swatch } from "./ui";
import { DeliveryEstimate } from "./ProductMedia";
import { UpiPay } from "./UpiPay";

const empty: Customer = { name: "", phone: "", email: "", address: "", city: "", pincode: "", notes: "" };

export function CheckoutForm() {
  const { items, clear } = useCart();
  const [c, setC] = useState<Customer>(empty);
  const [sent, setSent] = useState<{ id: string; via: "whatsapp" | "email"; url: string; total: number } | null>(null);

  const subtotal = cartSubtotal(items);
  const shipping = shippingFor(subtotal);
  const set = (k: keyof Customer) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setC((v) => ({ ...v, [k]: e.target.value }));

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="cta-card mx-auto max-w-2xl rounded-[32px] p-8 text-center sm:p-12"
      >
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-pop">Order drafted ✦ {sent.id}</p>
        <h2 className="mt-4 font-display text-4xl font-extrabold display-case sm:text-5xl">Almost there</h2>
        <p className="mx-auto mt-4 max-w-md text-muted">
          {sent.via === "whatsapp"
            ? "WhatsApp should have opened with your order pre-filled. Hit send there and we'll reply to confirm."
            : "Your email app should have opened with the order pre-filled. Hit send there and we'll reply to confirm."}
        </p>
        <UpiPay amount={sent.total} orderId={sent.id} />
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <HoloLink href={sent.url} target="_blank" rel="noreferrer">
            Didn&apos;t open? Try again
          </HoloLink>
          <button
            onClick={() => {
              clear();
              setSent(null);
            }}
            className="holo-btn holo-btn-solid"
          >
            I sent it, clear my cart
          </button>
        </div>
      </motion.div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <p className="font-display text-4xl font-extrabold display-case">Cart&apos;s empty</p>
        <p className="mt-3 text-muted">Nothing to check out yet.</p>
        <div className="mt-8">
          <HoloLink href="/shop/" solid>
            Browse the drop →
          </HoloLink>
        </div>
      </div>
    );
  }

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const via = ((e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)?.value === "email" ? "email" : "whatsapp";
    const id = newOrderId();
    const msg = buildOrderMessage(id, items, c);
    const url = via === "whatsapp" ? whatsappUrl(msg) : mailtoUrl(`Order ${id} — ${c.name}`, msg);
    if (via === "whatsapp") window.open(url, "_blank", "noopener");
    else window.location.href = url;
    setSent({ id, via, url, total: subtotal + shipping });
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
      <form onSubmit={submit} className="space-y-5">
        <Fieldset title="01 · Contact">
          <Field label="Full name" required value={c.name} onChange={set("name")} autoComplete="name" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Phone (WhatsApp)"
              required
              type="tel"
              inputMode="tel"
              pattern="[0-9+\s\-]{10,15}"
              title="10–15 digits"
              value={c.phone}
              onChange={set("phone")}
              autoComplete="tel"
            />
            <Field label="Email (optional)" type="email" value={c.email} onChange={set("email")} autoComplete="email" />
          </div>
        </Fieldset>

        <Fieldset title="02 · Delivery">
          <Field label="Address" required value={c.address} onChange={set("address")} autoComplete="street-address" textarea />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City" required value={c.city} onChange={set("city")} autoComplete="address-level2" />
            <Field
              label="PIN code"
              required
              inputMode="numeric"
              pattern="[0-9]{4,10}"
              value={c.pincode}
              onChange={set("pincode")}
              autoComplete="postal-code"
            />
          </div>
          <Field label="Notes (gift message, colour tweaks…)" value={c.notes} onChange={set("notes")} textarea />
        </Fieldset>

        <Fieldset title="03 · Send order">
          <p className="text-sm text-muted">
            No card needed here. Your order goes straight to us on WhatsApp or email. We confirm stock and print time, then share
            payment details (UPI / bank transfer).
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="submit" name="via" value="whatsapp" className="holo-btn holo-btn-solid flex-1">
              <WhatsAppIcon /> Order on WhatsApp
            </button>
            <button type="submit" name="via" value="email" className="holo-btn flex-1">
              ✉ Order by email
            </button>
          </div>
        </Fieldset>
      </form>

      <aside className="h-fit rounded-[28px] border border-fg/10 bg-fg/[0.03] p-6 lg:sticky lg:top-28">
        <h2 className="font-display text-2xl font-bold">Order summary</h2>
        <ul className="mt-5 space-y-4">
          {items.map((i) => {
            const p = getProduct(i.slug);
            if (!p) return null;
            const f = getFinish(i.finish);
            return (
              <li key={i.key} className="flex items-center gap-3">
                <Swatch css={f.swatch} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {p.name} <span className="font-mono text-xs text-muted">×{i.qty}</span>
                  </p>
                  <p className="text-xs text-muted">
                    {f.name} · {p.sizes.find((s) => s.id === i.size)?.label}
                  </p>
                  {i.engraving && <p className="truncate text-xs text-accent-2">“{i.engraving}”</p>}
                </div>
                <span className="font-mono text-sm">{formatPrice(lineTotal(i))}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-6 space-y-1 border-t border-fg/10 pt-4 text-sm text-muted">
          <p className="flex justify-between">
            Subtotal <span className="font-mono text-fg">{formatPrice(subtotal)}</span>
          </p>
          <p className="flex justify-between">
            Shipping <span className="font-mono text-fg">{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
          </p>
          <p className="flex justify-between pt-2 font-display text-2xl font-bold text-fg">
            Total <span>{formatPrice(subtotal + shipping)}</span>
          </p>
        </div>
        <p className="mt-4 text-xs text-muted">
          Every piece is printed to order. Dispatch in {dispatchLabel} days after payment.
        </p>
        <DeliveryEstimate className="mt-1 text-xs text-muted" />
        <Link href="/shop/" className="mt-4 inline-block text-xs text-accent-2 underline-offset-4 hover:underline">
          ← Keep shopping
        </Link>
      </aside>
    </div>
  );
}

export function Fieldset({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-[28px] border border-fg/10 bg-fg/[0.025] p-6">
      <legend className="sr-only">{title}</legend>
      <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent">{title}</p>
      {children}
    </fieldset>
  );
}

type FieldProps = {
  label: string;
  textarea?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement> &
  React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Field({ label, textarea, className = "", ...rest }: FieldProps) {
  const cls =
    "mt-1.5 w-full rounded-xl border border-fg/15 bg-page/60 px-4 py-3 text-fg outline-none transition-colors placeholder:text-fg/30 focus:border-accent-2 focus:ring-2 focus:ring-accent-2/20";
  return (
    <label className={`block text-sm ${className}`}>
      <span className="text-muted">
        {label}
        {rest.required && <span className="text-accent"> *</span>}
      </span>
      {textarea ? (
        <textarea rows={3} className={cls} {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} />
      ) : (
        <input className={cls} {...(rest as React.InputHTMLAttributes<HTMLInputElement>)} />
      )}
    </label>
  );
}

export function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.3Z" />
    </svg>
  );
}
