"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getProduct } from "@/lib/products";
import { MAX_NAME } from "@/lib/personalise";
import { formatPrice } from "@/lib/site";
import { Reveal } from "../ui";

const kinds = [
  { id: "keychain", slug: "name-keychain", label: "Keychain" },
  { id: "nameplate", slug: "desk-nameplate", label: "Desk nameplate" },
] as const;

/**
 * Personalisation on the home page: type a name, pick keychain or nameplate,
 * see a flat preview update as you type, then carry on to the Personalise page
 * (live 3D preview, colours, lettering and size, add to cart).
 */
export function NameTeaser() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<(typeof kinds)[number]["id"]>("keychain");
  const shown = name.trim() || "Your name";
  const len = Math.max(shown.length, 5);
  const options = kinds.map((k) => ({ ...k, product: getProduct(k.slug) })).filter((k) => k.product);
  if (!options.length) return null;

  return (
    <section className="px-5 py-20 sm:px-6 sm:py-28" aria-labelledby="personalise-title">
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2 md:gap-14">
        <Reveal className="order-2 md:order-1">
          <p className="eyebrow">Personalised</p>
          <h2 id="personalise-title" className="headline-lg mt-2">
            Make it yours.
          </h2>
          <p className="lead mt-4 max-w-md">Any name or short word, printed in raised letters. Type it and see how it looks.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/personalise/?name=${encodeURIComponent(name.trim())}&style=${kind}`);
            }}
            className="mt-8 max-w-md space-y-4"
          >
            <div>
              <label htmlFor="teaser-name" className="mb-1.5 block text-sm font-medium">
                Name or word
              </label>
              <input
                id="teaser-name"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, MAX_NAME))}
                placeholder="e.g. Ananya"
                autoComplete="off"
                className="h-12 w-full rounded-xl border border-subtle bg-page px-4 text-lg text-fg outline-none transition-colors placeholder:text-subtle hover:border-fg/70 focus-visible:border-fg focus-visible:ring-1 focus-visible:ring-fg"
              />
              <p className="mt-1.5 text-xs text-muted">
                Up to {MAX_NAME} letters · {name.length}/{MAX_NAME}
              </p>
            </div>
            <fieldset>
              <legend className="mb-1.5 text-sm font-medium">Print it as</legend>
              <div className="grid grid-cols-2 gap-2">
                {options.map((k) => (
                  <label
                    key={k.id}
                    className={`relative cursor-pointer rounded-xl border px-4 py-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-2 ${kind === k.id ? "pick-on" : "border-line hover:border-fg/30"}`}
                  >
                    {/* the real radio button, invisible, over the whole option */}
                    <input type="radio" name="kind" value={k.id} checked={kind === k.id} onChange={() => setKind(k.id)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                    <span className="block text-sm font-semibold">{k.label}</span>
                    <span className="block tabular-nums text-xs text-muted">From {formatPrice(k.product!.price)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <button type="submit" className="btn btn-primary w-full sm:w-auto">
              Preview it in 3D
            </button>
          </form>
        </Reveal>

        {/* a flat preview of the name (above the form on phones, so it's in view while typing);
            the 3D one, and colour, lettering and size, are on the next page */}
        <div className="order-1 md:order-2">
          <div aria-hidden className="stage relative grid aspect-[4/3] place-items-center overflow-hidden rounded-[var(--radius-tile)] px-6 [container-type:inline-size]">
            <span className="absolute left-5 top-4 text-xs font-medium text-muted">Preview</span>
            {kind === "keychain" ? (
              <div className="relative flex max-w-full items-center gap-[4cqw] rounded-[5cqw] bg-[#2a2a2c] py-[4.5cqw] pl-[4cqw] pr-[7cqw] shadow-[0_22px_40px_-22px_rgba(0,0,0,0.55)]">
                <span className="h-[5cqw] w-[5cqw] shrink-0 rounded-full border-[1.2cqw] border-[#c9c9cc] bg-[#f5f5f7]" />
                <Letters text={shown} len={len} />
              </div>
            ) : (
              <div className="relative flex max-w-full flex-col items-center">
                <div className="rounded-[2cqw] bg-[#2a2a2c] px-[7cqw] py-[5cqw] shadow-[0_22px_40px_-22px_rgba(0,0,0,0.55)] [transform:perspective(60cqw)_rotateX(14deg)]">
                  <Letters text={shown} len={len} />
                </div>
                <div className="h-[3cqw] w-[108%] rounded-b-[1.5cqw] bg-[#1f1f21]" />
              </div>
            )}
          </div>
          <p className="mt-3 text-center text-sm text-muted">Colour, lettering and size are chosen on the next step.</p>
        </div>
      </div>
    </section>
  );
}

function Letters({ text, len }: { text: string; len: number }) {
  return (
    <span
      className="block truncate bg-[linear-gradient(180deg,#f7dc8f,#c8922e_70%,#a8731f)] bg-clip-text font-bold leading-none tracking-tight text-transparent"
      style={{ fontSize: `min(4.2rem, ${(120 / len).toFixed(1)}cqw)` }}
    >
      {text}
    </span>
  );
}
