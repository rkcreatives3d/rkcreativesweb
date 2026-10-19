"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadOrder, type OrderSnapshot } from "@/lib/order";
import { formatPrice, site } from "@/lib/site";
import { ButtonLink } from "./ui";
import { UpiPay } from "./UpiPay";

/** After checkout: what happens next, a resend button, UPI payment and a printable summary. */
export function OrderConfirmation() {
  const [order, setOrder] = useState<OrderSnapshot | null | undefined>(undefined);
  useEffect(() => setOrder(loadOrder()), []);

  if (order === undefined) return <div className="min-h-[50svh]" />;
  if (!order) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <h1 className="font-display text-4xl font-extrabold display-case">No recent order</h1>
        <p className="mt-3 text-muted">Orders you send from this browser show up here.</p>
        <div className="mt-8">
          <ButtonLink href="/shop/" primary>
            Browse the shop →
          </ButtonLink>
        </div>
      </div>
    );
  }

  const app = order.via === "whatsapp" ? "WhatsApp" : "your email app";
  const steps: [string, string][] = [
    ["Send it", `${order.via === "whatsapp" ? "WhatsApp" : "Your email app"} opened with your order filled in. Hit send there, or nothing reaches us.`],
    ["We confirm", "We reply, usually within a few hours, to confirm colours, sizes and the total."],
    [
      "You pay",
      order.pay === "cod"
        ? "Cash to the courier when it arrives. Please keep the exact amount ready."
        : order.pay === "card"
          ? "By card, netbanking or wallet on Razorpay. Payment locks in your print slot."
          : "By UPI or bank transfer. Payment locks in your print slot.",
    ],
    ["We print and ship", `Printed, checked and packed by hand. Expected delivery ${order.delivery}.`],
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <p className="tabular-nums text-xs uppercase tracking-[0.12em] text-pop">Order {order.id}</p>
      <h1 className="mt-3 font-display text-5xl font-extrabold display-case leading-[0.9] tracking-tight sm:text-7xl">
        Thanks{order.name ? `, ${order.name}` : ""}!
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted">Your order is drafted. One step left: send the message in {app}.</p>

      <ol className="mt-10 grid gap-3 sm:grid-cols-2">
        {steps.map(([title, text], i) => (
          <li key={title} className={`rounded-2xl border p-5 ${i === 0 ? "border-accent/50 bg-accent/[0.06]" : "border-line bg-surface"}`}>
            <p className="flex items-center gap-3 font-semibold">
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm tabular-nums ${
                  i === 0 ? "bg-accent text-black" : "bg-fg/10 text-fg"
                }`}
              >
                {i + 1}
              </span>
              {title}
            </p>
            <p className="mt-2 text-sm text-muted">{text}</p>
          </li>
        ))}
      </ol>

      <div className="mt-6 flex flex-wrap gap-3 print:hidden">
        <ButtonLink href={order.url} target="_blank" rel="noreferrer" primary>
          {order.via === "whatsapp" ? "Open WhatsApp again" : "Open email again"}
        </ButtonLink>
        <button onClick={() => window.print()} className="btn">
          Print / save as PDF
        </button>
      </div>

      <div className="print:hidden">
        {order.pay === "cod" ? (
          <p className="mx-auto mt-8 max-w-md rounded-[28px] border border-line bg-surface p-6 text-sm text-muted">
            <span className="block font-semibold text-fg">Cash on delivery</span>
            Pay {formatPrice(order.total)} to the courier when your order arrives.
          </p>
        ) : order.pay === "card" && site.payments.cardPayUrl ? (
          <div className="mx-auto mt-8 max-w-md rounded-[28px] border border-line bg-surface p-6 text-sm">
            <p className="font-semibold">Pay by card, netbanking or wallet</p>
            <p className="mt-1 text-muted">
              Opens Razorpay&apos;s secure page. Enter {formatPrice(order.total)} and your order number <span className="text-fg">{order.id}</span>.
            </p>
            <a href={site.payments.cardPayUrl} target="_blank" rel="noreferrer" className="btn mt-4 w-full">
              Pay {formatPrice(order.total)} on Razorpay →
            </a>
          </div>
        ) : (
          <UpiPay amount={order.total} orderId={order.id} />
        )}
      </div>

      <section className="mt-10 rounded-[28px] border border-line bg-surface p-6" aria-labelledby="summary">
        <h2 id="summary" className="font-display text-2xl font-bold">
          Summary
        </h2>
        <ul className="mt-4 divide-y divide-fg/10">
          {order.lines.map((l, i) => (
            <li key={i} className="flex justify-between gap-4 py-3">
              <span className="min-w-0">
                <span className="font-semibold">{l.name}</span> <span className="tabular-nums text-sm text-muted">×{l.qty}</span>
                <span className="block text-sm text-muted">{l.detail}</span>
              </span>
              <span className="tabular-nums">{formatPrice(l.total)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-2 space-y-1 border-t border-fg/10 pt-4 text-sm text-muted">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="tabular-nums text-fg">{formatPrice(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd className="tabular-nums text-fg">{order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</dd>
          </div>
          {order.codFee ? (
            <div className="flex justify-between">
              <dt>Cash on delivery fee</dt>
              <dd className="tabular-nums text-fg">{formatPrice(order.codFee)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between pt-2 font-display text-2xl font-bold text-fg">
            <dt>Total</dt>
            <dd>{formatPrice(order.total)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-muted">
          Drafted {new Date(order.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}. Prices are confirmed when we
          reply.
        </p>
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 print:hidden">
        <ButtonLink href="/shop/">← Keep shopping</ButtonLink>
        <Link href="/track/" className="py-2 text-sm font-semibold text-accent hover:underline">
          Track an order →
        </Link>
        {site.reviewUrl && (
          <a href={site.reviewUrl} target="_blank" rel="noreferrer" className="py-2 text-sm font-semibold text-accent hover:underline">
            Already got it? Leave a review →
          </a>
        )}
      </div>
    </div>
  );
}
