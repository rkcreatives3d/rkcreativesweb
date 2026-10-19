"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { View } from "@react-three/drei";
import { getFinish, photosFor, products, type Product } from "@/lib/products";
import { itemPrice, useCart } from "@/lib/cart";
import { flyToCart } from "@/lib/fly";
import { useLiteMode } from "@/lib/lite";
import { modelFor } from "@/lib/models";
import { track } from "@/lib/track";
import { dispatchLabel, formatPrice, site, whatsappUrl } from "@/lib/site";
import { MAX_NAME } from "./three/nameplate";
import { ViewerScene } from "./three/ProductScenes";
import { Stepper } from "./CartDrawer";
import { ProductCard } from "./ProductCard";
import { Gallery, ProductArt } from "./ProductMedia";
import { PinCheck } from "./Delivery";
import { ProductFaq, SizeGuide, sizeCm } from "./ProductInfo";
import { ArView } from "./ArView";
import { WhatsAppIcon } from "./CheckoutForm";
import { Button, KineticText, Swatch } from "./ui";

export function ProductDetail({ product: p }: { product: Product }) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  const lite = useLiteMode();
  const [finish, setFinish] = useState(p.finishes[0]);
  const [size, setSize] = useState(p.sizes[0].id);
  const [qty, setQty] = useState(1);
  const [slicer, setSlicer] = useState(false);
  const [autoSpin, setAutoSpin] = useState(true);
  const [viewEl, setViewEl] = useState<HTMLElement | null>(null);

  // personalisation: optional add-on, or required for name products
  const included = p.personalisation === "included";
  const [wantsText, setWantsText] = useState(included);
  const [text, setText] = useState("");
  const [nudge, setNudge] = useState(false);
  const engraving = wantsText ? text.trim() : "";
  const maxLen = included ? MAX_NAME : 24;

  const price = itemPrice(p, size, engraving || undefined);
  const sizeInfo = p.sizes.find((s) => s.id === size);
  const related = products
    .filter((x) => x.slug !== p.slug && x.category === p.category)
    .concat(products.filter((x) => x.category !== p.category))
    .slice(0, 3);
  const ask = whatsappUrl(
    `Hi ${site.name}! I have a question about the ${p.name} (${getFinish(finish).name}, ${sizeInfo?.label}). ${site.url}/shop/${p.slug}/`,
  );

  const ready = () => {
    if (included && !engraving) {
      setNudge(true);
      return false;
    }
    return true;
  };
  const item = { slug: p.slug, finish, size, engraving: engraving || undefined };
  // media: the real 3D model first, photos second; placeholder 3D only when there's neither
  const photos = photosFor(p, finish);
  const model = modelFor(p);
  const has3D = !!model && !lite;
  const [media, setMedia] = useState<"3d" | "photos">("3d");
  const showPhotos = photos.list.length > 0 && (media === "photos" || !has3D);
  const showViewer = !showPhotos && !lite;

  return (
    <>
      <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-20 pt-28 sm:px-8 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:pt-32">
        {/* media: photos if the product has them, otherwise the 3D preview (or flat art in Lite mode) */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          {(model || (has3D && photos.list.length > 0)) && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {has3D && photos.list.length > 0 && (
                <>
                  <Toggle on={!showPhotos} onClick={() => setMedia("3d")}>
                    3D view
                  </Toggle>
                  <Toggle on={showPhotos} onClick={() => setMedia("photos")}>
                    Photos ({photos.list.length})
                  </Toggle>
                </>
              )}
              {model && (
                <span className="ml-auto">
                  <ArView model={model} name={p.name} slug={p.slug} sizeCm={sizeInfo ? sizeCm(sizeInfo) : null} tint={getFinish(finish)} />
                </span>
              )}
            </div>
          )}
          {showPhotos ? (
            <Gallery images={photos.list} finish={finish} preview={photos.recolor} alt={p.name} />
          ) : (
            <>
              <div className="relative aspect-square overflow-hidden rounded-[32px] border border-fg/10 viewer-bg lg:aspect-auto lg:h-[calc(100svh-8rem)]">
                <div className="grid-bg absolute inset-0" />
                {showViewer ? (
                  // OrbitControls listen on this wrapper; events bubble up from the View div
                  <div ref={setViewEl} className="absolute inset-0 cursor-grab active:cursor-grabbing">
                    <View className="absolute inset-0">
                      {viewEl && (
                        <ViewerScene
                          shape={p.shape}
                          model={model}
                          finish={finish}
                          wireframe={slicer}
                          autoSpin={autoSpin}
                          domElement={viewEl}
                        />
                      )}
                    </View>
                  </div>
                ) : (
                  <ProductArt product={p} finish={finish} large />
                )}
                <span className="pointer-events-none absolute left-5 top-5 tabular-nums text-xs uppercase tracking-[0.12em] text-muted">
                  {showViewer ? `${slicer ? "Slicer preview" : "Live render"} · drag to rotate` : "Preview"}
                </span>
              </div>
              {showViewer && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Toggle on={!slicer} onClick={() => setSlicer(false)}>
                    Render
                  </Toggle>
                  <Toggle on={slicer} onClick={() => setSlicer(true)}>
                    Slicer
                  </Toggle>
                  <span className="mx-1 w-px bg-fg/10" />
                  <Toggle on={autoSpin} onClick={() => setAutoSpin((v) => !v)}>
                    Auto-spin {autoSpin ? "on" : "off"}
                  </Toggle>
                </div>
              )}
            </>
          )}
        </div>

        {/* details */}
        <div>
          <nav className="tabular-nums text-xs uppercase tracking-[0.12em] text-muted">
            <Link href="/shop/" className="hover:text-fg">
              Shop
            </Link>{" "}
            / {p.category}
          </nav>
          {p.badge && (
            <span className="mt-5 inline-block rounded-full bg-pop px-3 py-1 tabular-nums text-xs font-semibold uppercase tracking-widest text-on-pop">
              {p.badge}
            </span>
          )}
          <h1 className="mt-4 font-display text-5xl font-extrabold display-case leading-[0.9] tracking-tight sm:text-7xl">
            <KineticText text={p.name} stagger={0.025} />
          </h1>
          <p className="mt-4 text-lg text-muted">{p.tagline}</p>

          <div className="mt-6 flex items-baseline gap-3">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={price * qty}
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -16, opacity: 0 }}
                className="font-display text-4xl font-bold"
              >
                {formatPrice(price * qty)}
              </motion.span>
            </AnimatePresence>
            {qty > 1 && <span className="tabular-nums text-sm text-muted">{formatPrice(price)} each</span>}
          </div>

          {/* finish */}
          <div className="mt-10">
            <p className="flex justify-between text-sm">
              <span className="text-muted">Finish</span>
              <span className="font-semibold">{getFinish(finish).name}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {p.finishes.map((f) => (
                <button
                  key={f}
                  onClick={() => setFinish(f)}
                  aria-label={getFinish(f).name}
                  aria-pressed={finish === f}
                  className={`rounded-full p-1 transition-transform hover:scale-110 ${finish === f ? "ring-2 ring-fg" : "ring-1 ring-fg/15"}`}
                >
                  <Swatch css={getFinish(f).swatch} size={34} />
                </button>
              ))}
            </div>
          </div>

          {/* size */}
          <div className="mt-8">
            <p className="text-sm text-muted">Size</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {p.sizes.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSize(s.id)}
                  aria-pressed={size === s.id}
                  className={`rounded-2xl border px-3 py-3 text-left transition-all ${
                    size === s.id ? "border-fg bg-fg text-page" : "border-fg/15 hover:border-fg/40"
                  }`}
                >
                  <span className="block font-semibold">{s.label}</span>
                  <span className={`block text-xs ${size === s.id ? "text-page/70" : "text-muted"}`}>{s.dims}</span>
                  <span className={`mt-1 block tabular-nums text-xs ${size === s.id ? "text-page/70" : "text-muted"}`}>
                    {s.priceDelta ? `+${formatPrice(s.priceDelta)}` : "base"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* personalisation */}
          {p.personalisation && (
            <div className="mt-8 rounded-2xl border border-fg/10 bg-fg/[0.03] p-4">
              {included ? (
                <p className="flex items-center justify-between text-sm">
                  <span className="font-semibold">Name to print</span>
                  <Link href="/personalise/" className="text-xs text-accent underline-offset-4 hover:underline">
                    See it live in 3D →
                  </Link>
                </p>
              ) : (
                <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
                  <span>
                    <span className="font-semibold">Add a name or message</span>{" "}
                    <span className="tabular-nums text-xs text-muted">+{formatPrice(site.engravingPrice)}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={wantsText}
                    onChange={(e) => setWantsText(e.target.checked)}
                    className="h-5 w-5 accent-[var(--color-accent)]"
                  />
                </label>
              )}
              {wantsText && (
                <>
                  <input
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value.slice(0, maxLen));
                      setNudge(false);
                    }}
                    placeholder={included ? "e.g. ANANYA" : "e.g. Happy Birthday, Ria"}
                    maxLength={maxLen}
                    aria-label="Text to print"
                    className={`mt-3 w-full rounded-xl border bg-page/60 px-4 py-3 text-fg outline-none transition-colors focus:border-accent-2 focus:ring-2 focus:ring-accent-2/20 ${
                      nudge ? "border-accent" : "border-fg/15"
                    }`}
                  />
                  <p className={`mt-1.5 flex justify-between text-xs ${nudge ? "text-accent" : "text-muted"}`}>
                    <span>{nudge ? "Type the name you want printed first." : "Printed exactly as typed."}</span>
                    <span className="tabular-nums">
                      {text.length}/{maxLen}
                    </span>
                  </p>
                </>
              )}
            </div>
          )}

          {/* buy: one main action; buy-now and WhatsApp are quieter ways in */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Stepper value={qty} onChange={setQty} />
            <Button
              primary
              className="flex-1"
              onClick={(e) => {
                if (!ready()) return;
                add(item, qty);
                track("add_to_cart", { product: p.slug, finish, size, value: price * qty });
                flyToCart(e.currentTarget, getFinish(finish).swatch).then(() => useCart.getState().setOpen(true));
              }}
            >
              Add to cart · {formatPrice(price * qty)}
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-1 text-sm">
            <button
              onClick={() => {
                if (!ready()) return;
                add(item, qty);
                track("buy_now", { product: p.slug, value: price * qty });
                router.push("/checkout/");
              }}
              className="font-semibold text-fg underline decoration-fg/30 underline-offset-4 transition-colors hover:decoration-accent"
            >
              or buy now →
            </button>
            <a
              href={ask}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-fg"
            >
              <span className="text-[#25D366]">
                <WhatsAppIcon />
              </span>
              Questions? Ask on WhatsApp
            </a>
          </div>
          <div className="mt-6">
            <PinCheck subtotal={price * qty} />
            <p className="mt-2 px-1 text-xs text-muted">
              Free shipping over {formatPrice(site.freeShippingOver)} · Dispatch in {dispatchLabel} working days ·{" "}
              <Link href="/policies/shipping/" className="underline underline-offset-4 hover:text-fg">
                Shipping
              </Link>{" "}
              ·{" "}
              <Link href="/policies/returns/" className="underline underline-offset-4 hover:text-fg">
                Returns
              </Link>
            </p>
          </div>

          {/* specs */}
          <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-fg/10 bg-fg/10 text-sm">
            {[
              ["Material", p.material],
              ["Print time", p.printTime],
              ["Layer height", "0.12–0.2 mm"],
              ["Size", sizeInfo?.dims ?? ""],
            ].map(([k, v]) => (
              <div key={k} className="bg-page p-4">
                <dt className="tabular-nums text-xs uppercase tracking-[0.12em] text-muted">{k}</dt>
                <dd className="mt-1 font-semibold">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-10">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">About it</h2>
            <p className="mt-3 leading-relaxed text-fg/80">{p.description}</p>
          </div>
          {sizeInfo && <SizeGuide product={p} size={sizeInfo} />}
          <ProductFaq product={p} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <h2 className="font-display text-4xl font-extrabold display-case tracking-tight sm:text-5xl">
          You might <span className="holo-text">also</span> like
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((r, i) => (
            <ProductCard key={r.slug} product={r} index={i} />
          ))}
        </div>
      </section>
    </>
  );
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-full border px-4 py-1.5 tabular-nums text-xs uppercase tracking-widest transition-all ${
        on ? "border-accent-2 bg-accent-2/10 text-accent-2" : "border-fg/15 text-muted hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}
