import type { Metadata } from "next";
import { SavedList } from "@/components/SavedList";
import { SectionLabel } from "@/components/ui";

// Personal to each visitor (kept in their browser), so not for search engines.
export const metadata: Metadata = {
  title: "Saved",
  description: "The prints you saved with the heart, kept on this device so you can come back to them.",
  alternates: { canonical: "/saved/" },
  robots: { index: false, follow: true },
};

export default function SavedPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-24 sm:px-6 sm:pt-32">
      <SectionLabel>Kept on this device</SectionLabel>
      <h1 className="headline-lg mb-8 mt-2 sm:mb-10">
        Saved
      </h1>
      <SavedList />
    </div>
  );
}
