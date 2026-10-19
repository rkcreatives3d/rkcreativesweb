import type { Metadata } from "next";
import { OrderConfirmation } from "@/components/OrderConfirmation";

export const metadata: Metadata = { title: "Your order", robots: { index: false, follow: false } };

export default function OrderPage() {
  return (
    <div className="px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
      <OrderConfirmation />
    </div>
  );
}
