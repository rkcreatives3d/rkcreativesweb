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
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-24 sm:px-8 sm:pt-36">
      <SectionLabel>Kept on this device</SectionLabel>
      <h1 className="mb-8 mt-3 font-display text-5xl font-extrabold display-case leading-[0.9] tracking-tight sm:mb-10 sm:mt-4 sm:text-7xl">
        Saved
      </h1>
      <SavedList />
    </div>
  );
}
