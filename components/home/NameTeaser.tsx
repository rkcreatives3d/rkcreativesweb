"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Reveal } from "../ui";
import { MAX_NAME } from "@/lib/personalise";

/** Home-page hook into the Personalise studio: type a name, jump to the live 3D preview. */
export function NameTeaser() {
  const router = useRouter();
  const [name, setName] = useState("");
  return (
    // the home page's darker beige band: one deliberate change of tone in the scroll
    <section className="bg-page-2 px-5 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent-fill" />
            Personalised gifts
          </p>
          <Reveal y={24}>
            <h2 className="mt-4 section-title text-3xl sm:text-[2.6rem]">
              Type a name. See it in&nbsp;3D.
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-5 max-w-md text-fg/75">
              Keychains and desk nameplates with raised gold letters. Preview it live, then we print it for you.
            </p>
          </Reveal>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/personalise/?name=${encodeURIComponent(name.trim())}`);
          }}
          className="flex flex-col gap-3"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, MAX_NAME))}
            placeholder="Your name"
            aria-label="Name to preview"
            className="w-full rounded-xl border border-line bg-surface px-5 py-4 font-display text-3xl display-case text-fg outline-none placeholder:text-fg/40 focus:border-accent-2 focus:ring-2 focus:ring-accent-2/20"
          />
          <button type="submit" className="btn btn-primary">
            Preview it in 3D →
          </button>
        </form>
      </div>
    </section>
  );
}
