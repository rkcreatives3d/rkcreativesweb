"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { View } from "@react-three/drei";
import { getFinish, getProduct, type Product } from "@/lib/products";
import { itemPrice, useCart } from "@/lib/cart";
import { flyToCart } from "@/lib/fly";
import { useLiteMode } from "@/lib/lite";
import { formatPrice, site, whatsappUrl } from "@/lib/site";
import { MAX_NAME, type PlateStyle } from "./three/nameplate";
import { NameplateScene } from "./three/NameplateScene";
import { DeliveryEstimate } from "./ProductMedia";
import { WhatsAppIcon } from "./CheckoutForm";
import { HoloButton, Swatch } from "./ui";

const styles: { id: PlateStyle; slug: string; label: string }[] = [
  { id: "keychain", slug: "name-keychain", label: "Keychain" },
  { id: "nameplate", slug: "desk-nameplate", label: "Desk nameplate" },
];

/** Type a name, see it as a 3D print, add it to the cart. */
export function NameplateStudio() {
  const router = useRouter();
  const lite = useLiteMode();
  const add = useCart((s) => s.add);
  const [text, setText] = useState("");
  const [shown, setShown] = useState("YOUR NAME"); // debounced text the 3D model uses
  const [style, setStyle] = useState<PlateStyle>("keychain");
  const product = getProduct(styles.find((s) => s.id === style)!.slug) as Product;
  const [finish, setFinish] = useState("gold");
  const [size, setSize] = useState("M");
  const [viewEl, setViewEl] = useState<HTMLElement | null>(null);
  const [nudge, setNudge] = useState(false);

  // a name passed from the home page teaser: /personalise/?name=Ananya
  useEffect(() => {
    const name = new URLSearchParams(window.location.search).get("name");
    if (name) setText(name.slice(0, MAX_NAME));
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setShown(text.trim() || "YOUR NAME"), 250);
    return () => clearTimeout(id);
  }, [text]);

  const price = itemPrice(product, size);
  const item = { slug: product.slug, finish, size, engraving: text.trim() };
  const ready = () => {
    if (!text.trim()) {
      setNudge(true);
      return false;
    }
    return true;
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-14">
      {/* preview */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-[32px] border border-fg/10 viewer-bg lg:aspect-auto lg:min-h-[560px]">
        <div className="grid-bg absolute inset-0" />
        {lite ? (
          <div className="absolute inset-0 grid place-items-center p-8">
            <div className="rounded-3xl border-4 border-accent/60 bg-page-2 px-8 py-5 shadow-[0_0_60px_-10px_var(--color-accent)]">
              <p className="holo-text font-display text-4xl display-case sm:text-6xl">{shown}</p>
            </div>
          </div>
        ) : (
          <div ref={setViewEl} className="absolute inset-0 cursor-grab active:cursor-grabbing" data-cursor>
            <View className="absolute inset-0">
              {viewEl && <NameplateScene text={shown} style={style} finish={finish} domElement={viewEl} />}
            </View>
          </div>
        )}
        <span className="pointer-events-none absolute left-5 top-5 font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
          Live preview{lite ? "" : " · drag to rotate"}
        </span>
      </div>

      {/* controls */}
      <div>
        <label className="block">
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted">Your name or word</span>
          <input
            value={text}
            onChange={(e) => {
              setText(e.target.value.slice(0, MAX_NAME));
              setNudge(false);
            }}
            placeholder="Type here…"
            maxLength={MAX_NAME}
            autoComplete="off"
            className={`mt-2 w-full rounded-2xl border bg-page/60 px-5 py-4 font-display text-3xl display-case text-fg outline-none transition-colors placeholder:text-fg/25 focus:border-accent focus:ring-2 focus:ring-accent/20 ${
              nudge ? "border-accent" : "border-fg/15"
            }`}
          />
          <span className={`mt-1.5 flex justify-between text-xs ${nudge ? "text-accent" : "text-muted"}`}>
            <span>{nudge ? "Type a name first." : "Letters, numbers and simple symbols."}</span>
            <span className="font-mono">
              {text.length}/{MAX_NAME}
            </span>
          </span>
        </label>

        <div className="mt-6 grid grid-cols-2 gap-2">
          {styles.map((s) => {
            const p = getProduct(s.slug)!;
            return (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                aria-pressed={style === s.id}
                className={`rounded-2xl border px-4 py-3 text-left transition-all ${style === s.id ? "border-fg bg-fg text-page" : "border-fg/15 hover:border-fg/40"}`}
              >
                <span className="block font-semibold">{s.label}</span>
                <span className={`font-mono text-xs ${style === s.id ? "text-page/70" : "text-muted"}`}>from {formatPrice(p.price)}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          <p className="flex justify-between text-sm">
            <span className="text-muted">Letter colour</span>
            <span className="font-semibold">{getFinish(finish).name}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {product.finishes.map((f) => (
              <button
                key={f}
                onClick={() => setFinish(f)}
                aria-label={getFinish(f).name}
                aria-pressed={finish === f}
                className={`rounded-full p-1 transition-transform hover:scale-110 ${finish === f ? "ring-2 ring-fg" : "ring-1 ring-fg/15"}`}
              >
                <Swatch css={getFinish(f).swatch} size={30} />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm text-muted">Size</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {product.sizes.map((s) => (
              <button
                key={s.id}
                onClick={() => setSize(s.id)}
                aria-pressed={size === s.id}
                className={`rounded-2xl border px-3 py-2.5 text-left text-sm transition-all ${size === s.id ? "border-fg bg-fg text-page" : "border-fg/15 hover:border-fg/40"}`}
              >
                <span className="block font-semibold">{s.label}</span>
                <span className={`block text-xs ${size === s.id ? "text-page/70" : "text-muted"}`}>{s.dims}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex items-baseline justify-between">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={price}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              className="font-display text-4xl font-bold"
            >
              {formatPrice(price)}
            </motion.span>
          </AnimatePresence>
          <DeliveryEstimate className="text-xs text-muted" />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <HoloButton
            solid
            onClick={(e) => {
              if (!ready()) return;
              add(item);
              flyToCart(e.currentTarget, getFinish(finish).swatch).then(() => useCart.getState().setOpen(true));
            }}
          >
            Add to cart
          </HoloButton>
          <HoloButton
            onClick={() => {
              if (!ready()) return;
              add(item);
              router.push("/checkout/");
            }}
          >
            Buy now →
          </HoloButton>
        </div>
        <a
          href={whatsappUrl(`Hi ${site.name}! I'd like a ${product.name.toLowerCase()} that says "${text.trim() || "…"}".`)}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#25D366]/40 px-5 py-3 text-sm font-semibold text-[#25D366] transition-colors hover:bg-[#25D366] hover:text-black"
        >
          <WhatsAppIcon /> Ask on WhatsApp
        </a>
      </div>
    </div>
  );
}
