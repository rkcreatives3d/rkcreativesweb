"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useCart, cartCount } from "@/lib/cart";
import { useShelf } from "@/lib/shelf";
import { useFocusTrap } from "@/lib/focus";
import { site, whatsappUrl } from "@/lib/site";
import { ownerTap } from "@/lib/ownerTap";
import { BagIcon, MenuIcon, SearchIcon } from "./Icons";
import { SearchOverlay } from "./SearchOverlay";

/** The main destinations: in the bar on wide screens, at the top of the menu on phones. */
const links = [
  { href: "/shop/", label: "Shop" },
  { href: "/collections/", label: "Collections" },
  { href: "/personalise/", label: "Personalised" },
  { href: "/custom/", label: "Custom Prints" },
  { href: "/about/", label: "About" },
];

/** Everything else, in the phone menu (and the footer). */
const more = [
  { href: "/saved/", label: "Saved" },
  { href: "/track/", label: "Track an order" },
  { href: "/reviews/", label: "Customer reviews" },
  { href: "/guides/", label: "Guides" },
  { href: "/contact/", label: "Contact us" },
];

const isActive = (pathname: string, href: string) => pathname.startsWith(href.replace(/\/$/, ""));

/**
 * The slim bar at the top of every page: the brand, five destinations, search
 * and the bag. Under 1024 px the destinations move into a full-screen menu.
 */
export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const count = useCart((s) => cartCount(s.items));
  const setOpen = useCart((s) => s.setOpen);
  const saved = useShelf((s) => s.saved.length);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  useFocusTrap(panel, menu);
  const closeSearch = useCallback(() => setSearch(false), []);

  // menus close on navigation
  useEffect(() => {
    setMenu(false);
    setSearch(false);
  }, [pathname]);
  // the phone menu: Esc closes it; the page behind doesn't scroll
  useEffect(() => {
    if (!menu) return;
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMenu(false);
      menuBtn.current?.focus();
    };
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", key);
    return () => {
      document.documentElement.style.overflow = prev;
      window.removeEventListener("keydown", key);
    };
  }, [menu]);

  return (
    <header className="fixed inset-x-0 top-0 z-40 pt-[env(safe-area-inset-top)]">
      <div className="nav-glass border-b border-line bg-page">
        <nav
          aria-label="Main"
          className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-4 px-[max(1rem,env(safe-area-inset-left))] sm:h-[3.25rem] sm:px-6"
        >
          <Link
            href="/"
            // on the home page, 5 taps here open the owner page (lib/ownerTap.ts)
            onClick={(e) => {
              if (pathname !== "/" || !ownerTap(e.timeStamp)) return;
              e.preventDefault(); // instead of the link's own "go home"
              router.push("/owner/");
            }}
            className="-ml-1 flex shrink-0 touch-manipulation items-center gap-2.5 rounded-lg p-1"
            aria-label={`${site.name} home`}
          >
            {/* the logo's emblem (printer, RK, spool): the full logo is unreadable this small */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/mark-80.webp" srcSet="/brand/mark-80.webp 1x, /brand/mark-160.webp 2x" alt="" width={28} height={28} className="h-7 w-7 shrink-0 rounded-full" />
            <span className="hidden text-[0.9375rem] font-semibold tracking-tight min-[360px]:inline">{site.name}</span>
          </Link>

          <ul className="hidden items-center gap-8 lg:flex">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={isActive(pathname, l.href) ? "page" : undefined}
                  className="py-2 text-[0.8125rem] text-fg/80 transition-colors hover:text-fg aria-[current=page]:font-medium aria-[current=page]:text-fg"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="-mr-2 flex items-center">
            <button
              onClick={() => {
                setMenu(false);
                setSearch((v) => !v);
              }}
              aria-expanded={search}
              className="grid h-10 w-10 place-items-center rounded-full text-fg/80 transition-colors hover:text-fg"
            >
              <SearchIcon size={18} />
              <span className="sr-only">Search</span>
            </button>
            <button
              data-cart-target
              onClick={() => setOpen(true)}
              className="relative grid h-10 w-10 place-items-center rounded-full text-fg/80 transition-colors hover:text-fg"
            >
              <BagIcon size={19} />
              {/* the accessible name reads "Cart 2 items" */}
              <span className="sr-only">Cart</span>
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    aria-hidden
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    className="absolute bottom-1.5 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-fg px-1 text-[10px] font-semibold tabular-nums leading-none text-page"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
              <span className="sr-only">
                {count} {count === 1 ? "item" : "items"}
              </span>
            </button>
            <button
              ref={menuBtn}
              onClick={() => {
                setSearch(false);
                setMenu((v) => !v);
              }}
              aria-expanded={menu}
              aria-controls="site-menu"
              className="grid h-10 w-10 place-items-center rounded-full text-fg/80 transition-colors hover:text-fg lg:hidden"
            >
              <MenuIcon open={menu} size={18} />
              <span className="sr-only">Menu</span>
            </button>
          </div>
        </nav>
      </div>

      <SearchOverlay open={search} onClose={closeSearch} />

      <AnimatePresence>
        {menu && (
          <motion.div
            ref={panel}
            id="site-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 bottom-0 top-[calc(3rem+env(safe-area-inset-top))] overflow-y-auto overscroll-contain bg-page px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6 sm:top-[calc(3.25rem+env(safe-area-inset-top))] lg:hidden"
          >
            <nav aria-label="More" className="mx-auto max-w-xl">
              <ul>
                {links.map((l, i) => (
                  <motion.li key={l.href} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i, duration: 0.25 }}>
                    <Link
                      href={l.href}
                      aria-current={isActive(pathname, l.href) ? "page" : undefined}
                      className="block py-2 text-[1.75rem] font-semibold tracking-tight text-fg/90 hover:text-fg"
                    >
                      {l.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
              <ul className="mt-8 space-y-0.5 border-t border-line pt-6">
                {more.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="flex items-center justify-between py-2 text-[0.9375rem] text-fg/80 hover:text-fg">
                      {l.label}
                      {l.href === "/saved/" && saved > 0 && <span className="tabular-nums text-sm text-muted">{saved}</span>}
                    </Link>
                  </li>
                ))}
                <li>
                  <a
                    href={whatsappUrl(`Hi ${site.name}! I have a question.`)}
                    target="_blank"
                    rel="noreferrer"
                    className="block py-2 text-[0.9375rem] font-medium text-accent"
                  >
                    Chat on WhatsApp
                  </a>
                </li>
              </ul>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
