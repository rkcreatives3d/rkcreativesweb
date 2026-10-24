import Link from "next/link";
import { getFinish, getProduct, photosFor, type Product } from "@/lib/products";
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
};

const priceLabel = (p: Product) => (p.sizes.some((s) => s.priceDelta) ? `From ${formatPrice(p.price)}` : formatPrice(p.price));

function Picture({ p, sizes, className = "" }: { p: Product; sizes: string; className?: string }) {
  const f = p.finishes[0];
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
      // a cleaned-up photo has the stage baked in: its edges fade into whatever it sits on
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
  const tone = dark ? "theme-dark" : "bg-page-2";
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

/** Two smaller product stories side by side (stacked on phones). */
export function ShowcasePair({ stories }: { stories: Story[] }) {
  const items = stories.map((s) => ({ s, p: getProduct(s.slug) })).filter((x): x is { s: Story; p: Product } => !!x.p);
  if (!items.length) return null;
  return (
    <section className="px-3 py-3 sm:px-4 sm:py-4" aria-label="More pieces">
      <div className="mx-auto grid max-w-[90rem] gap-3 sm:gap-4 md:grid-cols-2">
        {items.map(({ s, p }) => (
          <article key={p.slug} className="flex flex-col overflow-hidden rounded-[var(--radius-tile)] bg-page-2 px-6 pt-12 text-center sm:pt-14">
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
            <div className="mx-auto mt-8 aspect-square w-full max-w-[420px] overflow-hidden rounded-t-[var(--radius-tile)]">
              <Picture p={p} sizes="(min-width: 768px) 420px, 85vw" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
