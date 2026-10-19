import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { MarqueeStrip } from "@/components/home/MarqueeStrip";
import { ShopByOccasion } from "@/components/home/ShopByOccasion";
import { CustomCta } from "@/components/home/CustomCta";
import { NameTeaser } from "@/components/home/NameTeaser";
import { InstagramGrid, PhotoGrid, Reviews } from "@/components/Proof";
import { StudioClip } from "@/components/StudioClip";
import { customerPhotos, instagramPosts, reviews } from "@/lib/content";
import { ProductCard } from "@/components/ProductCard";
import { ButtonLink, Reveal } from "@/components/ui";
import { products } from "@/lib/products";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  const fresh = products.filter((p) => p.badge).concat(products.filter((p) => !p.badge)).slice(0, 6);
  return (
    <>
      <Hero />
      <MarqueeStrip />
      <NameTeaser />
      <ShopByOccasion />

      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Reveal y={24}>
              <h2 className="font-display text-4xl font-extrabold display-case leading-none tracking-tight sm:text-5xl">Fresh off the bed</h2>
            </Reveal>
          </div>
          <ButtonLink href="/shop/">View all {products.length} →</ButtonLink>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {fresh.map((p, i) => (
            <ProductCard key={p.slug} product={p} index={i} />
          ))}
        </div>
      </section>

      <StudioClip />
      <Reviews reviews={reviews} />
      <PhotoGrid photos={customerPhotos} label="From our customers" title="In their" highlight="homes" />
      <InstagramGrid posts={instagramPosts} />
      <CustomCta />
    </>
  );
}
