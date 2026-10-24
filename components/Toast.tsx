"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useCart } from "@/lib/cart";
import { useToast } from "@/lib/toast";

/**
 * The confirmation that pops up after a quick add (e.g. "+" on a product
 * card): what was added, with "View cart" and "Checkout". Disappears after a
 * few seconds; announced to screen readers.
 */
export function ToastHost() {
  const toast = useToast((s) => s.toast);
  const hide = useToast((s) => s.hide);
  const setOpen = useCart((s) => s.setOpen);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(hide, 4500);
    return () => clearTimeout(id);
  }, [toast, hide]);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-0 z-[55] flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-6">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            role="status"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-fg bg-fg p-2.5 pr-3 text-page shadow-[0_16px_40px_-12px_rgba(0,0,0,0.8)]"
          >
            {toast.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={toast.image} alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-xl bg-page object-cover" />
            ) : (
              <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-page/10 text-lg">
                ✓
              </span>
            )}
            <p className="min-w-0 flex-1 text-sm leading-snug">
              <span className="block font-semibold">{toast.title}</span>
              {toast.detail && <span className="block truncate text-xs text-page/70">{toast.detail}</span>}
            </p>
            {toast.cart && (
              <>
                <button
                  onClick={() => {
                    hide();
                    setOpen(true);
                  }}
                  className="shrink-0 rounded-full border border-page/25 px-3 py-2 text-xs font-semibold hover:border-page"
                >
                  View cart
                </button>
                <Link href="/checkout/" onClick={hide} className="shrink-0 rounded-full bg-accent-fill px-3 py-2 text-xs font-semibold text-on-accent">
                  Checkout
                </Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
