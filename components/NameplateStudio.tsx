"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useInView } from "motion/react";
import { getFinish, getProduct, type Product } from "@/lib/products";
import { itemPrice, useCart } from "@/lib/cart";
import { bumpCart } from "@/lib/fly";
import { useLiteMode } from "@/lib/lite";
import { formatPrice, site, whatsappUrl } from "@/lib/site";
import { MAX_NAME, plateFonts, plateIcons, type PlateFont, type PlateIcon, type PlateStyle } from "@/lib/personalise";
import { track } from "@/lib/track";
import { NameplateScene, View3D } from "./three/lazy";
import { DeliveryEstimate } from "./Delivery";
import { WhatsAppIcon } from "./CheckoutForm";
import { Button, Swatch } from "./ui";
import { IconGlyph } from "./PlateIcons";

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
  const [icon, setIcon] = useState<PlateIcon>("none");
  const [context, setContext] = useState(false);
  const [font, setFont] = useState<PlateFont>("bold");
  const box = useRef<HTMLDivElement>(null);
  const visible = useInView(box);

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
  const options = { font, icon };
  const item = { slug: product.slug, finish, size, engraving: text.trim(), options };
  const ready = () => {
    if (!text.trim()) {
      setNudge(true);
      return false;
    }
    return true;
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-14">
      {/* preview: stays in view while you type and pick options (phones: a shorter strip under the nav) */}
      <div
        ref={box}
        className="sticky top-[4.5rem] z-10 aspect-[16/10] overflow-hidden rounded-3xl border border-fg/10 viewer-bg shadow-[0_14px_30px_-20px_rgba(0,0,0,0.8)] sm:top-24 sm:aspect-[4/3] lg:aspect-auto lg:h-[min(640px,calc(100svh-8rem))] lg:shadow-none"
      >
        <div className="grid-bg absolute inset-0" />
        {lite ? (
          <div className="absolute inset-0 grid place-items-center p-8">
            <div className="rounded-3xl border-4 border-pop/60 bg-raised px-8 py-5 shadow-[0_0_60px_-10px_var(--color-gold)]">
              <p className="holo-text font-display text-4xl display-case sm:text-6xl">{shown}</p>
            </div>
          </div>
        ) : (
          <div ref={setViewEl} className="absolute inset-0 cursor-grab active:cursor-grabbing">
            <View3D className="absolute inset-0">
              {viewEl && (
                <NameplateScene
                  text={shown}
                  style={style}
                  finish={finish}
                  font={font}
                  icon={icon}
                  context={context}
                  visible={visible}
                  domElement={viewEl}
                />
              )}
            </View3D>
          </div>
        )}
        <span className="pointer-events-none absolute left-5 top-5 text-xs text-muted">
          {lite ? "Preview" : "Drag to rotate"}
        </span>
        {!lite && (
          <div className="absolute bottom-4 left-4 flex gap-1 rounded-full border border-fg/10 bg-page/70 p-1 backdrop-blur" role="group" aria-label="Preview">
            {[
              [false, "Studio"],
              [true, style === "keychain" ? "On keys" : "On a desk"],
            ].map(([on, label]) => (
              <button
                key={String(on)}
                onClick={() => setContext(on as boolean)}
                aria-pressed={context === on}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${context === on ? "bg-fg/15 text-fg" : "text-muted hover:text-fg"}`}
              >
                {label as string}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* controls */}
      <div>
        <label className="block">
          <span className="tabular-nums text-xs uppercase tracking-[0.12em] text-muted">Your name or word</span>
          <input
            value={text}
            onChange={(e) => {
              setText(e.target.value.slice(0, MAX_NAME));
              setNudge(false);
            }}
            placeholder="Type here…"
            maxLength={MAX_NAME}
            autoComplete="off"
            className={`mt-2 w-full rounded-xl border bg-page/60 px-5 py-4 font-display text-3xl display-case text-fg outline-none transition-colors placeholder:text-fg/50 focus:border-accent focus:ring-2 focus:ring-accent/20 ${
              nudge ? "border-danger" : "border-fg/15"
            }`}
          />
          <span className={`mt-1.5 flex justify-between text-xs ${nudge ? "text-danger" : "text-muted"}`}>
            <span>{nudge ? "Type a name first." : "Letters, numbers and simple symbols."}</span>
            <span className="tabular-nums">
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
                className={`rounded-xl border px-4 py-3 text-left transition-all ${style === s.id ? "pick-on" : "border-fg/15 hover:border-fg/40"}`}
              >
                <span className="block font-semibold">{s.label}</span>
                <span className={`tabular-nums text-xs ${style === s.id ? "text-fg/75" : "text-muted"}`}>from {formatPrice(p.price)}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          <p className="text-sm text-muted">Lettering</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {plateFonts.map((f) => (
              <button
                key={f.id}
                onClick={() => setFont(f.id)}
                aria-pressed={font === f.id}
                className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-all ${font === f.id ? "pick-on" : "border-fg/15 hover:border-fg/40"}`}
              >
                <span className="block font-semibold">{f.label}</span>
                <span className={`block text-xs ${font === f.id ? "text-fg/75" : "text-muted"}`}>{f.note}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <p className="flex justify-between text-sm">
            <span className="text-muted">Icon after the name</span>
            <span className="font-semibold">{plateIcons.find((i) => i.id === icon)?.label}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {plateIcons.map((i) => (
              <button
                key={i.id}
                onClick={() => setIcon(i.id)}
                aria-pressed={icon === i.id}
                aria-label={i.label}
                title={i.label}
                className={`grid h-11 w-11 place-items-center rounded-xl border transition-all ${icon === i.id ? "pick-on" : "border-fg/15 text-fg hover:border-fg/40"}`}
              >
                <IconGlyph icon={i.id} />
              </button>
            ))}
          </div>
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
                className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-all ${size === s.id ? "pick-on" : "border-fg/15 hover:border-fg/40"}`}
              >
                <span className="block font-semibold">{s.label}</span>
                <span className={`block text-xs ${size === s.id ? "text-fg/75" : "text-muted"}`}>{s.dims}</span>
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
        <Button
          primary
          className="mt-4 w-full"
          onClick={(e) => {
            if (!ready()) return;
            add(item);
            track("add_to_cart", { product: product.slug, finish, size, font, icon, value: price });
            bumpCart();
            useCart.getState().setOpen(true);
          }}
        >
          Add to cart · {formatPrice(price)}
        </Button>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-1 text-sm">
          <button
            onClick={() => {
              if (!ready()) return;
              add(item);
              track("buy_now", { product: product.slug, value: price });
              router.push("/checkout/");
            }}
            className="py-2 font-semibold text-fg underline decoration-fg/30 underline-offset-4 transition-colors hover:decoration-accent"
          >
            or buy now →
          </button>
          <a
            href={whatsappUrl(`Hi ${site.name}! I'd like a ${product.name.toLowerCase()} that says "${text.trim() || "…"}".`)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 py-2 text-muted transition-colors hover:text-fg"
          >
            <span className="text-[#25D366]">
              <WhatsAppIcon />
            </span>
            Questions? Ask on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
