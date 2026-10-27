import Link from "next/link";
import { getFinish, getProduct, isLightFinish, photoColour, photosFor, type Product } from "@/lib/products";
import { renderFor, renderSrcSet } from "@/lib/renders";
import { formatPrice } from "@/lib/site";
import { Reveal } from "../ui";

export type Story = {
  slug: string;
  eyebrow?: string;
  title: string;
  body?: string;
  /** a second, quieter way in (e.g. the product's collection) */
  more?: { href: string; label: string };
  /** a black card in the phone carousel */
  dark?: boolean;
};

const priceLabel = (p: Product) => (p.sizes.some((s) => s.priceDelta) ? `From ${formatPrice(p.price)}` : formatPrice(p.price));

/** Its picture shows a pale colour (white, cream…): the story goes on black, so the piece stands out. */
function pale(p: Product) {
  const f = p.finishes[0];
  return !p.cover && isLightFinish(photosFor(p, f).list[0] ? photoColour(p, f) : f);
}

function Picture({ p, sizes, className = "" }: { p: Product; sizes: string; className?: string }) {
  const f = p.finishes[0];
  if (p.cover)
    // the owner's own cover photo, as taken
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={p.cover} alt={p.name} loading="lazy" decoding="async" className={`h-full w-full rounded-[var(--radius-card)] object-cover ${className}`} />;
  const photo = photosFor(p, f).list[0];
  const src = photo ?? renderFor(p, f, "xl");
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      srcSet={photo ? undefined : renderSrcSet(p, f)}
      sizes={sizes}
      width={1200}
      height={1200}
      alt={`${p.name} in ${getFinish(f).name}`}
      loading="lazy"
      decoding="async"
      // older cleaned-up photos have the light stage baked in: their edges fade into whatever they sit on
      className={`h-full w-full ${photo ? "object-cover [mask-image:radial-gradient(closest-side,#000_80%,transparent)]" : "object-contain"} ${className}`}
    />
  );
}

function Actions({ p, more, center }: { p: Product; more?: Story["more"]; center?: boolean }) {
  return (
    <div className={`mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 ${center ? "justify-center" : ""}`}>
      <Link href={`/shop/${p.slug}/`} className="btn btn-primary">
        View product
      </Link>
      {more && (
        <Link href={more.href} className="link-more">
          {more.label}
        </Link>
      )}
    </div>
  );
}

/**
 * One product, told like a campaign: a short headline, a line or two, the price,
 * and a big picture. `stack` puts the words above a large centred picture (a
 * full-width moment); `split` sets them side by side. `dark` turns the section
 * into the black spotlight palette.
 */
export function Showcase({ story, layout = "stack", dark = false }: { story: Story; layout?: "stack" | "split"; dark?: boolean }) {
  const p = getProduct(story.slug);
  if (!p) return null;
  const tone = dark || pale(p) ? "theme-dark" : "bg-page-2";
  if (layout === "split")
    return (
      <section className={`${tone} overflow-hidden px-5 py-20 sm:px-6 sm:py-28`} aria-label={p.name}>
        <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-2 md:gap-12">
          <Reveal className="text-center md:text-left">
            {story.eyebrow && <p className="eyebrow">{story.eyebrow}</p>}
            <h2 className="headline-lg mt-2">{story.title}</h2>
            {story.body && <p className="lead mt-4 md:max-w-md">{story.body}</p>}
            <p className="mt-4 tabular-nums text-fg">{priceLabel(p)}</p>
            <Actions p={p} more={story.more} center={false} />
          </Reveal>
          <div className="mx-auto aspect-square w-full max-w-[520px]">
            <Picture p={p} sizes="(min-width: 768px) 520px, 90vw" />
          </div>
        </div>
      </section>
    );
  return (
    <section className={`${tone} overflow-hidden px-5 pt-20 text-center sm:px-6 sm:pt-28`} aria-label={p.name}>
      <Reveal className="mx-auto max-w-2xl">
        {story.eyebrow && <p className="eyebrow">{story.eyebrow}</p>}
        <h2 className="headline-lg mt-2">{story.title}</h2>
        {story.body && <p className="lead mx-auto mt-4 max-w-xl">{story.body}</p>}
        <p className="mt-4 tabular-nums">{priceLabel(p)}</p>
        <Actions p={p} more={story.more} center />
      </Reveal>
      <div className="mx-auto mt-4 aspect-square w-[min(90vw,640px)]">
        <Picture p={p} sizes="(min-width: 720px) 640px, 90vw" />
      </div>
    </section>
  );
}

const found = (stories: Story[]) => stories.map((s) => ({ s, p: getProduct(s.slug) })).filter((x): x is { s: Story; p: Product } => !!x.p);

/**
 * Phones: the stories as cards to swipe through, side by side, instead of one
 * full-screen section each. A card is one tap to its product.
 */
export function StoryCarousel({ stories, title }: { stories: Story[]; title: string }) {
  const items = found(stories);
  if (!items.length) return null;
  return (
    <section className="py-10 sm:py-20" aria-labelledby="stories-title">
      <h2 id="stories-title" className="headline-md px-5 sm:px-6">
        {title}
      </h2>
      <ul className="mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pb-2 [scrollbar-width:none] sm:scroll-px-6 sm:px-6 [&::-webkit-scrollbar]:hidden">
        {items.map(({ s, p }) => (
          <li key={p.slug} className="w-[78vw] max-w-[22rem] shrink-0 snap-start">
            <Link
              href={`/shop/${p.slug}/`}
              className={`${s.dark || pale(p) ? "theme-dark" : "bg-page-2"} flex h-full flex-col overflow-hidden rounded-[var(--radius-tile)] px-5 pt-8 text-center`}
            >
              {s.eyebrow && <span className="eyebrow">{s.eyebrow}</span>}
              <span className="mt-1 text-2xl font-semibold leading-tight tracking-tight">{s.title}</span>
              <span className="mt-1.5 tabular-nums text-sm text-muted">
                {s.title === p.name ? priceLabel(p) : `${p.name} · ${priceLabel(p)}`}
              </span>
              <span className="mx-auto mt-auto block aspect-square w-full pt-3">
                <Picture p={p} sizes="(min-width: 640px) 352px, 78vw" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Smaller product stories side by side: two or three across (stacked on narrow screens). */
export function ShowcaseTiles({ stories, className = "" }: { stories: Story[]; className?: string }) {
  const items = found(stories);
  if (!items.length) return null;
  return (
    <section className={`px-3 py-3 sm:px-4 sm:py-4 ${className}`} aria-label="More pieces">
      <div className={`mx-auto grid max-w-[90rem] gap-3 sm:gap-4 md:grid-cols-2 ${items.length >= 3 ? "lg:grid-cols-3" : ""}`}>
        {items.map(({ s, p }) => (
          <article key={p.slug} className={`${pale(p) ? "theme-dark" : "bg-page-2"} flex flex-col overflow-hidden rounded-[var(--radius-tile)] px-6 pt-12 text-center sm:pt-14`}>
            {s.eyebrow && <p className="eyebrow">{s.eyebrow}</p>}
            <h2 className="headline-md mt-1.5">{s.title}</h2>
            {s.body && <p className="mx-auto mt-3 max-w-sm text-muted">{s.body}</p>}
            <p className="mt-3 tabular-nums text-sm">{priceLabel(p)}</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
              <Link href={`/shop/${p.slug}/`} className="btn btn-primary">
                View product
              </Link>
              {s.more && (
                <Link href={s.more.href} className="link-more">
                  {s.more.label}
                </Link>
              )}
            </div>
            <div className="mx-auto mt-auto aspect-square w-full max-w-[420px] overflow-hidden rounded-t-[var(--radius-tile)] pt-8">
              <Picture p={p} sizes="(min-width: 1024px) 420px, (min-width: 768px) 45vw, 85vw" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
