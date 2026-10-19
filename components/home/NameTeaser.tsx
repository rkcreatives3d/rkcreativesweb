"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Reveal, SectionLabel } from "../ui";
import { MAX_NAME } from "../three/nameplate";

/** Home-page hook into the Personalise studio: type a name, jump to the live 3D preview. */
export function NameTeaser() {
  const router = useRouter();
  const [name, setName] = useState("");
  return (
    <section className="px-5 py-20 sm:px-8">
      <div className="cta-card mx-auto grid max-w-7xl items-center gap-10 rounded-[40px] p-8 sm:p-14 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <SectionLabel>Personalised gifts</SectionLabel>
          <Reveal y={24}>
            <h2 className="mt-4 font-display text-5xl font-extrabold display-case leading-[0.9] tracking-tight sm:text-7xl">
              Type a name.
              <br />
              <span className="text-pop">See it in 3D.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-6 max-w-md text-muted">
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
            className="w-full rounded-2xl border border-fg/15 bg-page/60 px-5 py-4 font-display text-3xl display-case text-fg outline-none placeholder:text-fg/50 focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          <button type="submit" className="btn btn-primary">
            Preview it in 3D →
          </button>
        </form>
      </div>
    </section>
  );
}
