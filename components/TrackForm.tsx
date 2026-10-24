"use client";

import { useEffect, useState } from "react";
import { loadOrder } from "@/lib/order";
import { site, whatsappUrl } from "@/lib/site";

/** Two ways to check on an order: the courier's tracking page, or ask us on WhatsApp. */
export function TrackForm() {
  const [awb, setAwb] = useState("");
  const [orderId, setOrderId] = useState("");
  useEffect(() => {
    const last = loadOrder();
    if (last) setOrderId(last.id);
  }, []);

  const field =
    "mt-1.5 w-full rounded-xl border border-line bg-page px-4 py-3 text-fg outline-none transition-colors placeholder:text-fg/50 focus:border-fg/60 focus:ring-4 focus:ring-fg/[0.06]";

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <form
        className="rounded-[var(--radius-tile)] bg-page-2 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          const id = awb.trim();
          if (id) window.open(site.tracking.url.replace("{awb}", encodeURIComponent(id)), "_blank", "noopener");
        }}
      >
        <h2 className="text-xl font-semibold tracking-tight">Have a tracking number?</h2>
        <p className="mt-1 text-sm text-muted">We send it on WhatsApp once your order ships.</p>
        <label className="mt-4 block text-sm">
          <span className="text-muted">{site.tracking.courier} tracking number</span>
          <input value={awb} onChange={(e) => setAwb(e.target.value)} required autoComplete="off" placeholder="e.g. 1234567890" className={field} />
        </label>
        <button type="submit" className="btn btn-primary mt-4 w-full">
          Track on {site.tracking.courier} →
        </button>
      </form>

      <form
        className="rounded-[var(--radius-tile)] bg-page-2 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          const id = orderId.trim().toUpperCase();
          window.open(whatsappUrl(`Hi ${site.name}! Could you tell me the status of my order ${id || "(order number)"}?`), "_blank", "noopener");
        }}
      >
        <h2 className="text-xl font-semibold tracking-tight">Not shipped yet?</h2>
        <p className="mt-1 text-sm text-muted">Ask us where it is in the print queue.</p>
        <label className="mt-4 block text-sm">
          <span className="text-muted">Order number</span>
          <input value={orderId} onChange={(e) => setOrderId(e.target.value)} autoComplete="off" placeholder={`e.g. ${site.orderPrefix}-4F2K9A`} className={field} />
        </label>
        <button type="submit" className="btn mt-4 w-full">
          Ask on WhatsApp
        </button>
      </form>
    </div>
  );
}
