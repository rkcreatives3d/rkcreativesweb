"use client";

import { useState } from "react";
import { resizePhoto, type Shop } from "@/lib/owner/edit";
import { photoSrc, useOwner } from "@/lib/owner/store";
import { Card, Choice, Num, smallBtn, Switch, Text } from "./fields";
import { Thumb } from "./ProductsTab";

/** Contact, payment and shipping details, and the shop's categories (content/shop.json). */
export function SettingsTab() {
  const draft = useOwner((s) => s.draft)!;
  const { setShop } = useOwner.getState();
  const s = draft.shop;
  const set = (patch: Partial<Shop>) => setShop({ ...s, ...patch });
  const waOk = /^\d{11,15}$/.test(s.whatsapp);

  return (
    <div className="space-y-4">
      <CoverCard />
      <Card title="Contact (orders come here)">
        <Text
          label="WhatsApp number"
          value={s.whatsapp}
          onChange={(v) => set({ whatsapp: v.replace(/\D/g, "") })}
          inputMode="tel"
          hint={waOk ? "Country code + number, digits only. India: 91 then your 10 digits." : "Add the country code: 91 then your 10-digit number, e.g. 919876543210."}
        />
        <Text label="Order email" type="email" value={s.email} onChange={(v) => set({ email: v })} />
        <Text label="Instagram link" value={s.instagram} onChange={(v) => set({ instagram: v })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="City you ship from" value={s.city} onChange={(v) => set({ city: v })} />
          <Text label="Your PIN code" value={s.originPin} onChange={(v) => set({ originPin: v.replace(/\D/g, "").slice(0, 6) })} inputMode="numeric" hint="Delivery dates are worked out from it." />
        </div>
        <Text label="Website address" value={s.url} onChange={(v) => set({ url: v })} hint="Your domain, e.g. https://rkcreativebuilds.in (used in share previews and Google)." />
      </Card>

      <Card title="Payments">
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="UPI ID" value={s.upi.id} onChange={(v) => set({ upi: { ...s.upi, id: v.trim() } })} placeholder="name@okaxis" />
          <Text label="UPI name shown to customers" value={s.upi.payee} onChange={(v) => set({ upi: { ...s.upi, payee: v } })} />
        </div>
        <Text
          label="Card / netbanking link (optional)"
          value={s.payments.cardPayUrl}
          onChange={(v) => set({ payments: { ...s.payments, cardPayUrl: v.trim() } })}
          placeholder="https://rzp.io/l/…"
          hint="A Razorpay Payment Page or Link. Leave empty to offer UPI only."
        />
        <Switch
          label="Cash on delivery"
          checked={s.payments.cod.enabled}
          onChange={(v) => set({ payments: { ...s.payments, cod: { ...s.payments.cod, enabled: v } } })}
          hint="Not offered for personalised items."
        />
        {s.payments.cod.enabled && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Num label="COD fee" prefix="₹" value={s.payments.cod.fee} onChange={(v) => set({ payments: { ...s.payments, cod: { ...s.payments.cod, fee: v } } })} />
            <Num
              label="COD only for orders up to"
              prefix="₹"
              value={s.payments.cod.maxOrder}
              onChange={(v) => set({ payments: { ...s.payments, cod: { ...s.payments.cod, maxOrder: v } } })}
            />
          </div>
        )}
      </Card>

      <Card title="Shipping and making">
        <div className="grid gap-4 sm:grid-cols-2">
          <Num label="Shipping fee" prefix="₹" value={s.shippingFlat} onChange={(v) => set({ shippingFlat: v })} />
          <Num label="Free shipping over" prefix="₹" value={s.freeShippingOver} onChange={(v) => set({ freeShippingOver: v })} />
          <Num label="Days to print and pack (from)" value={s.dispatch[0]} onChange={(v) => set({ dispatch: [v, Math.max(v, s.dispatch[1])] })} min={1} />
          <Num label="Days to print and pack (to)" value={s.dispatch[1]} onChange={(v) => set({ dispatch: [Math.min(v, s.dispatch[0]), v] })} min={1} />
        </div>
        <Num label="Price to add a name or message" prefix="₹" value={s.engravingPrice} onChange={(v) => set({ engravingPrice: v })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Courier" value={s.tracking.courier} onChange={(v) => set({ tracking: { ...s.tracking, courier: v } })} />
          <Text
            label="Tracking page"
            value={s.tracking.url}
            onChange={(v) => set({ tracking: { ...s.tracking, url: v } })}
            hint="{awb} is replaced by the tracking number."
          />
        </div>
      </Card>

      <Card title="Business details (optional)">
        <Text label="Registered business name" value={s.business.legalName} onChange={(v) => set({ business: { ...s.business, legalName: v } })} />
        <Text label="GSTIN" value={s.business.gstin} onChange={(v) => set({ business: { ...s.business, gstin: v.toUpperCase().trim() } })} />
        <Text label="Address" multiline value={s.business.address} onChange={(v) => set({ business: { ...s.business, address: v } })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Opening hours" value={s.business.hours} onChange={(v) => set({ business: { ...s.business, hours: v } })} />
          <Text label="Reply time" value={s.business.replyTime} onChange={(v) => set({ business: { ...s.business, replyTime: v } })} />
        </div>
        <Text label="Review link" value={s.reviewUrl} onChange={(v) => set({ reviewUrl: v.trim() })} hint="Where happy customers can leave a review, e.g. your Google Business link." />
      </Card>

      <Card title="Domains">
        <p className="text-sm text-muted">
          Every product sits in one domain. Customers see them as the shop&apos;s collections, in this order (empty ones are hidden from them).
        </p>
        <ul className="space-y-2">
          {s.categories.map((c, i) => {
            const used = draft.products.filter((p) => p.category === c).length;
            return (
              <li key={i} className="flex items-center gap-2">
                <input
                  value={c}
                  aria-label={`Domain ${i + 1}`}
                  onChange={(e) => {
                    const name = e.target.value;
                    // renaming moves its products along with it
                    useOwner.getState().setShop({ ...s, categories: s.categories.map((x, j) => (j === i ? name : x)) });
                    for (const p of useOwner.getState().draft!.products.filter((p) => p.category === c))
                      useOwner.getState().setProduct(p.slug, { ...p, category: name });
                  }}
                  className="flex-1 rounded-xl border border-fg/15 bg-raised px-3.5 py-2.5 outline-none focus:border-accent-2"
                />
                <span className="w-20 text-xs text-muted">{used} items</span>
                <button
                  onClick={() => (used ? alert(`Move its ${used} product(s) to another domain first.`) : set({ categories: s.categories.filter((_, j) => j !== i) }))}
                  className="h-10 rounded-full border border-fg/15 px-3 text-sm"
                  aria-label={`Remove domain ${c}`}
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
        <button onClick={() => set({ categories: [...s.categories, "New domain"] })} className={smallBtn}>
          + Add domain
        </button>
      </Card>
    </div>
  );
}

const coverDefaults = { heroProduct: "vortex-vase", heroImage: "", heroImageCut: false };
const homeOf = (s: Shop) => ({ ...coverDefaults, ...(s.home as Partial<Shop["home"]> | undefined) });

/**
 * The big picture at the top of the home page: which product it shows, and
 * (optionally) a photo of it. Without a photo, the product's own photo or
 * studio picture is used. Photos can be cleaned up onto the studio background.
 */
function CoverCard() {
  const draft = useOwner((s) => s.draft)!;
  useOwner((s) => s.uploads); // re-render when the photo is added
  const { setShop, addUpload, dropUpload } = useOwner.getState();
  const home = homeOf(draft.shop);
  const [clean, setClean] = useState(true);
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const live = draft.products.filter((p) => !p.hidden);
  const saved = draft.products.find((p) => p.slug === home.heroProduct);
  // what the home page will actually show (a hidden or deleted cover product falls back to another one)
  const shown = saved && !saved.hidden ? saved : (live.find((p) => p.slug === "vortex-vase") ?? live[0]);
  const options = [
    ...live.map((p) => [p.slug, p.name] as const),
    ...(saved?.hidden ? [[saved.slug, `${saved.name} (hidden from customers)`] as const] : []),
  ];
  // always build on the settings as they are now (cleaning a photo takes a few seconds)
  const setHome = (patch: Partial<Shop["home"]>) => {
    const shop = useOwner.getState().draft!.shop;
    setShop({ ...shop, home: { ...homeOf(shop), ...patch } });
  };

  const pick = async (file?: File) => {
    if (!file) return;
    setNote("");
    setBusy(clean ? "Cleaning up the background… (the first time takes a little longer)" : "Preparing the photo…");
    let bytes: Uint8Array<ArrayBuffer>;
    let cut = false;
    try {
      if (!clean) bytes = await resizePhoto(file);
      else
        try {
          const { cleanBackground } = await import("@/lib/owner/cutout");
          // just the product and its shadow, transparent: it stands on the home page's own backdrop
          bytes = await cleanBackground(file, 1200, true);
          cut = true;
        } catch (e) {
          console.warn("background clean-up:", e);
          bytes = await resizePhoto(file);
          setNote("Kept as taken: the product couldn't be cut out cleanly. It shows as a framed photo.");
        }
    } catch {
      setBusy("");
      setNote("That file couldn't be opened. Try a JPG or PNG.");
      return;
    }
    const old = homeOf(useOwner.getState().draft!.shop).heroImage;
    if (old) dropUpload(old);
    const path = `/home/cover-${Date.now().toString(36)}.${cut ? "webp" : "jpg"}`;
    addUpload(path, bytes);
    setHome({ heroImage: path, heroImageCut: cut });
    setBusy("");
  };

  return (
    <Card title="Home page cover">
      <Choice
        label="Product on the cover"
        value={saved ? saved.slug : (shown?.slug ?? "")}
        onChange={(v) => {
          // a photo belongs to its product: a new cover product starts with its own picture
          if (home.heroImage) {
            if (!confirm("Changing the product removes the current cover photo. Continue?")) return;
            dropUpload(home.heroImage);
          }
          setHome({ heroProduct: v, heroImage: "", heroImageCut: false });
        }}
        options={options}
        hint="Shown big at the top of the home page, with a link to it."
      />
      {(!saved || saved.hidden) && shown && (
        <p className="rounded-xl border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
          {saved ? `${saved.name} is hidden from customers,` : "The cover product was deleted,"} so the home page shows {shown.name} (with its own picture) instead. Pick
          another product, or show that one again.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4">
        {home.heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoSrc(home.heroImage)} alt="Cover photo" width={128} height={128} className="stage h-32 w-32 rounded-xl object-contain" />
        ) : (
          shown && <Thumb p={shown} size={128} />
        )}
        <div className="space-y-2 text-sm">
          <p className="text-muted">{home.heroImage ? "Your cover photo." : "Using the product's own picture. Upload a real photo of it to use instead."}</p>
          <div className="flex flex-wrap gap-2">
            <label className={`${smallBtn} relative cursor-pointer focus-within:ring-2 focus-within:ring-accent-2 focus-within:ring-offset-2`}>
              {home.heroImage ? "Replace photo" : "Upload a photo"}
              <input
                type="file"
                accept="image/*"
                aria-label="Cover photo"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                onChange={(e) => {
                  pick(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            {home.heroImage && (
              <button
                onClick={() => {
                  dropUpload(home.heroImage);
                  setHome({ heroImage: "", heroImageCut: false });
                }}
                className={smallBtn}
              >
                Use the product&apos;s picture
              </button>
            )}
          </div>
        </div>
      </div>
      <Switch
        label="Clean up the background"
        checked={clean}
        onChange={setClean}
        hint="Cuts the product out so it stands on the home page's studio background, like the rest of the shop's pictures. Off: the photo shows as it is, framed."
      />
      {busy && (
        <p role="status" className="rounded-xl bg-fg p-3 text-sm text-page">
          {busy}
        </p>
      )}
      {note && <p className="text-sm text-muted">{note}</p>}
    </Card>
  );
}
