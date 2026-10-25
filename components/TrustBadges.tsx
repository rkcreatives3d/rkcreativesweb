import Link from "next/link";
import { dispatchLabel } from "@/lib/site";

// Promises the shop actually keeps (they match lib/policies.ts). Shown next to
// the buy buttons and at checkout, where people hesitate.

const badges: { icon: React.ReactNode; title: string; text: string; href?: string }[] = [
  {
    icon: <path d="M12 3 4 6v6c0 4.4 3.4 8.3 8 9 4.6-.7 8-4.6 8-9V6l-8-3Zm-1.2 12.6-3.3-3.3 1.4-1.4 1.9 1.9 4.4-4.4 1.4 1.4-5.8 5.8Z" />,
    title: "Safe payment",
    text: "by UPI or bank transfer, straight to us",
  },
  {
    icon: <path d="M12 4a8 8 0 1 0 8 8h-2a6 6 0 1 1-1.8-4.3L14 10h6V4l-2.4 2.4A8 8 0 0 0 12 4Z" />,
    title: "Free reprint",
    text: "if it arrives damaged",
    href: "/policies/returns/",
  },
  {
    icon: <path d="M3 6h11v9H3V6Zm11 3h4l3 3v3h-7V9ZM6.5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm11 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />,
    title: `Ships in ${dispatchLabel} days`,
    text: "tracked courier, all India",
    href: "/policies/shipping/",
  },
  {
    icon: <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Zm-4 8h8v2H8v-2Zm0-3h8v2H8V8Z" />,
    title: "Real person",
    text: "answers on WhatsApp",
    href: "/contact/",
  },
];

export function TrustBadges({ className = "" }: { className?: string }) {
  return (
    <ul className={`divide-y divide-line border-y border-line ${className}`} aria-label="Our promises">
      {badges.map((b) => {
        const body = (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="shrink-0 text-subtle">
              {b.icon}
            </svg>
            <span className="min-w-0 flex-1 text-sm">
              <span className="font-medium text-fg">{b.title}</span> <span className="text-muted">{b.text}</span>
            </span>
          </>
        );
        return (
          <li key={b.title}>
            {b.href ? (
              <Link href={b.href} className="flex items-center gap-3 py-3 transition-colors hover:text-fg [&:hover_.font-medium]:underline">
                {body}
              </Link>
            ) : (
              <div className="flex items-center gap-3 py-3">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
