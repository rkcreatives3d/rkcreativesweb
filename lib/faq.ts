import { dispatchLabel } from "./site";
import type { Product } from "./products";

// Standard questions on every product page (and in its Google FAQ data).
// `link` turns the matching words in the answer into a link.

export type FaqItem = { q: string; a: string; link?: { text: string; href: string } };

export const generalFaq: FaqItem[] = [
  {
    q: "Is it made after I order?",
    a: `Yes. Every piece is printed to order on our own machines, then cleaned up and checked by hand. Allow ${dispatchLabel} working days before it ships.`,
  },
  {
    q: "Will the colour look like the photos?",
    a: "Very close. Screens show colours a little differently, and up close you'll see fine layer lines. That's how 3D prints look. Ask on WhatsApp and we'll send a real photo of the colour.",
  },
  {
    q: "Can I get a different size or colour?",
    a: "Usually, yes. Message us with what you need, or use the custom order form, and we'll quote it.",
    link: { text: "custom order form", href: "/custom/" },
  },
  {
    q: "What if it arrives damaged?",
    a: "Message us within 48 hours with photos and we'll reprint it or refund you. See the returns policy.",
    link: { text: "returns policy", href: "/policies/returns/" },
  },
];

export const faqFor = (p: Product): FaqItem[] => [...(p.faq ?? []).map(([q, a]) => ({ q, a })), ...generalFaq];
