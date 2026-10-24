import Link from "next/link";
import { getFinish, getProduct, photosFor, products } from "@/lib/products";
import { renderFor, renderSrcSet } from "@/lib/renders";
import { formatPrice } from "@/lib/site";

// the piece on the cover: the spiral vase the logo's printer is making
const hero = getProduct("vortex-vase") ?? products[0];

/**
 * The cover: one headline, one sentence, one button and a quiet link, over a
 * single product as the picture. Server-rendered and plain CSS (.hero-in), so it
 * paints at once; when the opening animation plays it fades in as that lifts away.
 */
export function Hero() {
  const f = hero.finishes[0];
  const photo = photosFor(hero, f).list[0];
  const src = photo ?? renderFor(hero, f, "xl");
  return (
    <section className="overflow-hidden pb-16 pt-24 text-center sm:pb-20 sm:pt-32">
      <div className="mx-auto max-w-5xl px-5">
        <h1 className="hero-in headline-xl" style={{ ["--d" as string]: "0.05s" }}>
          Small objects.
          <br />
          Extraordinary ideas.
        </h1>
        <p className="hero-in lead mx-auto mt-4 max-w-xl sm:mt-5" style={{ ["--d" as string]: "0.12s" }}>
          Thoughtfully designed 3D-printed pieces for your space, your style, and the people you love.
        </p>
        <div className="hero-in mt-7 flex flex-wrap items-center justify-center gap-x-7 gap-y-4" style={{ ["--d" as string]: "0.2s" }}>
          <Link href="/shop/" className="btn btn-primary">
            Explore the collection
          </Link>
          <Link href="/personalise/" className="link-more">
            Create something personal
          </Link>
        </div>
      </div>
      {src && (
        <Link href={`/shop/${hero.slug}/`} className="hero-in group mx-auto mt-6 block w-[min(88vw,600px)] sm:mt-2" style={{ ["--d" as string]: "0.28s" }}>
          <span className="block aspect-square">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              srcSet={photo ? undefined : renderSrcSet(hero, f)}
              sizes="(min-width: 700px) 600px, 88vw"
              width={1200}
              height={1200}
              alt={`${hero.name} in ${getFinish(f).name}`}
              fetchPriority="high"
              decoding="async"
              className="h-full w-full object-contain"
            />
          </span>
          <span className="-mt-2 block text-sm text-muted sm:-mt-4">
            {hero.name} · From {formatPrice(hero.price)}
          </span>
        </Link>
      )}
    </section>
  );
}
