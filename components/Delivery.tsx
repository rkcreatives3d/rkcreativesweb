"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { deliveryQuote, validPin, zoneFor } from "@/lib/delivery";
import { track } from "@/lib/track";
import { TruckIcon } from "./Icons";
import { formatPrice } from "@/lib/site";

/** The visitor's PIN code, remembered so checkout is pre-filled after a "Check delivery". */
export const usePin = create<{ pin: string; setPin: (pin: string) => void }>()(
  persist((set) => ({ pin: "", setPin: (pin) => set({ pin }) }), { name: "rk-pin", skipHydration: true }),
);

/** Rehydrate the saved PIN once on the client (persisted stores skip hydration to keep SSR stable). */
function useSavedPin() {
  const pin = usePin((s) => s.pin);
  useEffect(() => {
    if (!usePin.persist.hasHydrated()) usePin.persist.rehydrate();
  }, []);
  return pin;
}

/** "Delivered by …" — computed in the visitor's browser so the date is never stale. */
export function DeliveryEstimate({ className = "", pin, inline }: { className?: string; pin?: string; inline?: boolean }) {
  const saved = useSavedPin();
  const [quote, setQuote] = useState<ReturnType<typeof deliveryQuote> | null>(null);
  const use = pin ?? saved;
  useEffect(() => setQuote(deliveryQuote(use)), [use]);
  if (!quote) return null;
  const Tag = inline ? "span" : "p";
  return (
    <Tag className={className}>
      <TruckIcon className="mr-1.5 text-muted" />Order today, delivered <span className="text-fg">{quote.window}</span>
      {quote.zone && <> to {use}</>}
    </Tag>
  );
}

/** Product-page PIN check: delivery dates and shipping for the visitor's area. */
export function PinCheck({ subtotal }: { subtotal: number }) {
  const saved = useSavedPin();
  const setPin = usePin((s) => s.setPin);
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState("");
  const [error, setError] = useState(false);
  useEffect(() => {
    if (saved && !checked) {
      setValue(saved);
      setChecked(saved);
    }
  }, [saved, checked]);

  const quote = checked ? deliveryQuote(checked, subtotal) : null;
  const check = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validPin(value)) {
      setError(true);
      return;
    }
    setError(false);
    setChecked(value.trim());
    setPin(value.trim());
    track("pin_check", { zone: zoneFor(value) ?? "unknown" });
  };

  return (
    <div className="rounded-xl border border-fg/10 p-4">
      <form onSubmit={check} className="flex items-center gap-2">
        <label htmlFor="pin-check" className="shrink-0 text-sm font-semibold">
          Delivery
        </label>
        <input
          id="pin-check"
          value={value}
          onChange={(e) => {
            setValue(e.target.value.replace(/\D/g, "").slice(0, 6));
            setError(false);
          }}
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="Your PIN code"
          aria-invalid={error}
          aria-describedby="pin-result"
          className={`min-w-0 flex-1 rounded-xl border bg-page px-3 py-2 text-sm tabular-nums text-fg outline-none transition-colors placeholder:text-subtle focus:border-fg focus:ring-1 focus:ring-fg ${
            error ? "border-danger" : "border-subtle"
          }`}
        />
        <button type="submit" className="shrink-0 rounded-xl px-3 py-2 text-sm font-semibold text-accent hover:bg-fg/5">
          Check
        </button>
      </form>
      <p id="pin-result" aria-live="polite" className="mt-2 text-sm text-muted">
        {error ? (
          <span className="text-danger">Enter a 6-digit PIN code.</span>
        ) : quote ? (
          <>
            Delivered <span className="font-semibold text-fg">{quote.window}</span> · {quote.zoneLabel} ·{" "}
            {quote.shipping === 0 ? "free shipping" : `${formatPrice(quote.shipping)} shipping`}
          </>
        ) : (
          <DeliveryEstimate inline />
        )}
      </p>
    </div>
  );
}
