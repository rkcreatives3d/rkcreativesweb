"use client";

import { useEffect, useState } from "react";
import { getProduct, type Product } from "@/lib/products";
import { useShelf } from "@/lib/shelf";
import { ProductCard } from "./ProductCard";
import { RecentlyViewed } from "./ProductStrip";
import { ButtonLink } from "./ui";

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
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
          {list.map((p, i) => (
            <ProductCard key={p.slug} product={p} index={i} />
          ))}
        </div>
      ) : (
        <div className="rounded-[var(--radius-tile)] bg-page-2 p-10 text-center">
          <p className="text-2xl font-semibold tracking-tight">Nothing saved yet</p>
          <p className="mt-2 text-muted">Tap the heart on anything you like and it shows up here, on this phone or computer.</p>
          <div className="mt-6">
            <ButtonLink href="/shop/" primary>
              Browse the shop →
            </ButtonLink>
          </div>
        </div>
      )}
      <RecentlyViewed className="mt-16" />
    </>
  );
}
