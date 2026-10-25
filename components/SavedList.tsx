"use client";

import { useEffect, useState } from "react";
import { getProduct, type Product } from "@/lib/products";
import { useShelf } from "@/lib/shelf";
import { ProductCard } from "./ProductCard";
import { RecentlyViewed } from "./ProductStrip";
import { ButtonLink } from "./ui";
import { popular } from "@/lib/popular";

/** The products saved with the heart, in this browser. */
export function SavedList() {
  const slugs = useShelf((s) => s.saved);
  // the list lives in this browser: wait until it has loaded, so the page doesn't flash "nothing saved"
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (useShelf.persist.hasHydrated()) setLoaded(true);
    else return useShelf.persist.onFinishHydration(() => setLoaded(true));
  }, []);
  const list = slugs.map((s) => getProduct(s)).filter((p): p is Product => !!p);

  if (!loaded) return <div className="min-h-[40svh]" />;
  return (
    <>
      {list.length ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 lg:grid-cols-3">
          {list.map((p, i) => (
            <ProductCard key={p.slug} product={p} index={i} />
          ))}
        </div>
      ) : (
        <>
          <div className="rounded-[var(--radius-tile)] bg-page-2 p-10 text-center">
            <p className="text-2xl font-semibold tracking-tight">Nothing saved yet</p>
            <p className="mt-2 text-muted">Tap the heart on anything you like and it shows up here, on this phone or computer.</p>
            <div className="mt-6">
              <ButtonLink href="/shop/" primary>
                Explore the collection
              </ButtonLink>
            </div>
          </div>
          {/* somewhere to start */}
          <section aria-labelledby="popular-title" className="mt-14">
            <h2 id="popular-title" className="section-title text-2xl sm:text-[1.75rem]">
              Popular right now
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 lg:grid-cols-4">
              {popular(4).map((p, i) => (
                <ProductCard key={p.slug} product={p} index={i} />
              ))}
            </div>
          </section>
        </>
      )}
      <RecentlyViewed className="mt-16" />
    </>
  );
}
