"use client";

import { lazy, Suspense, useState } from "react";
import { isPale, type Product, type Shape, type Tag } from "@/lib/products";
import { modelFor } from "@/lib/models";
import { formatPrice } from "@/lib/site";
import { newSize, resizePhoto, SHAPES, TAGS } from "@/lib/owner/edit";
import { photoSrc, useOwner } from "@/lib/owner/store";
import { Card, Choice, dangerBtn, Num, smallBtn, Switch, Text } from "./fields";
// the 3D engine loads only when a product is opened, so the owner page itself opens fast
const ModelPreview = lazy(() => import("./Studio3D").then((m) => ({ default: m.ModelPreview })));

const BADGES = ["Bestseller", "New", "Personalised", "Limited", "Articulated"];

export function ProductEditor({ slug, onClose }: { slug: string; onClose: () => void }) {
  const draft = useOwner((s) => s.draft)!;
  const original = useOwner((s) => s.original)!;
  const pendingModel = useOwner((s) => s.models[slug]);
  useOwner((s) => s.uploads);
  const { setProduct, removeProduct, setModel, undoModel, addUpload, dropUpload, setShop } = useOwner.getState();
  const p = draft.products.find((x) => x.slug === slug);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState("");
  // new photos get their background cleaned up (product on the shop's stage), unless switched off
  const [clean, setClean] = useState(true);
  const [error, setError] = useState("");
  const [coverNotes, setCoverNotes] = useState<string[]>([]);
  if (!p) return null;

  const isNew = !original.products.some((x) => x.slug === slug);
  const set = (patch: Partial<Product>) => setProduct(slug, { ...p, ...patch });
  // after a slow step (cleaning photos takes seconds), build on the product as it is now, so
  // anything typed meanwhile stays
  const setLater = (patch: (now: Product) => Partial<Product>) => {
    const now = useOwner.getState().draft?.products.find((x) => x.slug === slug);
    if (now) setProduct(slug, { ...now, ...patch(now) });
  };
  const published = modelFor(p);
  const modelUrl = pendingModel === undefined ? published : (pendingModel?.url ?? undefined);
  const finish = preview && p.finishes.includes(preview) ? preview : p.finishes[0];
  const hasLook = !!modelUrl || !!p.images?.length;
  // pale colours sit on the dark studio backdrop, as on the site (colours being added count too)
  const backdrop = (id: string) => (isPale(draft.finishes.find((f) => f.id === id)?.color ?? "") ? "stage-dark" : "");
  const photoBackdrop = backdrop(p.photoFinish ?? p.finishes[0]);

  const pickModel = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    if (file.size > 60 * 1024 * 1024) {
      setError("That file is over 60 MB. Export it smaller (or simplify it in your slicer) and try again.");
      return;
    }
    setBusy("Reading the 3D file…");
    try {
      const { fileToModel } = await import("./Studio3D");
      const m = await fileToModel(file);
      setModel(slug, { bytes: m.bytes, ext: m.ext, url: m.url, name: file.name });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read that file.");
    } finally {
      setBusy("");
    }
  };

  // the cover photo goes up as taken (lib/owner/rawPhoto.ts), with a small copy for cards
  const pickCover = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    setCoverNotes([]);
    setBusy("Preparing the cover photo…");
    try {
      const { rawCover } = await import("@/lib/owner/rawPhoto");
      const c = await rawCover(file);
      const t = Date.now().toString(36);
      const path = `/products/${slug}/cover-${t}.${c.ext}`;
      const small = `/products/${slug}/cover-${t}-sm.jpg`;
      addUpload(path, c.bytes);
      addUpload(small, c.small);
      // a cover picked earlier and not published yet is let go (a published one goes on Publish)
      const before = useOwner.getState().draft?.products.find((x) => x.slug === slug);
      for (const old of [before?.cover, before?.coverSmall]) if (old) dropUpload(old);
      setLater(() => ({ cover: path, coverSmall: small }));
      setCoverNotes(c.notes);
    } catch (e) {
      console.warn("cover photo:", e);
      setError("That file couldn't be opened as a picture. Try a JPG or PNG photo.");
    } finally {
      setBusy("");
    }
  };
  const removeCover = () => {
    for (const old of [p.cover, p.coverSmall]) if (old) dropUpload(old);
    set({ cover: undefined, coverSmall: undefined });
    setCoverNotes([]);
  };

  // cut out onto a see-through background (WebP): the site puts it on the light
  // backdrop, or the dark one when it's shown in a pale colour
  const cleaned = async (photo: Blob) => {
    const { cleanBackground } = await import("@/lib/owner/cutout");
    return cleanBackground(photo);
  };

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setError("");
    setBusy(clean ? "Cleaning up the backgrounds… (the first photo takes a little longer)" : "Preparing photos…");
    const added: string[] = [];
    let kept = 0;
    let unreadable = 0;
    for (const [i, f] of [...files].entries()) {
      if (!f.type.startsWith("image/")) continue;
      let bytes;
      let ext = "jpg";
      try {
        if (!clean) bytes = await resizePhoto(f);
        else
          try {
            bytes = await cleaned(f);
            ext = "webp";
          } catch (e) {
            console.warn("background clean-up:", e);
            bytes = await resizePhoto(f); // couldn't cut it out: keep the photo as it is
            kept++;
          }
      } catch {
        unreadable++; // not a picture this browser can open (e.g. HEIC on some phones)
        continue;
      }
      const path = `/products/${slug}/${Date.now().toString(36)}-${i}.${ext}`;
      addUpload(path, bytes);
      added.push(path);
    }
    if (added.length) setLater((now) => ({ images: [...(now.images ?? []), ...added] }));
    setBusy("");
    const notes = [
      kept && `${kept} photo${kept === 1 ? "" : "s"} kept as taken: the product couldn't be cut out cleanly. ✨ tries again.`,
      unreadable && `${unreadable} file${unreadable === 1 ? "" : "s"} couldn't be opened. Try a JPG or PNG.`,
    ].filter(Boolean);
    if (notes.length) setError(notes.join(" "));
  };

  // clean up the background of a photo that's already there
  const cleanPhoto = async (src: string) => {
    setError("");
    setBusy("Cleaning up the background…");
    try {
      const bytes = await cleaned(await (await fetch(photoSrc(src))).blob());
      const path = `/products/${slug}/${Date.now().toString(36)}-c.webp`;
      addUpload(path, bytes);
      dropUpload(src);
      setLater((now) => ({ images: (now.images ?? []).map((x) => (x === src ? path : x)) }));
    } catch (e) {
      console.warn("background clean-up:", e);
      setError("Couldn't find the product clearly in that photo. Try one with the product nearer the middle.");
    } finally {
      setBusy("");
    }
  };

  const movePhoto = (i: number, by: number) => {
    const list = [...(p.images ?? [])];
    const j = i + by;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    set({ images: list });
  };

  const toggleFinish = (id: string) => {
    const on = p.finishes.includes(id);
    if (on && p.finishes.length === 1) return; // keep at least one colour
    set({ finishes: on ? p.finishes.filter((f) => f !== id) : [...p.finishes, id] });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={onClose} className={smallBtn}>
          ← All products
        </button>
        <span className="text-xs text-muted">Changes are kept here until you press Publish.</span>
      </div>

      <div>
        <h2 className="font-display text-3xl font-extrabold display-case leading-none">{p.name || "New product"}</h2>
        <p className="mt-1 font-mono text-xs text-muted">/shop/{p.slug}/</p>
      </div>

      {!hasLook && (
        <p className="rounded-xl border border-pop/40 bg-pop/10 p-3 text-sm">
          Add a <b>3D file</b> or <b>photos</b> below. Until then customers see a placeholder shape.
        </p>
      )}

      <Card title="Shown in the shop">
        <Switch
          label={p.hidden ? "Hidden from customers" : "Visible to customers"}
          checked={!p.hidden}
          onChange={(v) => set({ hidden: !v })}
          hint={p.hidden ? "Switch on when it's ready to sell." : "Switch off to hide it (out of stock, not ready yet)."}
        />
      </Card>

      <Card title="Basics">
        <Text label="Name" value={p.name} onChange={(v) => set({ name: v })} required />
        <Text label="Short line" value={p.tagline} onChange={(v) => set({ tagline: v })} hint="One sentence under the name, e.g. “A seven-point star, twisted through time.”" />
        <Text label="Description" multiline value={p.description} onChange={(v) => set({ description: v })} placeholder="What it is, how it's printed, what it's for." />
        <div className="grid gap-4 sm:grid-cols-2">
          <Choice
            label="Domain"
            value={p.category}
            onChange={(v) => {
              if (v !== "__new") return set({ category: v });
              const name = prompt("New domain name, e.g. Devotion")?.trim();
              if (!name) return;
              if (!draft.shop.categories.includes(name)) setShop({ ...draft.shop, categories: [...draft.shop.categories, name] });
              set({ category: name });
            }}
            options={[...draft.shop.categories.map((c) => [c, c] as const), ["__new", "+ New domain…"] as const]}
            hint="Customers find it under this in the shop."
          />
          <div>
            <Text label="Badge (optional)" value={p.badge ?? ""} onChange={(v) => set({ badge: v || undefined })} list="badges" placeholder="e.g. New" />
            <datalist id="badges">
              {BADGES.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </div>
        </div>
      </Card>

      <Card title="Cover photo">
        <p className="text-sm text-muted">
          The first picture customers see: on the shop cards, at the top of its page, in search, and on links shared on WhatsApp, so it&apos;s clear what the
          product is. It goes up exactly as you took it: no clean-up, no crop, no colour change.
        </p>
        {p.cover ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <figure>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoSrc(p.cover)} alt="Cover photo, as customers see it on the product page" className="max-h-72 w-full rounded-xl border border-line bg-raised object-contain" />
              <figcaption className="mt-1.5 text-xs text-muted">On its page: the whole photo.</figcaption>
            </figure>
            <figure>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoSrc(p.coverSmall ?? p.cover)}
                alt="Cover photo, as customers see it on a shop card"
                className="aspect-square w-40 rounded-[var(--radius-card)] border border-line object-cover"
              />
              <figcaption className="mt-1.5 text-xs text-muted">On a shop card: square, so a tall or wide photo loses a little at its edges.</figcaption>
              <div className="mt-3 flex flex-wrap gap-2">
                <label className={`${smallBtn} inline-block cursor-pointer`}>
                  Replace
                  <input type="file" accept="image/*" aria-label="Replace the cover photo" className="sr-only" onChange={(e) => pickCover(e.target.files?.[0])} />
                </label>
                <button onClick={removeCover} className={dangerBtn}>
                  Remove
                </button>
              </div>
            </figure>
          </div>
        ) : (
          <label className={`${smallBtn} inline-block cursor-pointer`}>
            + Add a cover photo
            <input type="file" accept="image/*" aria-label="Add a cover photo" className="sr-only" onChange={(e) => pickCover(e.target.files?.[0])} />
          </label>
        )}
        {coverNotes.length > 0 && <p className="text-xs text-muted">{coverNotes.join(" ")}</p>}
        <p className="text-xs text-muted">Location and camera details hidden inside phone photos are removed for your privacy; the picture itself isn&apos;t changed.</p>
      </Card>

      <Card title="Price and sizes">
        <Num label="Starting price" prefix="₹" value={p.price} onChange={(v) => set({ price: v })} hint="The price of the first (smallest) size." />
        <ul className="space-y-3">
          {p.sizes.map((s, i) => (
            <li key={s.id} className="rounded-xl border border-line bg-raised p-3">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_8rem]">
                <Text label="Size name" value={s.label} onChange={(v) => set({ sizes: p.sizes.map((x, j) => (j === i ? { ...x, label: v } : x)) })} />
                <Text
                  label="Measurement"
                  value={s.dims}
                  onChange={(v) => set({ sizes: p.sizes.map((x, j) => (j === i ? { ...x, dims: v } : x)) })}
                  placeholder="e.g. 12 cm tall"
                />
                <Num
                  label="Extra price"
                  prefix="+₹"
                  value={s.priceDelta}
                  onChange={(v) => set({ sizes: p.sizes.map((x, j) => (j === i ? { ...x, priceDelta: i === 0 ? 0 : v } : x)) })}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted">
                <span>Customer pays {formatPrice(p.price + s.priceDelta)}</span>
                {p.sizes.length > 1 && (
                  <button onClick={() => set({ sizes: p.sizes.filter((_, j) => j !== i) })} className="font-semibold text-danger hover:underline">
                    Remove size
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
        <button onClick={() => set({ sizes: [...p.sizes, newSize(p.sizes)] })} className={smallBtn}>
          + Add a size
        </button>
        <p className="text-xs text-muted">Sizes with a measurement in cm get the “How big is it?” guide and true-size AR.</p>
      </Card>

      <Card title="Colours">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Colours this product comes in">
          {draft.finishes.map((f) => {
            const on = p.finishes.includes(f.id);
            return (
              <button
                key={f.id}
                onClick={() => toggleFinish(f.id)}
                aria-pressed={on}
                className={`flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-sm transition-colors ${on ? "border-fg bg-fg text-page" : "border-fg/15 hover:border-fg/40"}`}
              >
                <span className="h-6 w-6 rounded-full ring-1 ring-black/10" style={{ background: f.swatch }} />
                {f.name}
              </button>
            );
          })}
        </div>
        <Choice
          label="Main colour (shown first)"
          value={p.finishes[0]}
          onChange={(v) => set({ finishes: [v, ...p.finishes.filter((f) => f !== v)] })}
          options={p.finishes.map((id) => [id, draft.finishes.find((f) => f.id === id)?.name ?? id] as const)}
        />
      </Card>

      <Card title="3D model">
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
          <Suspense fallback={<div className={`stage ${backdrop(finish)} aspect-square rounded-2xl border border-line`} />}>
            <ModelPreview product={p} finish={finish} modelUrl={modelUrl} backdrop={backdrop(finish)} />
          </Suspense>
          <div className="space-y-3 text-sm">
            <p className="text-muted">
              {pendingModel
                ? `New file: ${pendingModel.name}. It goes live when you publish.`
                : pendingModel === null
                  ? "The 3D model will be removed when you publish."
                  : published
                    ? "Showing the published 3D model."
                    : "No 3D model yet: showing a placeholder shape."}
            </p>
            <label className="btn btn-primary w-full cursor-pointer">
              {modelUrl ? "Replace 3D file" : "Upload 3D file"}
              <input type="file" accept=".stl,.3mf,.obj,.glb" className="sr-only" onChange={(e) => pickModel(e.target.files?.[0])} />
            </label>
            <p className="text-xs text-muted">The file you print from: STL, 3MF (Bambu Studio, Orca, PrusaSlicer), OBJ or GLB. Customers see it in 3D, 360° and in AR.</p>
            {pendingModel !== undefined && (
              <button onClick={() => undoModel(slug)} className={smallBtn}>
                Undo
              </button>
            )}
            {published && pendingModel === undefined && (
              <button onClick={() => setModel(slug, null)} className={dangerBtn}>
                Remove 3D model
              </button>
            )}
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Preview colour">
              {p.finishes.map((id) => {
                const f = draft.finishes.find((x) => x.id === id);
                return (
                  <button
                    key={id}
                    onClick={() => setPreview(id)}
                    aria-label={`Preview in ${f?.name}`}
                    aria-pressed={finish === id}
                    className={`rounded-full p-[3px] ${finish === id ? "ring-2 ring-fg" : ""}`}
                  >
                    <span className="block h-6 w-6 rounded-full" style={{ background: f?.swatch }} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {!modelUrl && !p.images?.length && (
          <Choice
            label="Placeholder shape (until there's a 3D file or photos)"
            value={p.shape}
            onChange={(v) => set({ shape: v as Shape })}
            options={SHAPES.map((s) => [s, s[0].toUpperCase() + s.slice(1)] as const)}
          />
        )}
      </Card>

      <Card title="Photos">
        {p.images?.length ? (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {p.images.map((src, i) => (
              <li key={src} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoSrc(src)} alt={`Photo ${i + 1}`} className={`stage ${photoBackdrop} aspect-square w-full rounded-xl border border-line object-cover`} />
                {i === 0 && !p.cover && <span className="absolute left-1.5 top-1.5 rounded-full bg-fg px-2 py-0.5 text-xs font-semibold text-page">Cover</span>}
                <div className="mt-1 flex justify-between gap-1">
                  <button onClick={() => movePhoto(i, -1)} disabled={i === 0} className="h-8 flex-1 rounded-lg border border-fg/15 text-sm disabled:opacity-30" aria-label={`Move photo ${i + 1} left`}>
                    ←
                  </button>
                  <button
                    onClick={() => cleanPhoto(src)}
                    className="h-8 flex-1 rounded-lg border border-fg/15 text-sm"
                    aria-label={`Clean up the background of photo ${i + 1}`}
                    title="Clean up the background"
                  >
                    ✨
                  </button>
                  <button
                    onClick={() => {
                      dropUpload(src);
                      set({ images: p.images!.filter((x) => x !== src) });
                    }}
                    className="h-8 flex-1 rounded-lg border border-danger/40 text-sm text-danger"
                    aria-label={`Remove photo ${i + 1}`}
                  >
                    ✕
                  </button>
                  <button
                    onClick={() => movePhoto(i, 1)}
                    disabled={i === p.images!.length - 1}
                    className="h-8 flex-1 rounded-lg border border-fg/15 text-sm disabled:opacity-30"
                    aria-label={`Move photo ${i + 1} right`}
                  >
                    →
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No photos yet. With a 3D model, photos are optional.</p>
        )}
        <label className={`${smallBtn} inline-block cursor-pointer`}>
          + Add photos
          <input type="file" accept="image/*" multiple aria-label="Add photos" className="sr-only" onChange={(e) => addPhotos(e.target.files)} />
        </label>
        <Switch
          label="Clean up the background"
          checked={clean}
          onChange={setClean}
          hint="Cuts the product out so it sits on the shop's studio background like every other product: light, or dark when it's shown in white or another pale colour. ✨ on a photo does it later."
        />
        {!!p.images?.length && (
          <Choice
            label="The photos show it in"
            value={p.photoFinish ?? p.finishes[0]}
            onChange={(v) => set({ photoFinish: v })}
            options={p.finishes.map((id) => [id, draft.finishes.find((f) => f.id === id)?.name ?? id] as const)}
            hint="Other colours get an automatic colour preview made from your photos."
          />
        )}
        <p className="text-xs text-muted">Best results: the whole product in the middle of the photo, in good light. Photos are resized automatically.</p>
      </Card>

      <Card title="Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Material" value={p.material} onChange={(v) => set({ material: v })} placeholder="e.g. Silk PLA" />
          <Text label="Print time" value={p.printTime} onChange={(v) => set({ printTime: v })} placeholder="e.g. 6–8 h" />
        </div>
        <Choice
          label="Personalisation"
          value={p.personalisation ?? "none"}
          onChange={(v) => set({ personalisation: v === "none" ? undefined : v })}
          options={[
            ["none", "None"],
            ["optional", `Optional name / message (+${formatPrice(draft.shop.engravingPrice)})`],
            ["included", "The product is the name (keychains, nameplates)"],
          ]}
        />
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Show it under</legend>
          <div className="flex flex-wrap gap-2">
            {TAGS.map(([id, label]) => {
              const on = !!p.tags?.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => set({ tags: on ? p.tags!.filter((t) => t !== id) : [...(p.tags ?? []), id as Tag] })}
                  aria-pressed={on}
                  className={`rounded-full border px-3.5 py-1.5 text-sm ${on ? "border-fg bg-fg text-page" : "border-fg/15 hover:border-fg/40"}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-xs text-muted">Prices of ₹499 or less appear under “Under ₹499” automatically.</p>
        </fieldset>
      </Card>

      <Card title="Questions customers ask">
        {(p.faq ?? []).map(([q, a], i) => (
          <div key={i} className="space-y-2 rounded-xl border border-line bg-raised p-3">
            <Text label="Question" value={q} onChange={(v) => set({ faq: p.faq!.map((x, j) => (j === i ? [v, x[1]] : x)) })} />
            <Text label="Answer" multiline value={a} onChange={(v) => set({ faq: p.faq!.map((x, j) => (j === i ? [x[0], v] : x)) })} />
            <button onClick={() => set({ faq: p.faq!.filter((_, j) => j !== i) })} className="text-xs font-semibold text-danger hover:underline">
              Remove question
            </button>
          </div>
        ))}
        <button onClick={() => set({ faq: [...(p.faq ?? []), ["", ""]] })} className={smallBtn}>
          + Add a question
        </button>
        <p className="text-xs text-muted">Shown above the standard questions (delivery, colours, damage) on its page.</p>
      </Card>

      {busy && (
        <p role="status" className="rounded-xl bg-fg p-3 text-sm text-page">
          {busy}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-xl border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-wrap justify-between gap-3 border-t border-line pt-4">
        <button onClick={onClose} className="btn">
          Done
        </button>
        <button
          onClick={() => {
            if (!confirm(`Delete “${p.name}”?${isNew ? "" : " Its photos and 3D file are removed from the website when you publish."}`)) return;
            removeProduct(slug);
            onClose();
          }}
          className={dangerBtn}
        >
          Delete product
        </button>
      </div>
    </div>
  );
}
