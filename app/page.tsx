import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { QuickLinks } from "@/components/home/QuickLinks";
import { Promo } from "@/components/home/Promo";
import { Bestsellers } from "@/components/home/Bestsellers";
import { Showcase, ShowcaseTiles, StoryCarousel, type Story } from "@/components/home/Showcase";
import { ShopByCollection } from "@/components/home/ShopByCollection";
import { NameTeaser } from "@/components/home/NameTeaser";
import { Process } from "@/components/home/Process";
import { CustomCta } from "@/components/home/CustomCta";
import { BrandStory } from "@/components/home/BrandStory";
import { InstagramGrid, PhotoGrid, Reviews } from "@/components/Proof";
import { StudioClip } from "@/components/StudioClip";
import { customerPhotos, instagramPosts, reviews } from "@/lib/content";
import { promoLive } from "@/lib/promo";

export const metadata: Metadata = { alternates: { canonical: "/" } };

// The featured pieces. Computers: the first as a full black spotlight, the
// rest as tiles side by side. Phones: all of them as cards to swipe through.
const lead: Story = {
  slug: "infinity-knot",
  eyebrow: "Giftables",
  title: "No beginning. No end.",
  body: "A trefoil knot in silk gold, sanded and clear-coated for a glass-smooth finish.",
  more: { href: "/shop/?c=Giftables", label: "Shop giftables" },
  dark: true,
};
const more: Story[] = [
  {
    slug: "geodesic-orb-lamp",
    eyebrow: "New",
    title: "Light, in eighty facets.",
    body: "A geodesic cage around a warm LED core. Switch it on and the room fills with a web of shadows.",
    more: { href: "/shop/?c=Aesthetic", label: "Shop aesthetic" },
  },
  { slug: "lord-vishnu", eyebrow: "Devotion", title: "Lord Vishnu", body: "A devotional figure, printed in matte black.", more: { href: "/shop/?c=Devotion", label: "Shop devotion" } },
  { slug: "gear-spinner", eyebrow: "Giftables", title: "Gear Spinner", body: "A twelve-tooth desk fidget on a steel bearing. Flick it and it spins for ages." },
];

export default function Home() {
  return (
    <>
      <Hero />
      <QuickLinks />
      {promoLive() && (
        <div className="pt-8 sm:pt-10">
          <Promo />
        </div>
      )}
      <Bestsellers />

      <div className="lg:hidden">
        <StoryCarousel stories={[lead, ...more]} title="Featured pieces." />
      </div>
      <div className="hidden lg:block">
        <Showcase dark story={lead} />
        <ShowcaseTiles stories={more} className="pt-3 sm:pt-4" />
      </div>

      <ShopByCollection />
      <NameTeaser />
      <Reviews reviews={reviews} />
      <Process />
      <CustomCta />
      <BrandStory />
      <StudioClip />
      <PhotoGrid photos={customerPhotos} label="From our customers" title="In their" highlight="homes" />
      <InstagramGrid posts={instagramPosts} />
    </>
  );
}
