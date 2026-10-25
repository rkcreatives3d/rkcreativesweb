import Link from "next/link";
import type { Collection } from "@/lib/collections";

const img = "absolute h-auto object-contain";

/**
 * A collection: a small group shot of up to three of its pieces (one in front,
 * two behind) or a single picture, then its name and how many pieces it has.
 */
export function CollectionTile({ c, priority = false }: { c: Collection; priority?: boolean }) {
  const load = priority ? "eager" : "lazy";
  return (
    <Link href={c.href} className="group block rounded-[var(--radius-card)]">
      <span className="stage zoom-on-hover relative block aspect-square overflow-hidden rounded-[var(--radius-card)]">
        {c.group.length >= 3 ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.group[1]} alt="" width={720} height={720} loading={load} decoding="async" className={`${img} -left-[10%] -top-[2%] w-[54%]`} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.group[2]} alt="" width={720} height={720} loading={load} decoding="async" className={`${img} -right-[10%] -top-[2%] w-[54%]`} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.group[0]} alt="" width={720} height={720} loading={load} decoding="async" className={`${img} -bottom-[8%] left-1/2 w-[72%] -translate-x-1/2`} />
          </>
        ) : c.group.length === 2 ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.group[1]} alt="" width={720} height={720} loading={load} decoding="async" className={`${img} -right-[6%] top-[4%] w-[70%]`} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.group[0]} alt="" width={720} height={720} loading={load} decoding="async" className={`${img} -left-[6%] bottom-[-4%] w-[74%]`} />
          </>
        ) : (
          c.cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.cover} alt="" width={720} height={720} loading={load} decoding="async" className="h-full w-full object-cover" />
          )
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
