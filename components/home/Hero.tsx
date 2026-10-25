import Link from "next/link";
import { getFinish, getProduct, photosFor, products } from "@/lib/products";
import { renderFor, renderSrcSet } from "@/lib/renders";
import { formatPrice, site } from "@/lib/site";

/**
 * The cover: one headline, one sentence, one button and a quiet link, above
 * one product standing on a soft studio sweep. Which product, and an optional
 * real photo of it, are set on the owner page (Shop settings → Home page cover;
 * content/shop.json "home"). Server-rendered and plain CSS (.hero-in), so it
 * paints at once; when the opening animation plays it fades in as that lifts away.
 */
export function Hero() {
  // the chosen product, if it's in the shop (hidden or deleted ones fall back to another product)
  const chosen = getProduct(site.home.heroProduct);
  const hero = chosen ?? getProduct("vortex-vase") ?? products[0];
  const f = hero.finishes[0];
  // the owner's cover photo belongs to the chosen product only, never to a fallback
  const own = chosen ? site.home.heroImage : "";
  const photo = own || photosFor(hero, f).list[0];
  // a cut-out (transparent) cover photo or a studio picture stands straight on the sweep;
  // any other photo shows whole, framed in a soft panel (never cropped)
  const standing = own ? site.home.heroImageCut : !photo;
  const src = photo || renderFor(hero, f, "xl");
  const from = hero.sizes.some((s) => s.priceDelta) ? "From " : "";
  return (
    <section className="hero-stage overflow-hidden pb-14 pt-24 text-center sm:pb-20 sm:pt-32">
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
          <Link href="/custom/" className="link-more">
            Custom printing
          </Link>
        </div>
      </div>
      {src && (
        <Link
          href={`/shop/${hero.slug}/`}
          className={`hero-in group mx-auto block ${standing ? "mt-4 w-[min(94vw,700px)] sm:mt-2" : "mt-12 w-[min(90vw,880px)]"}`}
          style={{ ["--d" as string]: "0.28s" }}
        >
          <span className={`block overflow-hidden ${standing ? "aspect-square" : "stage aspect-[4/3] rounded-[var(--radius-tile)] p-4 sm:aspect-[16/10] sm:p-6"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              srcSet={photo ? undefined : renderSrcSet(hero, f)}
              sizes={standing ? "(min-width: 760px) 700px, 94vw" : "(min-width: 980px) 880px, 90vw"}
              width={1200}
              height={standing ? 1200 : 750}
              alt={`${hero.name} in ${getFinish(f).name}`}
              fetchPriority="high"
              decoding="async"
              className="h-full w-full object-contain transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          </span>
          <span className={`block text-sm text-muted ${standing ? "-mt-3 sm:-mt-5" : "mt-4"}`}>
            {hero.name} · {from}
            {formatPrice(hero.price)} <span className="text-accent group-hover:underline">View</span>
          </span>
        </Link>
      )}
    </section>
  );
}
