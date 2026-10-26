"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart, cartCount } from "@/lib/cart";
import { useShelf } from "@/lib/shelf";
import { openSearch, tabBarOn } from "@/lib/tabbar";
import { BagIcon, HeartIcon, HomeIcon, SearchIcon, ShopIcon } from "./Icons";

const item = "relative flex h-full w-full flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-medium leading-none transition-colors";

/**
 * Phones and tablets (under 1024 px): the shop's main places along the bottom,
 * in reach of a thumb, like a shopping app. Computers use the top bar instead.
 * It steps aside while the keyboard is up, so it never covers a form field.
 */
export function TabBar() {
  const pathname = usePathname();
  const count = useCart((s) => cartCount(s.items));
  const setOpen = useCart((s) => s.setOpen);
  const saved = useShelf((s) => s.saved.length);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const field = (t: EventTarget | null) => t instanceof HTMLElement && t.matches("input:not([type=checkbox],[type=radio],[type=range],[type=file]),textarea,[contenteditable]");
    const on = (e: FocusEvent) => field(e.target) && setTyping(true);
    const off = (e: FocusEvent) => field(e.target) && setTyping(false);
    document.addEventListener("focusin", on);
    document.addEventListener("focusout", off);
    return () => {
      document.removeEventListener("focusin", on);
      document.removeEventListener("focusout", off);
    };
  }, []);

  if (!tabBarOn(pathname)) return null;
  const home = pathname === "/";
  const shop = /^\/(shop|collections)(\/|$)/.test(pathname);
  const savedPage = /^\/saved(\/|$)/.test(pathname);
  const tone = (on: boolean) => (on ? "text-fg" : "text-muted hover:text-fg");

  return (
    <nav
      id="tabbar"
      aria-label="Shortcuts"
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-page pb-[env(safe-area-inset-bottom)] transition-transform duration-200 lg:hidden ${typing ? "translate-y-full" : ""}`}
    >
      <ul className="mx-auto grid h-14 max-w-xl grid-cols-5">
        <li>
          <Link href="/" aria-current={home ? "page" : undefined} className={`${item} ${tone(home)}`}>
            <HomeIcon filled={home} />
            Home
          </Link>
        </li>
        <li>
          <Link href="/shop/" aria-current={shop ? "page" : undefined} className={`${item} ${tone(shop)}`}>
            <ShopIcon filled={shop} />
            Shop
          </Link>
        </li>
        <li>
          <button onClick={openSearch} className={`${item} ${tone(false)}`}>
            <SearchIcon size={22} />
            Search
          </button>
        </li>
        <li>
          <Link href="/saved/" aria-current={savedPage ? "page" : undefined} className={`${item} ${tone(savedPage)}`}>
            <HeartIcon size={22} filled={savedPage} />
            Saved
            {saved > 0 && <Badge n={saved} />}
          </Link>
        </li>
        <li>
          <button data-cart-target onClick={() => setOpen(true)} className={`${item} ${tone(false)}`}>
            <BagIcon size={22} />
            Bag
            {count > 0 && <Badge n={count} />}
            <span className="sr-only">
              , {count} {count === 1 ? "item" : "items"}
            </span>
          </button>
        </li>
      </ul>
    </nav>
  );
}

function Badge({ n }: { n: number }) {
  return (
    <span aria-hidden className="absolute left-1/2 top-1.5 ml-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-fg px-1 text-[10px] font-semibold tabular-nums leading-none text-page">
      {n}
    </span>
  );
}
