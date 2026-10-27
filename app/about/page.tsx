import type { Metadata } from "next";
import { ButtonLink, KineticText, Reveal, SectionLabel } from "@/components/ui";
import { InstagramGrid, PhotoGrid, Reviews } from "@/components/Proof";
import { StudioClip } from "@/components/StudioClip";
import { about, customerPhotos, instagramPosts, packingPhotos, reviews } from "@/lib/content";
import { emailReady, site, whatsappUrl } from "@/lib/site";
import { backdropFor, getFinish, getProduct, type Product } from "@/lib/products";
import { renderFor } from "@/lib/renders";

export const metadata: Metadata = {
  alternates: { canonical: "/about/" },
  title: "About",
  description: `The maker behind ${site.name}: printed to order and finished by hand in ${site.city}.`,
};

const steps = [
  ["Model", "Every object starts as a 3D design, sculpted or chosen with you, and checked for strength and printability."],
  ["Slice", "Software cuts it into hundreds of thin layers and plans every move of the nozzle."],
  ["Print", "The printer lays down each layer of molten plastic on top of the last. Some pieces take a few hours, some a whole day."],
  ["Finish", "Supports removed, edges cleaned up, then checked, packed with care and sent to your door."],
];

const promises = [
  ["Printed to order", "Nothing sits in a warehouse. Your piece is made for you."],
  ["Hand finished", "Every print is cleaned up and checked before it ships."],
  ["Custom welcome", "Names, colours, sizes or a completely new idea."],
  ["Real support", "Questions go straight to the maker on WhatsApp."],
];

// four different pieces in four different colours, for the photo spot until there's a workshop photo
const showcase = (["vortex-vase", "infinity-knot", "geodesic-orb-lamp", "name-keychain"] as const)
  .map((slug, i) => {
    const p = getProduct(slug);
    const f = p?.finishes[Math.min(i, p.finishes.length - 1)];
    return p && f && renderFor(p, f) ? { p, f } : null;
  })
  .filter((x): x is { p: Product; f: string } => !!x);

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-24 sm:px-6 sm:pt-32 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <SectionLabel>About {site.name}</SectionLabel>
          <h1 className="headline-lg mt-2">
            <KineticText text="The maker behind it." />
          </h1>
          <div className="mt-6 max-w-xl space-y-4 text-lg leading-relaxed text-fg/80">
            {/* top of the page: shown straight away, no fade-in (it's what people came to read) */}
            {about.story.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted">Based in {site.city}</p>
        </div>
        <div className="relative">
          {about.photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={about.photos[0].src} alt={about.photos[0].caption ?? ""} className="aspect-square w-full rounded-[var(--radius-tile)] object-cover" />
          ) : (
            // until there's a workshop photo (lib/content.ts about.photos): a few of the designs
            <figure>
              <ul className="grid grid-cols-2 gap-3">
                {showcase.map(({ p, f }, i) => (
                  <li key={p.slug} className={`stage ${backdropFor(f)} overflow-hidden rounded-[var(--radius-tile)]`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={renderFor(p, f)}
                      alt={`${p.name}, ${getFinish(f).name}`}
                      width={720}
                      height={720}
                      fetchPriority={i === 0 ? "high" : undefined}
                      className="aspect-square h-auto w-full object-cover"
                    />
                  </li>
                ))}
              </ul>
              <figcaption className="mt-3 text-sm text-muted">A few of our designs, each printed to order.</figcaption>
            </figure>
          )}
        </div>
      </section>

      <section className="bg-page-2 px-5 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="headline-md">How every piece is made.</h2>
          <ol className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(([title, body], i) => (
              <Reveal as="li" key={title} delay={i * 0.06} className="border-t border-line pt-5">
                <span className="tabular-nums text-sm text-muted">0{i + 1}</span>
                <p className="mt-1 text-xl font-semibold tracking-tight">{title}</p>
                <p className="mt-2 leading-relaxed text-muted">{body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
        <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {promises.map(([title, body], i) => (
            <Reveal key={title} delay={i * 0.05}>
              <p className="font-semibold">{title}</p>
              <p className="mt-1 text-muted">{body}</p>
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

      <section className="px-3 pb-3 sm:px-4 sm:pb-4">
        <div className="cta-card mx-auto max-w-[90rem] rounded-[var(--radius-tile)] px-6 py-20 text-center sm:py-24">
          <h2 className="headline-md">Say hello.</h2>
          <p className="lead mx-auto mt-3 max-w-md">Questions, ideas or bulk orders. Message the maker directly.</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <ButtonLink href={whatsappUrl(`Hi ${site.name}!`)} primary target="_blank" rel="noreferrer">
              WhatsApp us
            </ButtonLink>
            {emailReady && <ButtonLink href={`mailto:${site.email}`}>Email</ButtonLink>}
            <a href={site.instagram} target="_blank" rel="noreferrer" className="link-more">
              Instagram
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
