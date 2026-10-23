"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { optionsLabel } from "@/lib/personalise";
import { useCart, cartSubtotal, lineTotal } from "@/lib/cart";
import { getFinish, getProduct } from "@/lib/products";
import {
  buildOrderMessage,
  describeItem,
  newOrderId,
  orderTotals,
  payLabels,
  payOptions,
  saveOrder,
  type Customer,
  type PayMethod,
} from "@/lib/order";
import { deliveryQuote, shippingTo, validPin } from "@/lib/delivery";
import { dispatchLabel, formatPrice, mailtoUrl, site, whatsappUrl } from "@/lib/site";
import { track } from "@/lib/track";
import { ButtonLink } from "./ui";
import { ProductThumb } from "./ProductMedia";
import { DeliveryEstimate, usePin } from "./Delivery";
import { TrustBadges } from "./TrustBadges";
import { MailIcon, TruckIcon } from "./Icons";

const payNotes: Record<PayMethod, string> = {
  upi: "Pay now on the next page, or after we confirm. No extra charge.",
  card: "Pay securely on Razorpay's page after you send the order.",
  cod: `Pay the courier when it arrives (+${formatPrice(site.payments.cod.fee)} COD fee).`,
};

const empty: Customer = { name: "", phone: "", email: "", address: "", city: "", pincode: "", notes: "" };

export function CheckoutForm() {
  const router = useRouter();
  const { items, clear } = useCart();
  const savedPin = usePin((s) => s.pin);
  const setPin = usePin((s) => s.setPin);
  const [c, setC] = useState<Customer>(empty);
  const [quote, setQuote] = useState<ReturnType<typeof deliveryQuote> | null>(null);

  // pre-fill the PIN someone already checked on a product page
  useEffect(() => {
    if (!usePin.persist.hasHydrated()) usePin.persist.rehydrate();
  }, []);
  useEffect(() => {
    if (savedPin) setC((v) => (v.pincode ? v : { ...v, pincode: savedPin }));
  }, [savedPin]);

  const subtotal = cartSubtotal(items);
  // dates depend on today, so they're only worked out in the browser
  useEffect(() => setQuote(deliveryQuote(c.pincode, subtotal)), [c.pincode, subtotal]);
  const shipping = shippingTo(subtotal, c.pincode);
  const options = payOptions(items, subtotal + shipping);
  const [payPick, setPay] = useState<PayMethod>("upi");
  const pay = options.includes(payPick) ? payPick : "upi";
  const codFee = pay === "cod" ? site.payments.cod.fee : 0;
  const set = (k: keyof Customer) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setC((v) => ({ ...v, [k]: e.target.value }));

  useEffect(() => {
    if (items.length) track("begin_checkout", { value: subtotal, items: items.length });
    // once per visit to the page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <p className="font-display text-4xl font-extrabold display-case">Cart&apos;s empty</p>
        <p className="mt-3 text-muted">Nothing to check out yet.</p>
        <div className="mt-8">
          <ButtonLink href="/shop/" primary>
            Browse the shop →
          </ButtonLink>
        </div>
      </div>
    );
  }

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const via = ((e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)?.value === "email" ? "email" : "whatsapp";
    const id = newOrderId();
    const msg = buildOrderMessage(id, items, c, pay);
    const url = via === "whatsapp" ? whatsappUrl(msg) : mailtoUrl(`Order ${id} — ${c.name}`, msg);
    const totals = orderTotals(items, c.pincode, pay);
    saveOrder({
      id,
      via,
      url,
      lines: items.flatMap((i) => {
        const d = describeItem(i);
        return d ? [{ ...d, qty: i.qty, total: lineTotal(i) }] : [];
      }),
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      codFee: totals.codFee,
      total: totals.total,
      pay,
      delivery: totals.delivery,
      name: c.name.split(" ")[0],
      at: Date.now(),
    });
    if (validPin(c.pincode)) setPin(c.pincode.trim());
    track("order_sent", { via, pay, value: totals.total, items: items.length });
    if (via === "whatsapp") window.open(url, "_blank", "noopener");
    else window.location.href = url;
    clear();
    router.push("/order/");
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
              pattern="[1-9][0-9]{5}"
              title="6-digit PIN code"
              maxLength={6}
              value={c.pincode}
              onChange={set("pincode")}
              autoComplete="postal-code"
              aria-describedby="pin-quote"
            />
          </div>
          <p id="pin-quote" aria-live="polite" className="text-sm text-muted">
            {quote?.zone ? (
              <>
                <TruckIcon className="mr-1.5 text-pop" />
                {quote.zoneLabel}: delivered <span className="font-semibold text-fg">{quote.window}</span>
              </>
            ) : (
              "Enter your PIN code to see delivery dates."
            )}
          </p>
          <Field label="Notes (gift message, colour tweaks…)" value={c.notes} onChange={set("notes")} textarea />
        </Fieldset>

        <Fieldset title="03 · Payment">
          {options.length > 1 ? (
            <div role="radiogroup" aria-label="How would you like to pay?" className="grid gap-2">
              {options.map((o) => (
                <label
                  key={o}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                    pay === o ? "border-fg bg-raised" : "border-line hover:border-fg/30"
                  }`}
                >
                  <input type="radio" name="pay" value={o} checked={pay === o} onChange={() => setPay(o)} className="mt-0.5 h-5 w-5 accent-[var(--color-accent)]" />
                  <span className="text-sm">
                    <span className="block font-semibold">{payLabels[o]}</span>
                    <span className="text-muted">{payNotes[o]}</span>
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">
              Pay by UPI (GPay, PhonePe, Paytm) or bank transfer. You can pay straight away on the next page, or after we confirm on
              WhatsApp.
            </p>
          )}
        </Fieldset>

        <Fieldset title="04 · Send order">
          <p className="text-sm text-muted">
            Your order goes straight to us on WhatsApp or email. We confirm colours and print time, usually within a few hours.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="submit" name="via" value="whatsapp" className="btn btn-primary flex-1">
              <WhatsAppIcon /> Order on WhatsApp
            </button>
            <button type="submit" name="via" value="email" className="btn flex-1">
              <MailIcon /> Order by email
            </button>
          </div>
        </Fieldset>
      </form>

      <aside className="h-fit rounded-3xl border border-line bg-surface p-6 lg:sticky lg:top-28">
        <h2 className="font-display text-2xl font-bold">Order summary</h2>
        <ul className="mt-5 space-y-4">
          {items.map((i) => {
            const p = getProduct(i.slug);
            if (!p) return null;
            const f = getFinish(i.finish);
            return (
              <li key={i.key} className="flex items-center gap-3">
                <ProductThumb product={p} finish={i.finish} className="h-12 w-12" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {p.name} <span className="tabular-nums text-xs text-muted">×{i.qty}</span>
                  </p>
                  <p className="text-xs text-muted">
                    {f.name} · {p.sizes.find((s) => s.id === i.size)?.label}
                  </p>
                  {i.engraving && (
                    <p className="truncate text-xs text-pop">
                      “{i.engraving}”{optionsLabel(i.options) && ` · ${optionsLabel(i.options)}`}
                    </p>
                  )}
                </div>
                <span className="tabular-nums text-sm">{formatPrice(lineTotal(i))}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-6 space-y-1 border-t border-fg/10 pt-4 text-sm text-muted">
          <p className="flex justify-between">
            Subtotal <span className="tabular-nums text-fg">{formatPrice(subtotal)}</span>
          </p>
          <p className="flex justify-between">
            Shipping <span className="tabular-nums text-fg">{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
          </p>
          {codFee > 0 && (
            <p className="flex justify-between">
              Cash on delivery fee <span className="tabular-nums text-fg">{formatPrice(codFee)}</span>
            </p>
          )}
          <p className="flex justify-between pt-2 font-display text-2xl font-bold text-fg">
            Total <span>{formatPrice(subtotal + shipping + codFee)}</span>
          </p>
        </div>
        <p className="mt-4 text-xs text-muted">
          Every piece is printed to order. Dispatch in {dispatchLabel} working days after payment.
        </p>
        <DeliveryEstimate pin={c.pincode} className="mt-1 text-xs text-muted" />
        <TrustBadges className="mt-5" />
        <Link href="/shop/" className="mt-4 inline-block text-xs font-semibold text-accent underline-offset-4 hover:underline">
          ← Keep shopping
        </Link>
      </aside>
    </div>
  );
}

export function Fieldset({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-3xl border border-line bg-surface p-6">
      <legend className="sr-only">{title}</legend>
      <p className="tabular-nums text-xs uppercase tracking-[0.12em] text-pop">{title}</p>
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
    "mt-1.5 w-full rounded-xl border border-fg/15 bg-page/60 px-4 py-3 text-fg outline-none transition-colors placeholder:text-fg/50 focus:border-accent-2 focus:ring-2 focus:ring-accent-2/20";
  return (
    <label className={`block text-sm ${className}`}>
      <span className="text-muted">
        {label}
        {rest.required && <span className="text-danger"> *</span>}
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
