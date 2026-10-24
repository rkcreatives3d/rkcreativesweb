import Link from "next/link";
import type { Collection } from "@/lib/collections";

/** A collection: a picture of one of its pieces, its name and how many pieces it has. */
export function CollectionTile({ c, priority = false }: { c: Collection; priority?: boolean }) {
  return (
    <Link href={c.href} className="group block rounded-[var(--radius-tile)]">
      <span className="stage zoom-on-hover relative block aspect-square overflow-hidden rounded-[var(--radius-tile)]">
        {c.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.cover} alt="" width={720} height={720} loading={priority ? "eager" : "lazy"} decoding="async" className="h-full w-full object-cover" />
        )}
      </span>
      <span className="mt-3 block px-0.5">
        <span className="block text-[1.0625rem] font-semibold tracking-tight">{c.name}</span>
        <span className="mt-0.5 block text-sm text-muted">
          {c.items.length} {c.items.length === 1 ? "product" : "products"}
        </span>
      </span>
    </Link>
  );
}
