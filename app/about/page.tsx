import type { Metadata } from "next";
import { ButtonLink, KineticText, Reveal, SectionLabel } from "@/components/ui";
import { InstagramGrid, PhotoGrid, Reviews } from "@/components/Proof";
import { StudioClip } from "@/components/StudioClip";
import { about, customerPhotos, instagramPosts, packingPhotos, reviews } from "@/lib/content";
import { site, whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/about/" },
  title: "About",
  description: `The maker behind ${site.name}: printed to order and finished by hand in ${site.city}.`,
};

const steps = [
  ["Model", "Every object starts as a 3D design, sculpted or chosen with you, and checked for strength and printability."],
  ["Slice", "Software cuts it into hundreds of thin layers, as fine as 0.12 mm, and plans every move of the nozzle."],
  ["Print", "The printer lays down each layer of molten plastic on top of the last. Some pieces take a few hours, some a whole day."],
  ["Finish", "Supports removed, edges cleaned up, then checked, packed with care and sent to your door."],
];

const promises = [
  ["Printed to order", "Nothing sits in a warehouse. Your piece is made for you."],
  ["Hand finished", "Every print is cleaned up and checked before it ships."],
  ["Custom welcome", "Names, colours, sizes or a completely new idea."],
  ["Real support", "Questions go straight to the maker on WhatsApp."],
];

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-28 sm:px-8 sm:pt-36 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <SectionLabel>About {site.name}</SectionLabel>
          <h1 className="mt-4 font-display text-6xl font-extrabold display-case leading-[0.88] tracking-tight sm:text-8xl">
            <KineticText text="The maker" />
            <br />
            <KineticText text="behind it" holo delay={0.15} />
          </h1>
          <div className="mt-8 max-w-xl space-y-4 text-lg leading-relaxed text-fg/80">
            {/* top of the page: shown straight away, no fade-in (it's what people came to read) */}
            {about.story.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <p className="mt-6 tabular-nums text-xs uppercase tracking-[0.12em] text-muted">Based in {site.city}</p>
        </div>
        <div className="relative">
          {about.photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={about.photos[0].src} alt={about.photos[0].caption ?? ""} className="aspect-square w-full rounded-[32px] border border-line object-cover" />
          ) : (
            <picture>
              <source type="image/webp" srcSet="/brand/logo-480.webp 480w, /brand/logo-720.webp 720w, /brand/logo-1080.webp 1080w" sizes="(min-width: 1024px) 45vw, 90vw" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/logo.jpg"
                alt={`${site.name} logo`}
                width={1254}
                height={1254}
                fetchPriority="high"
                className="h-auto w-full rounded-[32px] border border-line bg-black"
              />
            </picture>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <SectionLabel>How every order is made</SectionLabel>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(([title, body], i) => (
            <Reveal as="li" key={title} delay={i * 0.08} className="h-full rounded-[28px] border border-line bg-surface p-6">
                <span className="tabular-nums text-xs text-pop">0{i + 1}</span>
                <p className="mt-2 font-display text-2xl display-case">{title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {promises.map(([title, body], i) => (
            <Reveal key={title} delay={i * 0.06}>
              <div className="border-t border-pop/40 pt-4">
                <p className="font-semibold">{title}</p>
                <p className="mt-1 text-sm text-muted">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <StudioClip link={false} />
      <PhotoGrid photos={about.photos.slice(1)} label="The workshop" title="Behind the" highlight="scenes" />
      <PhotoGrid photos={packingPhotos} label="Packed with care" title="How we" highlight="pack" />
      <Reviews reviews={reviews} />
      <PhotoGrid photos={customerPhotos} label="From our customers" title="In their" highlight="homes" />
      <InstagramGrid posts={instagramPosts} />

      <section className="px-5 py-20 sm:px-8">
        <div className="cta-card mx-auto max-w-7xl rounded-[40px] p-8 text-center sm:p-14">
          <Reveal y={24}>
            <h2 className="font-display text-4xl font-extrabold display-case sm:text-6xl">
              Say <span className="text-pop">hello</span>
            </h2>
          </Reveal>
          <p className="mx-auto mt-4 max-w-md text-muted">Questions, ideas or bulk orders. Message the maker directly.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href={whatsappUrl(`Hi ${site.name}!`)} primary target="_blank" rel="noreferrer">
              WhatsApp us
            </ButtonLink>
            <ButtonLink href={`mailto:${site.email}`}>Email</ButtonLink>
            <ButtonLink href={site.instagram} target="_blank" rel="noreferrer">
              Instagram
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
