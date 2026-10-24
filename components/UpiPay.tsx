"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { formatPrice, site, upiUrl } from "@/lib/site";

/** UPI ID still the placeholder from lib/site.ts? */
const notSetUp = site.upi.id.startsWith("yourname");

/**
 * Pay-now step shown after an order is sent: a UPI QR code with the amount
 * filled in, the UPI ID to copy, and (on phones) a button that opens the
 * customer's UPI app directly.
 */
export function UpiPay({ amount, orderId }: { amount: number; orderId: string }) {
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [phone, setPhone] = useState(false);
  const link = upiUrl(amount, `Order ${orderId}`);

  useEffect(() => {
    setPhone(window.matchMedia("(pointer: coarse)").matches);
    QRCode.toDataURL(link, { margin: 1, width: 480, color: { dark: "#000000", light: "#ffffff" } }).then(setQr, () => setQr(null));
  }, [link]);

  // keep the placeholder out of the live site; show it while developing
  if (notSetUp && process.env.NODE_ENV === "production") return null;

  return (
    <div className="mx-auto mt-8 max-w-md rounded-[var(--radius-tile)] bg-page-2 p-6 text-left">
      <p className="text-sm font-semibold text-accent">Pay now with UPI (optional)</p>
      <p className="mt-2 text-sm text-muted">
        Pay {formatPrice(amount)} now to lock in your print slot, or wait for us to confirm on WhatsApp. Please send the
        payment screenshot in the chat.
      </p>
      {notSetUp && (
        <p className="mt-3 rounded-xl border border-accent/40 bg-accent/10 p-3 text-xs text-accent">
          Developer note: set your real UPI ID in lib/site.ts. This box is hidden on the live site until you do.
        </p>
      )}
      <div className="mt-5 flex items-center gap-5">
        <div className="grid h-36 w-36 shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-2">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt={`UPI QR code to pay ${formatPrice(amount)}`} className="h-full w-full" />
          ) : (
            <span className="text-xs text-black/50">QR…</span>
          )}
        </div>
        <div className="min-w-0 space-y-3">
          <p className="text-xs text-muted">Scan with GPay, PhonePe, Paytm or any UPI app</p>
          <button
            onClick={() => navigator.clipboard?.writeText(site.upi.id).then(() => setCopied(true))}
            className="block w-full truncate rounded-xl border border-line px-3 py-2 text-left tabular-nums text-sm hover:border-accent"
          >
            {copied ? "Copied ✓" : site.upi.id}
          </button>
          {phone && (
            <a href={link} className="btn w-full !py-2.5 text-sm">
              Pay {formatPrice(amount)} in UPI app
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
