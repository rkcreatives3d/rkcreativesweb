"use client";

import type { Shop } from "@/lib/owner/edit";
import { useOwner } from "@/lib/owner/store";
import { Card, Num, smallBtn, Switch, Text } from "./fields";

/** Contact, payment and shipping details, and the shop's categories (content/shop.json). */
export function SettingsTab() {
  const draft = useOwner((s) => s.draft)!;
  const { setShop } = useOwner.getState();
  const s = draft.shop;
  const set = (patch: Partial<Shop>) => setShop({ ...s, ...patch });
  const waOk = /^\d{11,15}$/.test(s.whatsapp);

  return (
    <div className="space-y-4">
      <Card title="Contact (orders come here)">
        <Text
          label="WhatsApp number"
          value={s.whatsapp}
          onChange={(v) => set({ whatsapp: v.replace(/\D/g, "") })}
          inputMode="tel"
          hint={waOk ? "Country code + number, digits only. India: 91 then your 10 digits." : "Add the country code: 91 then your 10-digit number, e.g. 919876543210."}
        />
        <Text label="Order email" type="email" value={s.email} onChange={(v) => set({ email: v })} />
        <Text label="Instagram link" value={s.instagram} onChange={(v) => set({ instagram: v })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="City you ship from" value={s.city} onChange={(v) => set({ city: v })} />
          <Text label="Your PIN code" value={s.originPin} onChange={(v) => set({ originPin: v.replace(/\D/g, "").slice(0, 6) })} inputMode="numeric" hint="Delivery dates are worked out from it." />
        </div>
        <Text label="Website address" value={s.url} onChange={(v) => set({ url: v })} hint="Your domain, e.g. https://rkcreativebuilds.in (used in share previews and Google)." />
      </Card>

      <Card title="Payments">
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="UPI ID" value={s.upi.id} onChange={(v) => set({ upi: { ...s.upi, id: v.trim() } })} placeholder="name@okaxis" />
          <Text label="UPI name shown to customers" value={s.upi.payee} onChange={(v) => set({ upi: { ...s.upi, payee: v } })} />
        </div>
        <Text
          label="Card / netbanking link (optional)"
          value={s.payments.cardPayUrl}
          onChange={(v) => set({ payments: { ...s.payments, cardPayUrl: v.trim() } })}
          placeholder="https://rzp.io/l/…"
          hint="A Razorpay Payment Page or Link. Leave empty to offer UPI only."
        />
        <Switch
          label="Cash on delivery"
          checked={s.payments.cod.enabled}
          onChange={(v) => set({ payments: { ...s.payments, cod: { ...s.payments.cod, enabled: v } } })}
          hint="Not offered for personalised items."
        />
        {s.payments.cod.enabled && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Num label="COD fee" prefix="₹" value={s.payments.cod.fee} onChange={(v) => set({ payments: { ...s.payments, cod: { ...s.payments.cod, fee: v } } })} />
            <Num
              label="COD only for orders up to"
              prefix="₹"
              value={s.payments.cod.maxOrder}
              onChange={(v) => set({ payments: { ...s.payments, cod: { ...s.payments.cod, maxOrder: v } } })}
            />
          </div>
        )}
      </Card>

      <Card title="Shipping and making">
        <div className="grid gap-4 sm:grid-cols-2">
          <Num label="Shipping fee" prefix="₹" value={s.shippingFlat} onChange={(v) => set({ shippingFlat: v })} />
          <Num label="Free shipping over" prefix="₹" value={s.freeShippingOver} onChange={(v) => set({ freeShippingOver: v })} />
          <Num label="Days to print and pack (from)" value={s.dispatch[0]} onChange={(v) => set({ dispatch: [v, Math.max(v, s.dispatch[1])] })} min={1} />
          <Num label="Days to print and pack (to)" value={s.dispatch[1]} onChange={(v) => set({ dispatch: [Math.min(v, s.dispatch[0]), v] })} min={1} />
        </div>
        <Num label="Price to add a name or message" prefix="₹" value={s.engravingPrice} onChange={(v) => set({ engravingPrice: v })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Courier" value={s.tracking.courier} onChange={(v) => set({ tracking: { ...s.tracking, courier: v } })} />
          <Text
            label="Tracking page"
            value={s.tracking.url}
            onChange={(v) => set({ tracking: { ...s.tracking, url: v } })}
            hint="{awb} is replaced by the tracking number."
          />
        </div>
      </Card>

      <Card title="Business details (optional)">
        <Text label="Registered business name" value={s.business.legalName} onChange={(v) => set({ business: { ...s.business, legalName: v } })} />
        <Text label="GSTIN" value={s.business.gstin} onChange={(v) => set({ business: { ...s.business, gstin: v.toUpperCase().trim() } })} />
        <Text label="Address" multiline value={s.business.address} onChange={(v) => set({ business: { ...s.business, address: v } })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Opening hours" value={s.business.hours} onChange={(v) => set({ business: { ...s.business, hours: v } })} />
          <Text label="Reply time" value={s.business.replyTime} onChange={(v) => set({ business: { ...s.business, replyTime: v } })} />
        </div>
        <Text label="Review link" value={s.reviewUrl} onChange={(v) => set({ reviewUrl: v.trim() })} hint="Where happy customers can leave a review, e.g. your Google Business link." />
      </Card>

      <Card title="Categories">
        <ul className="space-y-2">
          {s.categories.map((c, i) => {
            const used = draft.products.filter((p) => p.category === c).length;
            return (
              <li key={i} className="flex items-center gap-2">
                <input
                  value={c}
                  aria-label={`Category ${i + 1}`}
                  onChange={(e) => {
                    const name = e.target.value;
                    // renaming moves its products along with it
                    useOwner.getState().setShop({ ...s, categories: s.categories.map((x, j) => (j === i ? name : x)) });
                    for (const p of useOwner.getState().draft!.products.filter((p) => p.category === c))
                      useOwner.getState().setProduct(p.slug, { ...p, category: name });
                  }}
                  className="flex-1 rounded-xl border border-fg/15 bg-raised px-3.5 py-2.5 outline-none focus:border-accent-2"
                />
                <span className="w-20 text-xs text-muted">{used} items</span>
                <button
                  onClick={() => (used ? alert(`Move its ${used} product(s) to another category first.`) : set({ categories: s.categories.filter((_, j) => j !== i) }))}
                  className="h-10 rounded-full border border-fg/15 px-3 text-sm"
                  aria-label={`Remove category ${c}`}
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
        <button onClick={() => set({ categories: [...s.categories, "New category"] })} className={smallBtn}>
          + Add category
        </button>
      </Card>
    </div>
  );
}
