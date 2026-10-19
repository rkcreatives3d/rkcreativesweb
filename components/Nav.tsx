"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useCart, cartCount } from "@/lib/cart";
import { site } from "@/lib/site";
import { Monogram } from "./Monogram";

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
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-6 sm:pt-5">
      <nav aria-label="Main" className="mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-full border border-fg/10 bg-page/50 py-2 pl-2 pr-2 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2.5 pl-2" aria-label={`${site.name} home`}>
          <Monogram className="h-7 w-auto shrink-0 sm:h-8" />
          <span className="hidden font-display text-base leading-none tracking-wide display-case sm:block">Creative Builds</span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          {links.map((l) => {
            const active = pathname.startsWith(l.href.replace(/\/$/, ""));
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap rounded-full px-2.5 py-2 text-sm font-medium transition-colors sm:px-4 ${
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
            className="relative ml-1 flex items-center gap-2 rounded-full bg-fg px-4 py-2 text-sm font-semibold text-page transition-transform hover:scale-105 active:scale-95"
            aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
          >
            <CartIcon />
            <span className="hidden sm:inline">Cart</span>
            <AnimatePresence mode="popLayout">
              <motion.span
                key={count}
                initial={{ y: -12, opacity: 0, scale: 0.6 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 12, opacity: 0 }}
                className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 tabular-nums text-xs text-page"
              >
                {count}
              </motion.span>
            </AnimatePresence>
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
