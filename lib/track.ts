// Analytics events. Sent to Plausible and/or GA4 when they're set up in
// lib/site.ts; otherwise nothing happens. Never include names, phone numbers
// or addresses in event props.

export type TrackEvent =
  | "add_to_cart"
  | "buy_now"
  | "begin_checkout"
  | "order_sent"
  | "whatsapp_click"
  | "custom_request"
  | "ar_view"
  | "pin_check"
  | "save"
  | "share"
  | "review_sent";

type Props = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: Props; revenue?: { currency: string; amount: number } }) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

export function track(event: TrackEvent, props: Props = {}) {
  if (typeof window === "undefined") return;
  const clean = Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined));
  try {
    window.plausible?.(event, { props: clean });
    window.gtag?.("event", event, clean);
  } catch {}
  if (process.env.NODE_ENV === "development") console.debug("[track]", event, clean);
}
