"use client";

import { useEffect, useState } from "react";
import type { Review } from "@/lib/content";
import { products } from "@/lib/products";
import { resizePhoto, toBase64 } from "@/lib/photo";
import { site, whatsappUrl } from "@/lib/site";
import { track } from "@/lib/track";
import { ReviewCard } from "./Reviews";

/** The owner sign-in server also takes reviews (scripts/owner-api.mjs). */
const API = (process.env.NEXT_PUBLIC_OWNER_API || "/api/owner").replace(/\/$/, "");

const input =
  "w-full rounded-xl border border-subtle bg-page px-3.5 py-3 text-fg outline-none placeholder:text-subtle focus:border-fg focus:ring-1 focus:ring-fg";

type State = { k: "idle" } | { k: "sending" } | { k: "sent"; review?: Review } | { k: "error"; message: string; whatsapp?: boolean };

/**
 * Write a review, with a photo of the piece. It goes live straight away: the
 * server adds it to the site's reviews, and the site shows it to everyone a
 * minute or two later (after it rebuilds). Meanwhile the customer sees it here.
 */
export function ReviewForm() {
  const [product, setProduct] = useState("");
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<{ bytes: Uint8Array; url: string } | null>(null);
  const [state, setState] = useState<State>({ k: "idle" });

  // /reviews/?product=vortex-vase (from a product page)
  useEffect(() => {
    const slug = new URLSearchParams(location.search).get("product");
    if (slug && products.some((p) => p.slug === slug)) setProduct(slug);
  }, []);

  const pick = async (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const bytes = await resizePhoto(file, 1280, 0.82);
    setPhoto({ bytes, url: URL.createObjectURL(new Blob([bytes], { type: "image/jpeg" })) });
  };

  const whatsappText = () =>
    `Hi ${site.name}! My review${product ? ` of the ${products.find((p) => p.slug === product)?.name}` : ""}: ${"★".repeat(rating)} ${text} — ${name}${city ? `, ${city}` : ""}`;

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!rating) return setState({ k: "error", message: "Tap the stars to give a rating." });
    if (state.k === "sending") return; // one review per tap
    setState({ k: "sending" });
    const honeypot = (new FormData(e.currentTarget).get("website") as string) || "";
    try {
      const res = await fetch(`${API}/review/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, city, product, rating, text, photo: photo ? toBase64(photo.bytes) : undefined, website: honeypot }),
      });
      if (res.ok) {
        track("review_sent", { product, rating, photo: !!photo });
        const posted = ((await res.json().catch(() => ({}))) as { review?: Review }).review;
        // show it with the photo from this device (the site's copy appears after the rebuild)
        return setState({ k: "sent", review: posted && { ...posted, image: posted.image && photo ? photo.url : undefined } });
      }
      const err = ((await res.json().catch(() => ({}))) as { error?: string }).error;
      setState(
        res.status === 429
          ? { k: "error", message: "Thanks, we've already got a few reviews from you. Try again in an hour." }
          : res.status === 400
            ? {
                k: "error",
                message:
                  err === "text"
                    ? "Tell us a little more (at least a sentence)."
                    : err === "photo"
                      ? "That photo couldn't be used. Try another one."
                      : err === "links"
                        ? "Please leave out website links."
                        : "Check the form and try again.",
              }
            : { k: "error", message: "Reviews can't be received here right now. Send it to us on WhatsApp instead:", whatsapp: true },
      );
    } catch {
      setState({ k: "error", message: "Couldn't send it. Check your connection, or send it on WhatsApp:", whatsapp: true });
    }
  };

  if (state.k === "sent")
    return (
      <div className="space-y-6">
        <div role="status" className="rounded-[var(--radius-tile)] bg-page-2 p-6 text-center">
          <p className="text-2xl font-semibold tracking-tight">Thank you!</p>
          <p className="mt-2 text-muted">Your review is posted. It shows on the site for everyone in a minute or two.</p>
        </div>
        {state.review && (
          <div className="mx-auto max-w-sm">
            <p className="mb-2 text-sm text-muted">Your review</p>
            <ReviewCard review={state.review} />
          </div>
        )}
      </div>
    );

  return (
    <form onSubmit={submit} className="space-y-5 rounded-[var(--radius-tile)] bg-page-2 p-5 sm:p-6">
      <div>
        <label htmlFor="r-product" className="mb-1.5 block text-sm font-semibold">
          What did you buy?
        </label>
        <select id="r-product" value={product} onChange={(e) => setProduct(e.target.value)} className={input}>
          <option value="">A custom print / something else</option>
          {products.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold">Your rating</legend>
        <div className="flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              onClick={() => setRating(n)}
              className={`h-11 w-11 rounded-full text-3xl leading-none transition-transform active:scale-90 ${n <= rating ? "text-pop" : "text-fg/20 hover:text-pop/60"}`}
            >
              ★
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="r-text" className="mb-1.5 block text-sm font-semibold">
          Your review
        </label>
        <textarea
          id="r-text"
          required
          minLength={10}
          maxLength={1000}
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="How does it look, how was the finish, how was delivery?"
          className={input}
        />
      </div>

      <div>
        <p className="mb-1.5 text-sm font-semibold">A photo of it (recommended)</p>
        {photo ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt="Your photo" className="h-20 w-20 rounded-xl border border-line object-cover" />
            <button type="button" onClick={() => setPhoto(null)} className="text-sm font-semibold text-danger hover:underline">
              Remove photo
            </button>
          </div>
        ) : (
          <label className="relative flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-fg/25 bg-raised px-4 py-5 text-sm font-semibold focus-within:ring-2 focus-within:ring-accent-2 hover:border-fg/50">
            📷 Add a photo of your print
            {/* invisible, over the whole box: tap anywhere on it, or reach it with the keyboard */}
            <input type="file" accept="image/*" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" onChange={(e) => pick(e.target.files?.[0])} />
          </label>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="r-name" className="mb-1.5 block text-sm font-semibold">
            Your name
          </label>
          <input id="r-name" required minLength={2} maxLength={40} value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" className={input} />
        </div>
        <div>
          <label htmlFor="r-city" className="mb-1.5 block text-sm font-semibold">
            City <span className="font-normal text-muted">(optional)</span>
          </label>
          <input id="r-city" maxLength={40} value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" className={input} />
        </div>
      </div>

      {/* a trap for bots: off screen and hidden from people and screen readers; bots fill it in */}
      <div aria-hidden className="pointer-events-none fixed -left-[9999px] top-0">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" className="h-10 w-40" />
        </label>
      </div>

      {state.k === "error" && (
        <p role="alert" className="rounded-xl border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
          {state.message}{" "}
          {state.whatsapp && (
            <a href={whatsappUrl(whatsappText())} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-4">
              Send on WhatsApp
            </a>
          )}
        </p>
      )}

      <button type="submit" disabled={state.k === "sending"} className="btn btn-primary w-full disabled:opacity-60">
        {state.k === "sending" ? "Sending…" : "Send review"}
      </button>
      <p className="text-xs text-muted">Your review goes up on the site straight away. Only your name and city are shown.</p>
    </form>
  );
}
