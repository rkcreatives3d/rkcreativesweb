"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useCart, cartCount } from "@/lib/cart";
import { useShelf } from "@/lib/shelf";
import { site, whatsappUrl } from "@/lib/site";
import { HeartIcon, MenuIcon } from "./Icons";
import { ownerTap } from "@/lib/ownerTap";

const links = [
  { href: "/shop/", label: "Shop" },
  { href: "/personalise/", label: "Personalise", short: "Name it" },
  // on the narrowest phones "Custom" moves into the menu, so the bar still fits
  { href: "/custom/", label: "Custom", wide: true },
];

/** Everything else, behind "Menu". */
const more = [
  { href: "/custom/", label: "Custom prints" },
  { href: "/about/", label: "About us" },
  { href: "/guides/", label: "Guides" },
  { href: "/track/", label: "Track an order" },
  { href: "/contact/", label: "Contact us" },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const count = useCart((s) => cartCount(s.items));
  const setOpen = useCart((s) => s.setOpen);
  const saved = useShelf((s) => s.saved.length);
  const [menu, setMenu] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  // the menu closes on navigation, Esc, or a tap anywhere else
  useEffect(() => setMenu(false), [pathname]);
  useEffect(() => {
    if (!menu) return;
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMenu(false);
      menuBtn.current?.focus();
    };
    const away = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !menuBtn.current?.contains(t)) setMenu(false);
    };
    window.addEventListener("keydown", key);
    window.addEventListener("pointerdown", away);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("pointerdown", away);
    };
  }, [menu]);

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-[max(0.75rem,env(safe-area-inset-left))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 sm:pt-5">
      <nav aria-label="Main" className="mx-auto flex max-w-7xl items-center justify-between gap-1 nav-glass rounded-full border border-line bg-page/50 px-1.5 py-2 backdrop-blur-xl min-[380px]:gap-3 min-[380px]:px-2">
        <Link
          href="/"
          // on the home page, 5 taps here open the owner page too (like the big logo)
          onClick={(e) => {
            if (pathname !== "/" || !ownerTap()) return;
            e.preventDefault(); // instead of the link's own "go home"
            router.push("/owner/");
          }}
          className="flex shrink-0 touch-manipulation items-center gap-3"
          aria-label={`${site.name} home`}
        >
          {/* the logo's emblem (printer, RK, spool): the full logo is unreadable this small */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/mark-80.webp"
            srcSet="/brand/mark-80.webp 1x, /brand/mark-160.webp 2x"
            alt=""
            width={40}
            height={40}
            className="h-9 w-9 shrink-0 rounded-full ring-1 ring-accent/40 min-[380px]:h-10 min-[380px]:w-10"
          />
          {/* the name fits beside the links from tablet width up */}
          <span className="hidden font-display text-base leading-none tracking-wide display-case md:block">
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
                className={`whitespace-nowrap rounded-full px-1.5 py-2 text-sm font-medium transition-colors min-[380px]:px-2.5 md:px-4 ${
                  active ? "bg-fg text-page" : "text-fg/75 hover:text-fg"
                } ${l.wide ? "hidden min-[430px]:inline-block" : ""}`}
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
                className={`h-5 min-w-5 place-items-center rounded-full px-1 tabular-nums text-xs ${count ? "grid bg-accent-fill text-on-accent" : "hidden bg-fg/10 text-muted min-[380px]:grid"}`}
              >
                {count}
              </motion.span>
            </AnimatePresence>
            <span className="sr-only">{count === 1 ? "item" : "items"}</span>
          </button>
          <button
            ref={menuBtn}
            onClick={() => setMenu((v) => !v)}
            aria-expanded={menu}
            aria-controls="more-menu"
            className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full border border-fg/20 text-fg transition-colors hover:border-fg/40 min-[380px]:h-10 min-[380px]:w-10"
          >
            <MenuIcon open={menu} />
            <span className="sr-only">Menu</span>
            {saved > 0 && !menu && <span aria-hidden className="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {menu && (
          <motion.div
            ref={panel}
            id="more-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="mx-auto mt-2 max-w-7xl"
          >
            <nav aria-label="More" className="ml-auto w-full rounded-3xl border border-line bg-raised p-2 shadow-[0_20px_50px_-20px_rgba(42,33,25,0.5)] sm:w-72">
              <Link href="/saved/" className="flex items-center justify-between rounded-2xl px-4 py-3 font-semibold hover:bg-fg/5">
                <span className="flex items-center gap-2.5">
                  <span className="text-danger">
                    <HeartIcon size={16} filled={saved > 0} />
                  </span>
                  Saved
                </span>
                <span className="tabular-nums text-sm text-muted">{saved}</span>
              </Link>
              <div className="my-1 h-px bg-line" />
              {more.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={pathname.startsWith(l.href.replace(/\/$/, "")) ? "page" : undefined}
                  className={`block rounded-2xl px-4 py-3 hover:bg-fg/5 aria-[current=page]:font-semibold ${l.href === "/custom/" ? "min-[430px]:hidden" : ""}`}
                >
                  {l.label}
                </Link>
              ))}
              <div className="my-1 h-px bg-line" />
              <a
                href={whatsappUrl(`Hi ${site.name}! I have a question.`)}
                target="_blank"
                rel="noreferrer"
                className="block rounded-2xl px-4 py-3 font-semibold text-ok hover:bg-fg/5"
              >
                Chat on WhatsApp
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
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
