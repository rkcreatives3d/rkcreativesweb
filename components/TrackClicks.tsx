"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

/** Counts every WhatsApp link click on the site, wherever the link is, with the page it came from. */
export function TrackClicks() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href^='https://wa.me/']");
      if (a) track("whatsapp_click", { page: location.pathname });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}
