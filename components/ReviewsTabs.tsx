"use client";

import { useEffect, useRef, useState } from "react";
import type { Review } from "@/lib/content";
import { ReviewCard } from "./Reviews";
import { ReviewForm } from "./ReviewForm";

type Tab = "write" | "all";
const tabs: [Tab, string][] = [
  ["write", "Write a new review"],
  ["all", "View all customer reviews"],
];
const fromHash = (hash: string): Tab | null => (hash === "#write" ? "write" : hash === "#all" ? "all" : null);

/**
 * The two halves of the Customer reviews page, as tabs: writing a new review
 * (with a photo) and reading every approved review. Links can open either one:
 * /reviews/#write (product pages add ?product=<slug>) and /reviews/#all. Without
 * one, it opens on the reviews when there are some, else on the form.
 */
export function ReviewsTabs({ reviews }: { reviews: Review[] }) {
  const [tab, setTab] = useState<Tab>(reviews.length ? "all" : "write");
  const buttons = useRef<Record<Tab, HTMLButtonElement | null>>({ write: null, all: null });

  useEffect(() => {
    const pick = () => {
      const t = fromHash(location.hash);
      if (t) setTab(t);
    };
    pick();
    window.addEventListener("hashchange", pick);
    return () => window.removeEventListener("hashchange", pick);
  }, []);

  const choose = (t: Tab, focus = false) => {
    setTab(t);
    // the address says which tab is open, so it can be shared or reloaded
    history.replaceState(null, "", `${location.pathname}${location.search}#${t}`);
    if (focus) buttons.current[t]?.focus();
  };

  return (
    <div>
      {/* phones: two equal halves (labels may wrap); wider screens: sized to the labels */}
      <div role="tablist" aria-label="Customer reviews" className="grid w-full grid-cols-2 gap-1 rounded-xl bg-page-2 p-1 sm:inline-grid sm:w-auto">
        {tabs.map(([id, label], i) => (
          <button
            key={id}
            ref={(el) => {
              buttons.current[id] = el;
            }}
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls={id}
            tabIndex={tab === id ? 0 : -1}
            onClick={() => choose(id)}
            onKeyDown={(e) => {
              // ←/→ move between the tabs, as in any tab list
              if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
              e.preventDefault();
              choose(tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length][0], true);
            }}
            className={`rounded-lg px-3 py-2.5 text-sm font-medium leading-snug transition-colors sm:whitespace-nowrap sm:px-4 ${
              tab === id ? "bg-page text-fg shadow-[0_1px_3px_rgba(0,0,0,0.12)]" : "text-muted hover:text-fg"
            }`}
          >
            {label}
            {id === "all" && reviews.length > 0 && <span className="ml-1.5 tabular-nums text-muted">{reviews.length}</span>}
          </button>
        ))}
      </div>

      {/* both stay in the page (the reviews are there for search engines too); only the chosen one shows */}
      <section id="write" role="tabpanel" aria-labelledby="tab-write" hidden={tab !== "write"} className="mt-8 scroll-mt-24">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,36rem)_minmax(0,22rem)] lg:gap-16">
          <ReviewForm />
          <aside aria-labelledby="tips-title" className="hidden lg:block">
            <div className="rounded-[var(--radius-tile)] bg-page-2 p-7">
              <h2 id="tips-title" className="section-title text-xl">
                What helps other buyers
              </h2>
              <ul className="mt-4 space-y-4 text-sm leading-relaxed text-fg/80">
                {[
                  ["📷", "A photo in daylight, with something next to it for size."],
                  ["🎨", "How the colour and finish look in person."],
                  ["📦", "How it was packed, and how long it took to arrive."],
                ].map(([icon, text]) => (
                  <li key={text} className="flex gap-3">
                    <span aria-hidden className="text-lg leading-6">
                      {icon}
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
              <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
                Your review goes up straight away (it takes a minute or two to appear for everyone). Something wrong with your order? Message us on WhatsApp first and we&apos;ll put it right.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section id="all" role="tabpanel" aria-labelledby="tab-all" hidden={tab !== "all"} className="mt-8 scroll-mt-24">
        {reviews.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r, i) => (
              <ReviewCard key={r.id ?? i} review={r} />
            ))}
          </div>
        ) : (
          <div className="rounded-[var(--radius-tile)] bg-page-2 px-6 py-14 text-center">
            <p className="text-xl font-semibold tracking-tight">No customer reviews yet.</p>
            <p className="mx-auto mt-2 max-w-md text-muted">Bought something from us? Be the first to tell others what you think, with a photo of your print.</p>
            <button onClick={() => choose("write", true)} className="btn btn-primary mt-6">
              Write a new review
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
