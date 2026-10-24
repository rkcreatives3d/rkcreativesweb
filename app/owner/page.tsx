import type { Metadata } from "next";
import { OwnerApp } from "@/components/owner/OwnerApp";

// The owner's shop manager. Not linked anywhere and kept out of search engines;
// opened from the home page's logo (tap it 5 times). Signing in with the
// owner's GitHub key is what actually protects it.
export const metadata: Metadata = {
  title: "Shop manager",
  robots: { index: false, follow: false },
};

export default function OwnerPage() {
  return <OwnerApp />;
}
