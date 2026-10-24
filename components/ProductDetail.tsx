"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getFinish, photosFor, products, type Product } from "@/lib/products";
import { itemPrice, useCart } from "@/lib/cart";
import { bumpCart } from "@/lib/fly";
import { useLite, useLiteMode } from "@/lib/lite";
import { modelFor } from "@/lib/models";
import { track } from "@/lib/track";
import { dispatchLabel, formatPrice, site, whatsappUrl } from "@/lib/site";
import { MAX_NAME } from "@/lib/personalise";
import { View3D, ViewerScene, is3DLoaded } from "./three/lazy";
import { Stepper } from "./CartDrawer";
import { ProductCard } from "./ProductCard";
import { Gallery, ProductArt, StudioImage } from "./ProductMedia";
import { renderFor } from "@/lib/renders";
import { PinCheck } from "./Delivery";
import { ProductFaq, SizeGuide, sizeCm } from "./ProductInfo";
import { ArView } from "./ArView";
import { TrustBadges } from "./TrustBadges";
import { ReviewCard, Stars, average } from "./Reviews";
import { reviewsFor } from "@/lib/content";
import { WhatsAppIcon } from "./CheckoutForm";
import { ShareIcon, SpinIcon } from "./Icons";
import { SaveButton } from "./SaveButton";
import { RecentlyViewed } from "./ProductStrip";
import { useShelf } from "@/lib/shelf";
import { Button, KineticText, Swatch } from "./ui";

export function ProductDetail({ product: p }: { product: Product }) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  const lite = useLiteMode();
  const [finish, setFinish] = useState(p.finishes[0]);
  const [size, setSize] = useState(p.sizes[0].id);
  const [qty, setQty] = useState(1);
  const [slicer, setSlicer] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);
  const [viewEl, setViewEl] = useState<HTMLElement | null>(null);

  // personalisation: optional add-on, or required for name products
  const included = p.personalisation === "included";
  const [wantsText, setWantsText] = useState(included);
  const [text, setText] = useState("");
  const [nudge, setNudge] = useState(false);
  const textInput = useRef<HTMLInputElement>(null);

  // remember it for "Recently viewed" (once this browser's saved lists have loaded)
  useEffect(() => {
    const mark = () => useShelf.getState().viewed(p.slug);
    if (useShelf.persist.hasHydrated()) mark();
    else return useShelf.persist.onFinishHydration(mark);
  }, [p.slug]);

  // phones: a buy bar fixed at the bottom while the main "Add to cart" is off screen
  const buyRow = useRef<HTMLDivElement>(null);
  const [barOn, setBarOn] = useState(false);
  useEffect(() => {
    const el = buyRow.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setBarOn(!e.isIntersecting), { rootMargin: "0px 0px -40px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
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
      // from the buy bar the box may be off screen: take them to it
      textInput.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      textInput.current?.focus({ preventScroll: true });
      return false;
    }
    return true;
  };
  const addToCart = (from: Element) => {
    if (!ready()) return;
    add(item, qty);
    track("add_to_cart", { product: p.slug, finish, size, value: price * qty });
    bumpCart();
    useCart.getState().setOpen(true);
  };
  const share = async () => {
    const url = `${location.origin}/shop/${p.slug}/`;
    const text = `${p.name} from ${site.name}: ${p.tagline}`;
    track("share", { product: p.slug });
    // phones: the share sheet (WhatsApp, Instagram, …); elsewhere: straight to WhatsApp
    if (navigator.share) {
      try {
        await navigator.share({ title: p.name, text, url });
      } catch {}
      return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, "_blank", "noopener");
  };
  const item = { slug: p.slug, finish, size, engraving: engraving || undefined };
  // media: the real 3D model first, photos second; placeholder 3D only when there's neither
  const photos = photosFor(p, finish);
  const model = modelFor(p);
  // Lite mode shows the studio picture, with a button to load the 360° view for this product anyway
  const demand = useLite((s) => s.demand);
  const want3D = useLite((s) => s.want3D);
  const live3D = !lite || demand;
  const has3D = !!model && live3D;
  const [media, setMedia] = useState<"3d" | "photos">("3d");
  const showPhotos = photos.list.length > 0 && (media === "photos" || !has3D);
  const showViewer = !showPhotos && live3D;
  // on a fresh page load the 3D engine is still downloading: the studio picture stands in until the model is up
  const [standIn] = useState(() => !is3DLoaded());
  const [shown3D, setShown3D] = useState(false);

  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-20 pt-20 sm:px-6 sm:pt-24 lg:grid-cols-[1.12fr_1fr] lg:gap-16 lg:pt-28">
        {/* media: photos if the product has them, otherwise the 3D preview (or flat art in Lite mode) */}
        <div className="min-w-0 lg:sticky lg:top-20 lg:self-start">
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
              <div
                className={`relative aspect-square overflow-hidden rounded-[var(--radius-tile)] viewer-bg ${showViewer ? "lg:aspect-auto lg:h-[min(46rem,calc(100svh-7.5rem))]" : ""}`}
              >
                {showViewer ? (
                  <>
                    {/* OrbitControls listen on this wrapper; events bubble up from the View div */}
                    <div ref={setViewEl} className="absolute inset-0 cursor-grab active:cursor-grabbing">
                      <View3D className="absolute inset-0">
                        {viewEl && (
                          <ViewerScene
                            shape={p.shape}
                            model={model}
                            finish={finish}
                            wireframe={slicer}
                            autoSpin={autoSpin}
                            domElement={viewEl}
                            standIn={standIn}
                            onShown={() => setShown3D(true)}
                          />
                        )}
                      </View3D>
                    </div>
                    {standIn && (
                      <div className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${shown3D ? "opacity-0" : ""}`}>
                        <StudioImage product={p} finish={finish} alt={p.name} still priority />
                      </div>
                    )}
                    <span className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap text-xs font-medium text-muted">
                      <SpinIcon size={14} />
                      <span className="[@media(pointer:coarse)]:hidden">Drag to turn it around</span>
                      <span className="hidden [@media(pointer:coarse)]:inline">Swipe to turn it around</span>
                    </span>
                  </>
                ) : (
                  <>
                    {renderFor(p, finish) ? (
                      // Lite mode: the studio render instead of live 3D
                      <StudioImage product={p} finish={finish} alt={p.name} priority />
                    ) : (
                      <ProductArt product={p} finish={finish} large />
                    )}
                    <button onClick={want3D} className="btn absolute bottom-4 left-1/2 -translate-x-1/2 bg-page">
                      <SpinIcon /> View in 3D · 360°
                    </button>
                  </>
                )}
              </div>
              {showViewer && (
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <Toggle on={slicer} onClick={() => setSlicer((v) => !v)}>
                    Slicer view
                  </Toggle>
                  <Toggle on={autoSpin} onClick={() => setAutoSpin((v) => !v)}>
                    Turn slowly
                  </Toggle>
                </div>
              )}
            </>
          )}
        </div>

        {/* details */}
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <nav aria-label="Breadcrumb" className="text-sm text-muted">
              <Link href="/shop/" className="inline-block py-2 hover:text-fg hover:underline">
                Shop
              </Link>
              <span aria-hidden className="mx-1.5">
                ›
              </span>
              <Link href={`/shop/?c=${encodeURIComponent(p.category)}`} className="inline-block py-2 hover:text-fg hover:underline">
                {p.category}
              </Link>
            </nav>
            <div className="flex items-center gap-1">
              <button onClick={share} className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm text-muted transition-colors hover:text-fg">
                <ShareIcon size={16} /> Share
              </button>
              <SaveButton slug={p.slug} name={p.name} className="bg-transparent" />
            </div>
          </div>
          {p.badge && <p className="eyebrow mt-4">{p.badge}</p>}
          <h1 className={`headline-lg ${p.badge ? "mt-1" : "mt-4"}`}>
            <KineticText text={p.name} stagger={0.025} />
          </h1>
          <p className="lead mt-3">{p.tagline}</p>

          <p className="mt-5 flex items-baseline gap-3">
            <span className="text-2xl font-semibold tabular-nums tracking-tight">{formatPrice(price * qty)}</span>
            {qty > 1 && <span className="tabular-nums text-sm text-muted">{formatPrice(price)} each</span>}
          </p>
          <p className="mt-1 text-sm text-muted">Made to order · dispatched in {dispatchLabel} working days</p>

          {/* colour */}
          <div className="mt-9 border-t border-line pt-6">
            <p className="text-sm">
              <span className="font-semibold">Colour</span>
              <span className="text-muted"> · {getFinish(finish).name}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {p.finishes.map((f) => (
                <button
                  key={f}
                  onClick={() => setFinish(f)}
                  aria-label={getFinish(f).name}
                  aria-pressed={finish === f}
                  title={getFinish(f).name}
                  className={`rounded-full p-[3px] transition-shadow ${finish === f ? "ring-2 ring-fg" : "ring-1 ring-transparent hover:ring-fg/25"}`}
                >
                  <Swatch css={getFinish(f).swatch} size={30} />
                </button>
              ))}
            </div>
          </div>

          {/* size */}
          <div className="mt-7">
            <p className="text-sm font-semibold">Size</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {p.sizes.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSize(s.id)}
                  aria-pressed={size === s.id}
                  className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                    size === s.id ? "pick-on" : "border-line hover:border-fg/30"
                  }`}
                >
                  <span className="block font-semibold">{s.label}</span>
                  <span className="block text-xs text-muted">{s.dims}</span>
                  <span className="mt-1 block tabular-nums text-xs text-muted">{s.priceDelta ? `+${formatPrice(s.priceDelta)}` : formatPrice(p.price)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* personalisation */}
          {p.personalisation && (
            <div className="mt-7 rounded-xl border border-line p-4">
              {included ? (
                <p className="flex items-center justify-between text-sm">
                  <span className="font-semibold">Name to print</span>
                  <Link href="/personalise/" className="py-1.5 text-xs text-accent underline-offset-4 hover:underline">
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
                    className="h-6 w-6 accent-[var(--color-accent)]"
                  />
                </label>
              )}
              {wantsText && (
                <>
                  <input
                    ref={textInput}
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value.slice(0, maxLen));
                      setNudge(false);
                    }}
                    placeholder={included ? "e.g. ANANYA" : "e.g. Happy Birthday, Ria"}
                    maxLength={maxLen}
                    aria-label="Text to print"
                    className={`mt-3 w-full rounded-xl border bg-page px-4 py-3 text-fg outline-none transition-colors focus-visible:border-fg ${
                      nudge ? "border-danger" : "border-line hover:border-fg/30"
                    }`}
                  />
                  <p className={`mt-1.5 flex justify-between text-xs ${nudge ? "text-danger" : "text-muted"}`}>
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
          <div ref={buyRow} className="mt-8 flex flex-wrap items-center gap-3">
            <Stepper value={qty} onChange={setQty} />
            <Button primary className="flex-1" onClick={(e) => addToCart(e.currentTarget)}>
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
              className="link-more py-2"
            >
              Buy now
            </button>
            <a
              href={ask}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 py-2 text-muted transition-colors hover:text-fg"
            >
              <WhatsAppIcon />
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
            <TrustBadges className="mt-4" />
          </div>

          {p.description.trim() && (
            <Detail title="Overview">
              <p className="leading-relaxed text-fg/85">{p.description}</p>
            </Detail>
          )}

          {/* specifications: only what the product record actually says */}
          <Detail title="Specifications">
            <dl className="divide-y divide-line text-sm">
              {[
                ["Material", p.material],
                ["Print time", p.printTime],
                ["Sizes", p.sizes.map((s) => [s.label, s.dims].filter((x) => x?.trim()).join(", ")).join(" · ")],
                ["Colours", p.finishes.map((f) => getFinish(f).name).join(", ")],
              ]
                .filter(([, v]) => v?.trim())
                .map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[7rem_1fr] gap-4 py-3">
                    <dt className="text-muted">{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
            </dl>
          </Detail>
          {sizeInfo && <SizeGuide product={p} size={sizeInfo} />}
          <ProductFaq product={p} />
          <ProductReviews slug={p.slug} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl border-t border-line px-5 pb-28 pt-16 sm:px-6 sm:pt-20">
        <h2 className="section-title text-2xl sm:text-[1.75rem]">You may also like</h2>
        <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 lg:grid-cols-3">
          {related.map((r, i) => (
            <ProductCard key={r.slug} product={r} index={i} printIn={false} />
          ))}
        </div>
        <RecentlyViewed exclude={p.slug} className="mt-16" />
      </section>

      {/* phones: price and "Add to cart" always one tap away (hidden while the main button is in view) */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-page/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl transition-transform duration-300 lg:hidden ${
          barOn ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
        aria-hidden={!barOn}
        inert={!barOn}
      >
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{p.name}</p>
            <p className="tabular-nums text-sm text-muted">
              {formatPrice(price * qty)}
              <span className="text-xs"> · {getFinish(finish).name}</span>
            </p>
          </div>
          <a
            href={ask}
            target="_blank"
            rel="noreferrer"
            aria-label="Ask on WhatsApp"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line text-fg/80"
          >
            <WhatsAppIcon />
          </a>
          <Button primary className="shrink-0 px-5" onClick={(e) => addToCart(e.currentTarget)}>
            {included && !engraving ? "Add your name" : "Add to cart"}
          </Button>
        </div>
      </div>
    </>
  );
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${on ? "pick-on" : "border-line text-muted hover:text-fg"}`}
    >
      {children}
    </button>
  );
}

/** One block of the product's details below the buy box, under a hairline. */
function Detail({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 border-t border-line pt-6">
      <h2 className="mb-3 text-lg font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

/** Reviews of this product (approved by the owner), and a way to add one. */
function ProductReviews({ slug }: { slug: string }) {
  const list = reviewsFor(slug);
  const avg = average(list);
  return (
    <section className="mt-10 border-t border-line pt-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Reviews</h2>
        <Link href={`/reviews/?product=${slug}#write`} className="link-more py-1 text-sm">
          Write a review
        </Link>
      </div>
      {list.length ? (
        <>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted">
            <Stars rating={Math.round(avg)} /> {avg.toFixed(1)} from {list.length} {list.length === 1 ? "review" : "reviews"}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {list.slice(0, 4).map((r, i) => (
              <ReviewCard key={r.id ?? i} review={r} showProduct={false} />
            ))}
          </div>
          {list.length > 4 && (
            <Link href="/reviews/" className="mt-3 inline-block text-sm font-semibold text-accent hover:underline">
              All {list.length} reviews →
            </Link>
          )}
        </>
      ) : (
        <p className="mt-2 text-sm text-muted">No reviews yet. Bought it? Tell others what you think, with a photo.</p>
      )}
    </section>
  );
}
