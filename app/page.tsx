import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { Showcase, ShowcasePair } from "@/components/home/Showcase";
import { ShopByCollection } from "@/components/home/ShopByCollection";
import { NameTeaser } from "@/components/home/NameTeaser";
import { Process } from "@/components/home/Process";
import { CustomCta } from "@/components/home/CustomCta";
import { BrandStory } from "@/components/home/BrandStory";
import { InstagramGrid, PhotoGrid, Reviews } from "@/components/Proof";
import { StudioClip } from "@/components/StudioClip";
import { customerPhotos, instagramPosts, reviews } from "@/lib/content";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <>
      <Hero />
      <Showcase
        dark
        story={{
          slug: "infinity-knot",
          eyebrow: "Giftables",
          title: "No beginning. No end.",
          body: "A trefoil knot in silk gold, sanded and clear-coated for a glass-smooth finish.",
          more: { href: "/shop/?c=Giftables", label: "Shop giftables" },
        }}
      />
      <Showcase
        layout="split"
        story={{
          slug: "geodesic-orb-lamp",
          eyebrow: "New",
          title: "Light, in eighty facets.",
          body: "A geodesic cage around a warm LED core. Switch it on and the room fills with a web of shadows.",
          more: { href: "/shop/?c=Aesthetic", label: "Shop aesthetic" },
        }}
      />
      <div className="pt-3 sm:pt-4" />
      <ShowcasePair
        stories={[
          { slug: "lord-vishnu", eyebrow: "Devotion", title: "Lord Vishnu", body: "A devotional figure, printed in matte black.", more: { href: "/shop/?c=Devotion", label: "Shop devotion" } },
          { slug: "gear-spinner", eyebrow: "Giftables", title: "Gear Spinner", body: "A twelve-tooth desk fidget on a steel bearing. Flick it and it spins for ages." },
        ]}
      />
      <ShopByCollection />
      <NameTeaser />
      <Process />
      <CustomCta />
      <BrandStory />
      <StudioClip />
      <Reviews reviews={reviews} />
      <PhotoGrid photos={customerPhotos} label="From our customers" title="In their" highlight="homes" />
      <InstagramGrid posts={instagramPosts} />
    </>
  );
}
