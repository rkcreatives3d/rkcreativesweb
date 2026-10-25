import { ProductCard } from "@/components/ProductCard";
import { ButtonLink } from "@/components/ui";
import { popular } from "@/lib/popular";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-28 pt-28 sm:px-6 sm:pt-36">
      <div className="text-center">
        <p className="text-sm font-semibold text-accent">Error 404 · print failed</p>
        <h1 className="headline-lg mt-2">This page didn&apos;t print.</h1>
        <p className="lead mx-auto mt-3 max-w-md">It may have moved, or the link has a typo. Search for what you were after:</p>
        {/* a plain form, so it works before the page's JavaScript has loaded: /shop/?q=… */}
        <form action="/shop/" role="search" className="mx-auto mt-7 flex max-w-md gap-2">
          <input
            name="q"
            type="search"
            required
            placeholder="Search products"
            aria-label="Search products"
            className="h-11 min-w-0 flex-1 rounded-xl border border-subtle bg-page px-4 text-fg outline-none placeholder:text-subtle focus:border-fg focus:ring-1 focus:ring-fg"
          />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>
        <div className="mt-5">
          <ButtonLink href="/">Back to the home page</ButtonLink>
        </div>
      </div>
      <section aria-labelledby="popular-title" className="mt-20">
        <h2 id="popular-title" className="section-title text-2xl sm:text-[1.75rem]">
          Popular right now
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 lg:grid-cols-4">
          {popular(4).map((p, i) => (
            <ProductCard key={p.slug} product={p} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
