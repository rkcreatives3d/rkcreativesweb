"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { getProduct } from "@/lib/products";
import { site, whatsappUrl } from "@/lib/site";
import { WhatsAppIcon } from "./CheckoutForm";

/**
 * Floating "chat with us" button. Appears once you scroll, pre-filled with the
 * page you're on. Not on product pages (their buy bar has WhatsApp) or checkout.
 * Phones: bottom-left, clear of the "+" buttons on the product cards.
 */
export function WhatsAppBubble() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  // appears after a good scroll and stays out of the footer (which has its own
  // WhatsApp link). While you scroll down (reading) it tucks away so it never sits on
  // prices and buttons; scrolling up brings it back. On wider screens, where it sits in
  // the margin, it also comes back when you pause.
  useEffect(() => {
    let last = window.scrollY;
    let idle = 0;
    let atFooter = false;
    const wide = window.matchMedia("(min-width: 640px)");
    const allowed = () => window.scrollY > window.innerHeight * 1.2 && !atFooter;
    const onScroll = () => {
      const y = window.scrollY;
      if (y < last - 2) setShow(allowed());
      else if (y > last + 2) setShow(false);
      else if (!allowed()) setShow(false);
      last = y;
      clearTimeout(idle);
      if (wide.matches) idle = window.setTimeout(() => setShow(allowed()), 900);
    };
    const footer = document.querySelector("footer");
    const io = new IntersectionObserver(([e]) => {
      atFooter = e.isIntersecting;
      if (atFooter) setShow(false);
    });
    if (footer) io.observe(footer);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(idle);
      io.disconnect();
    };
  }, [pathname]);

  if (pathname.startsWith("/checkout") || getProduct(pathname.split("/")[2] ?? "")) return null;
  const text = `Hi ${site.name}! I have a question.`;

  return (
    <AnimatePresence>
      {show && (
        <motion.a
          href={whatsappUrl(text)}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat with us on WhatsApp"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))] z-[45] sm:left-auto sm:right-[max(1rem,env(safe-area-inset-right))] grid h-11 w-11 place-items-center rounded-full border border-fg bg-fg text-[#25D366] shadow-[0_8px_24px_-6px_rgba(42,33,25,0.45)] transition-colors hover:border-[#25D366]/60 sm:bottom-7 sm:right-7"
        >
          <span className="relative scale-125">
            <WhatsAppIcon />
          </span>
        </motion.a>
      )}
    </AnimatePresence>
  );
}
