"use client";

import { useShelf } from "@/lib/shelf";
import { useToast } from "@/lib/toast";
import { track } from "@/lib/track";
import { HeartIcon } from "./Icons";

/** The heart: saves a product to this browser's "Saved" list (no account needed). */
export function SaveButton({ slug, name, className = "" }: { slug: string; name: string; className?: string }) {
  const saved = useShelf((s) => s.saved.includes(slug));
  const toggle = useShelf((s) => s.toggleSaved);
  const show = useToast((s) => s.show);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from saved` : `Save ${name}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(slug);
        if (!saved) {
          track("save", { product: slug });
          show({ title: "Saved", detail: `${name} · find it under Menu → Saved` });
        }
      }}
      className={`grid h-9 w-9 place-items-center rounded-full bg-page/85 transition-transform active:scale-90 ${saved ? "text-danger" : "text-fg hover:text-danger"} ${className}`}
    >
      <HeartIcon filled={saved} />
    </button>
  );
}
