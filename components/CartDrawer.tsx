"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useLenis } from "lenis/react";
import { optionsLabel } from "@/lib/personalise";
import { useCart, cartSubtotal, lineTotal } from "@/lib/cart";
import { getFinish, getProduct } from "@/lib/products";
import { formatPrice, shippingFor, site } from "@/lib/site";
import { useFocusTrap } from "@/lib/focus";
import { Swatch } from "./ui";
import { ProductThumb } from "./ProductMedia";
import { DeliveryEstimate } from "./Delivery";

export function CartDrawer() {
  const { items, open, setOpen, setQty, remove } = useCart();
  const lenis = useLenis();
  const subtotal = cartSubtotal(items);
  const shipping = shippingFor(subtotal);
  const toFree = Math.max(0, site.freeShippingOver - subtotal);
  const panel = useRef<HTMLElement>(null);
  useFocusTrap(panel, open);

  useEffect(() => {
    if (open) lenis?.stop();
    else lenis?.start();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, lenis, setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            key="panel"
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label="Cart"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-line bg-page/95 backdrop-blur-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 32 }}
          >
            <div className="flex items-center justify-between border-b border-fg/10 px-6 py-5">
              <h2 className="font-display text-2xl font-bold">Your cart</h2>
              <button
                onClick={() => setOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-full border border-fg/15 text-lg hover:bg-fg hover:text-page"
                aria-label="Close cart"
              >
                ✕
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
                <p className="font-display text-3xl font-bold">Nothing printed yet.</p>
                <p className="text-muted">Your cart is empty.</p>
                <Link href="/shop/" onClick={() => setOpen(false)} className="btn btn-primary">
                  Browse the shop →
                </Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 space-y-3 overflow-y-auto px-6 py-5" data-lenis-prevent>
                  <AnimatePresence initial={false}>
                    {items.map((i) => {
                      const p = getProduct(i.slug);
                      if (!p) return null;
                      const f = getFinish(i.finish);
                      const size = p.sizes.find((s) => s.id === i.size);
                      return (
                        <motion.li
                          key={i.key}
                          layout
                          initial={{ opacity: 0, x: 40 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 40, height: 0, marginTop: 0 }}
                          className="flex gap-4 rounded-xl border border-line bg-surface p-4"
                        >
                          <ProductThumb product={p} finish={i.finish} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <Link
                                href={`/shop/${p.slug}/`}
                                onClick={() => setOpen(false)}
                                className="truncate font-semibold hover:text-accent"
                              >
                                {p.name}
                              </Link>
                              <span className="shrink-0 tabular-nums text-sm">{formatPrice(lineTotal(i))}</span>
                            </div>
                            <p className="mt-1 flex items-center gap-2 text-xs text-muted">
                              <Swatch css={f.swatch} size={12} /> {f.name} · {size?.label}
                            </p>
                            {i.engraving && (
                              <p className="mt-1 truncate text-xs text-pop">
                                “{i.engraving}”{optionsLabel(i.options) && ` · ${optionsLabel(i.options)}`}
                              </p>
                            )}
                            <div className="mt-3 flex items-center justify-between">
                              <Stepper value={i.qty} min={0} onChange={(q) => setQty(i.key, q)} />
                              <button onClick={() => remove(i.key)} className="text-xs text-muted underline-offset-4 hover:text-accent hover:underline">
                                Remove
                              </button>
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>

                <div className="space-y-4 border-t border-line px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5">
                  <div>
                    <p className="mb-2 text-xs text-muted">
                      {toFree > 0 ? (
                        <>
                          Add <span className="text-fg">{formatPrice(toFree)}</span> more for free shipping
                        </>
                      ) : (
                        <span className="text-pop">Free shipping unlocked ✦</span>
                      )}
                    </p>
                    <div className="h-1.5 overflow-hidden rounded-full bg-fg/10">
                      <motion.div
                        className="h-full rounded-full bg-pop"
                        animate={{ width: `${Math.min(100, (subtotal / site.freeShippingOver) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <Row label="Subtotal" value={formatPrice(subtotal)} />
                    <Row label="Shipping" value={shipping === 0 ? "Free" : formatPrice(shipping)} />
                    <div className="flex justify-between pt-2 font-display text-xl font-bold">
                      <span>Total</span>
                      <span>{formatPrice(subtotal + shipping)}</span>
                    </div>
                  </div>
                  <Link href="/checkout/" onClick={() => setOpen(false)} className="btn btn-primary w-full">
                    Checkout →
                  </Link>
                  <DeliveryEstimate className="text-center text-xs text-muted" />
                  <p className="text-center text-xs text-muted">You&apos;ll confirm your order on WhatsApp or by email.</p>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted">
      <span>{label}</span>
      <span className="tabular-nums text-fg">{value}</span>
    </div>
  );
}

export function Stepper({ value, onChange, min = 1 }: { value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <div className="inline-flex items-center rounded-full border border-fg/15">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="grid h-8 w-8 place-items-center rounded-full hover:bg-fg/10 disabled:opacity-30"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="w-7 text-center tabular-nums text-sm">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(99, value + 1))}
        className="grid h-8 w-8 place-items-center rounded-full hover:bg-fg/10"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
