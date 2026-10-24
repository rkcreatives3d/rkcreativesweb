import type { Metadata } from "next";
import { CollectionTile } from "@/components/CollectionTile";
import { collections } from "@/lib/collections";

export const metadata: Metadata = {
  title: "Collections",
  description: "Shop RK Creative Builds by collection: décor, gifts, devotional pieces, keychains and desk pieces, all 3D printed to order.",
  alternates: { canonical: "/collections/" },
};

export default function CollectionsPage() {
  const list = collections();
  return (
    <div className="mx-auto max-w-6xl px-5 pb-28 pt-24 sm:px-6 sm:pt-32">
      <h1 className="headline-lg">Collections</h1>
      <p className="lead mt-3 max-w-xl">Find the right piece by where it goes or who it's for.</p>
      <ul className="mt-10 grid grid-cols-2 gap-x-3 gap-y-9 sm:mt-14 sm:gap-x-5 sm:gap-y-12 lg:grid-cols-3">
        {list.map((c, i) => (
          <li key={c.name}>
            <CollectionTile c={c} priority={i < 3} />
          </li>
        ))}
      </ul>
    </div>
  );
}
