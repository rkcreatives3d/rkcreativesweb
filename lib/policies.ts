import { dispatchLabel, formatPrice, site } from "./site";

// Starter policies for a small made-to-order shop in India, filled in from
// lib/site.ts. Review and adjust them to match how you actually work; they are
// a sensible draft, not legal advice.

export type Policy = {
  slug: string;
  title: string;
  summary: string;
  sections: { heading: string; body: string[] }[];
};

export const POLICIES_UPDATED = "15 October 2026";

export const policies: Policy[] = [
  {
    slug: "shipping",
    title: "Shipping",
    summary: `Printed to order, dispatched in ${dispatchLabel} working days, delivered across India.`,
    sections: [
      {
        heading: "Printing and dispatch",
        body: [
          `Every item is printed after you order. Most orders are printed, finished and dispatched within ${dispatchLabel} working days of payment. Large, multi-part or custom pieces can take longer; we'll tell you the timeline before you pay.`,
        ],
      },
      {
        heading: "Delivery",
        body: [
          `We ship from ${site.city} across India with a tracked courier. Delivery usually takes ${site.transit[0]}–${site.transit[1]} days after dispatch, depending on your location.`,
          "Once your order ships, we send the tracking number on WhatsApp or email.",
        ],
      },
      {
        heading: "Shipping charges",
        body: [
          `Shipping is free on orders of ${formatPrice(site.freeShippingOver)} or more. Below that, a flat ${formatPrice(site.shippingFlat)} applies.`,
        ],
      },
      {
        heading: "Address problems",
        body: [
          "Please double-check your address and phone number. If a parcel comes back because of an incorrect address or failed delivery attempts, we can re-ship it once you've paid the courier charge again.",
        ],
      },
    ],
  },
  {
    slug: "returns",
    title: "Returns & refunds",
    summary: "Damaged in transit? We'll replace or refund it. Custom and personalised items can't be returned.",
    sections: [
      {
        heading: "Damaged or wrong items",
        body: [
          "If your order arrives damaged, or isn't what you ordered, message us within 48 hours of delivery with photos of the item and the packaging (an unboxing video helps a lot). We'll reprint and resend it free, or refund you, whichever you prefer.",
        ],
      },
      {
        heading: "Made-to-order and personalised items",
        body: [
          "Because every piece is printed for you, we can't accept returns for change of mind. Personalised items (names, messages) and custom designs can't be returned unless they arrive damaged or with a mistake on our side.",
          "3D prints show fine layer lines and small variations in colour and finish. These are part of the process and aren't defects.",
        ],
      },
      {
        heading: "Cancellations",
        body: [
          "You can cancel for a full refund until we start printing your order. Once printing has started, we can't cancel it.",
        ],
      },
      {
        heading: "How refunds are paid",
        body: [
          "Approved refunds are sent to the original payment method (UPI or bank transfer) within 5–7 working days.",
        ],
      },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy",
    summary: "We only use your details to make and deliver your order.",
    sections: [
      {
        heading: "What we collect",
        body: [
          "When you order or request a custom print, you send us your name, phone number, delivery address and, optionally, your email and any files or photos you share. Your cart is stored in your own browser until you send it.",
        ],
      },
      {
        heading: "How we use it",
        body: [
          "Only to confirm, make, deliver and support your order, and to reply to your messages. We share your name, phone and address with our courier so they can deliver. We never sell your details.",
        ],
      },
      {
        heading: "Analytics",
        body: [
          "We may use privacy-friendly analytics to count visits and see which pages are popular. This doesn't identify you personally.",
        ],
      },
      {
        heading: "Your choices",
        body: [`To see or delete the details we hold about you, message us or email ${site.email}.`],
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms",
    summary: "The short version of how ordering from us works.",
    sections: [
      {
        heading: "Orders and prices",
        body: [
          "Prices are in Indian rupees (INR). An order is confirmed once we've confirmed it with you on WhatsApp or email and received payment. If a price on the site is wrong, we'll tell you before you pay.",
        ],
      },
      {
        heading: "Made to order",
        body: [
          "Product photos and 3D previews are representative. Because each piece is printed individually, colours, layer lines and small details can vary slightly from what you see on screen.",
        ],
      },
      {
        heading: "Custom designs",
        body: [
          "When you send us a design, photo or file to print, you confirm you have the right to have it reproduced. We may decline requests that copy someone else's protected work, or that are unsafe or unlawful.",
        ],
      },
      {
        heading: "Contact",
        body: [`${site.name}, ${site.city}. WhatsApp +${site.whatsapp} · ${site.email}`],
      },
    ],
  },
];

export const getPolicy = (slug: string) => policies.find((p) => p.slug === slug);
