import type { Metadata } from "next";
import { ShopGrid } from "@/components/ShopGrid";

export const metadata: Metadata = {
  title: "Shop",
  description: "Every 3D print we make: decor, lamps, desk gear, toys and personalised gifts. Printed to order, shipped across India.",
  alternates: { canonical: "/shop/" },
};

export default function ShopPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-28 pt-24 sm:px-6 sm:pt-32">
      <h1 className="headline-lg">Shop</h1>
      <p className="lead mt-3 max-w-xl">Décor, lamps, desk pieces and gifts. Every piece is printed to order and shipped across India.</p>
      <div className="mt-8 sm:mt-10">
        <ShopGrid />
      </div>
    </div>
  );
}
