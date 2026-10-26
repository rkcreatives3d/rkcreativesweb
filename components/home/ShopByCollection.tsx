import { collections } from "@/lib/collections";
import { CollectionTile } from "../CollectionTile";
import { MoreLink } from "../ui";

/** Four ways into the shop (the owner's collections that have pieces in them), and a link to the rest. */
export function ShopByCollection() {
  const list = collections();
  if (!list.length) return null;
  return (
    <section className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-28" aria-labelledby="collections">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <h2 id="collections" className="headline-md">
          Shop by collection.
        </h2>
        {list.length > 4 && <MoreLink href="/collections/">All collections</MoreLink>}
      </div>
      <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:mt-10 sm:gap-x-5 lg:grid-cols-4">
        {list.slice(0, 4).map((c) => (
          <li key={c.name}>
            <CollectionTile c={c} />
          </li>
        ))}
      </ul>
    </section>
  );
}
