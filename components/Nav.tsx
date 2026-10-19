"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useCart, cartCount } from "@/lib/cart";
import { site } from "@/lib/site";

const links = [
  { href: "/shop/", label: "Shop" },
  { href: "/personalise/", label: "Personalise", short: "Name it" },
  { href: "/custom/", label: "Custom" },
];

export function Nav() {
  const pathname = usePathname();
  const count = useCart((s) => cartCount(s.items));
  const setOpen = useCart((s) => s.setOpen);

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-[max(0.75rem,env(safe-area-inset-left))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 sm:pt-5">
      <nav aria-label="Main" className="mx-auto flex max-w-7xl items-center justify-between gap-1 rounded-full border border-line bg-page/50 px-1.5 py-2 backdrop-blur-xl min-[380px]:gap-3 min-[380px]:px-2">
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label={`${site.name} home`}>
          <picture className="shrink-0">
            <source type="image/webp" srcSet="/brand/logo-96.webp" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-160.jpg" alt="" width={40} height={40} className="h-9 w-9 rounded-full ring-1 ring-accent/40 min-[380px]:h-10 min-[380px]:w-10" />
          </picture>
          <span className="hidden font-display text-base leading-none tracking-wide display-case sm:block">
            <span className="holo-text">RK</span> Creative Builds
          </span>
        </Link>

        <div className="flex items-center gap-0.5 min-[380px]:gap-1 sm:gap-2">
          {links.map((l) => {
            const active = pathname.startsWith(l.href.replace(/\/$/, ""));
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap rounded-full px-1.5 py-2 text-sm font-medium transition-colors min-[380px]:px-2.5 sm:px-4 ${
                  active ? "bg-fg text-page" : "text-fg/75 hover:text-fg"
                }`}
              >
                {l.short ? (
                  <>
                    <span className="sm:hidden">{l.short}</span>
                    <span className="hidden sm:inline">{l.label}</span>
                  </>
                ) : (
                  l.label
                )}
              </Link>
            );
          })}
          <button
            data-cart-target
            onClick={() => setOpen(true)}
            className={`relative ml-0.5 flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-2 text-sm font-semibold transition-all min-[380px]:ml-1 min-[380px]:px-3 sm:px-4 hover:scale-105 active:scale-95 ${
              count ? "border-fg bg-fg text-page" : "border-fg/20 text-fg hover:border-fg/40"
            }`}
          >
            <CartIcon />
            {/* the accessible name reads "Cart 2 items", starting with what's on screen */}
            <span className="sr-only sm:not-sr-only">Cart</span>
            <AnimatePresence mode="popLayout">
              <motion.span
                key={count}
                initial={{ y: -12, opacity: 0, scale: 0.6 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 12, opacity: 0 }}
                className={`h-5 min-w-5 place-items-center rounded-full px-1 tabular-nums text-xs ${count ? "grid bg-accent text-black" : "hidden bg-fg/10 text-muted min-[380px]:grid"}`}
              >
                {count}
              </motion.span>
            </AnimatePresence>
            <span className="sr-only">{count === 1 ? "item" : "items"}</span>
          </button>
        </div>
      </nav>
    </header>
  );
}

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="20" r="1.3" />
      <circle cx="17" cy="20" r="1.3" />
    </svg>
  );
}
