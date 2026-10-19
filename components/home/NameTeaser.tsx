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
    // the one light band on the home page: breaks up the long dark scroll
    <section className="bg-fg px-5 py-20 text-page sm:px-8 sm:py-24 [&_:focus-visible]:outline-page">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7a5a24]">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#b07a2a]" />
            Personalised gifts
          </p>
          <Reveal y={24}>
            <h2 className="mt-4 font-display text-4xl font-extrabold display-case leading-none tracking-tight sm:text-5xl">
              Type a name. See it in&nbsp;3D.
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-5 max-w-md text-page/75">
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
            className="w-full rounded-xl border border-page/15 bg-white px-5 py-4 font-display text-3xl display-case text-page outline-none placeholder:text-page/45 focus:border-page focus:ring-2 focus:ring-page/15"
          />
          <button type="submit" className="btn btn-primary">
            Preview it in 3D →
          </button>
        </form>
      </div>
    </section>
  );
}
