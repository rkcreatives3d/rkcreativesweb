"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { getProduct } from "@/lib/products";
import { site, whatsappUrl } from "@/lib/site";
import { WhatsAppIcon } from "./CheckoutForm";

/** Floating "chat with us" button. Appears once you scroll, pre-filled with the page you're on. */
export function WhatsAppBubble() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  if (pathname.startsWith("/checkout")) return null;
  const product = getProduct(pathname.split("/")[2] ?? "");
  const text = product
    ? `Hi ${site.name}! I have a question about the ${product.name}. ${site.url}/shop/${product.slug}/`
    : `Hi ${site.name}! I have a question.`;

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
          whileHover={{ scale: 1.08 }}
          className="fixed bottom-5 right-5 z-[45] grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-black shadow-[0_10px_30px_-5px_rgba(37,211,102,0.5)] sm:bottom-7 sm:right-7"
        >
          <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-20" aria-hidden />
          <span className="relative scale-150">
            <WhatsAppIcon />
          </span>
        </motion.a>
      )}
    </AnimatePresence>
  );
}
