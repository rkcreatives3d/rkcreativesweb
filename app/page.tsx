import { Hero } from "@/components/home/Hero";
import { MarqueeStrip } from "@/components/home/MarqueeStrip";
import { Featured } from "@/components/home/Featured";
import { CustomCta } from "@/components/home/CustomCta";
import { NameTeaser } from "@/components/home/NameTeaser";
import { PhotoGrid, Reviews } from "@/components/Proof";
import { customerPhotos, reviews } from "@/lib/content";
import { ProductCard } from "@/components/ProductCard";
import { HoloLink, KineticText, SectionLabel } from "@/components/ui";
import { products } from "@/lib/products";

export default function Home() {
  const fresh = products.filter((p) => p.badge).concat(products.filter((p) => !p.badge)).slice(0, 6);
  return (
    <>
      <Hero />
      <MarqueeStrip />
      <Featured />
      <NameTeaser />

      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionLabel>In stock to print</SectionLabel>
            <h2 className="mt-4 font-display text-5xl font-extrabold display-case leading-[0.9] tracking-tight sm:text-7xl">
              <KineticText text="Fresh off" />
              <br />
              <KineticText text="the bed" holo delay={0.2} />
            </h2>
          </div>
          <HoloLink href="/shop/">View all {products.length} →</HoloLink>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {fresh.map((p, i) => (
            <ProductCard key={p.slug} product={p} index={i} />
          ))}
        </div>
      </section>

      <Reviews reviews={reviews} />
      <PhotoGrid photos={customerPhotos} label="From our customers" title="In their" highlight="homes" />
      <CustomCta />
    </>
  );
}
