// ─────────────────────────────────────────────────────────────
//  EDIT ME — your shop's identity, contact and payment details.
//  Orders are sent to the WhatsApp number / email below.
// ─────────────────────────────────────────────────────────────
export const site = {
  name: "RK Creative Builds",
  /** Instagram handle; the only place the underscore spelling is used */
  handle: "rk_creative_builds_3d",
  /** prefix for order numbers, e.g. RK-4F2K9A */
  orderPrefix: "RK",
  tagline: "Custom prints · Unique gifts · Endless ideas",
  slogan: "Bring Ideas to Life",
  description:
    "Custom 3D prints, personalised gifts and one-off builds by RK Creative Builds. Printed to order, finished by hand.",

  /** EDIT: your live web address (used for share previews, Google and the sitemap) */
  url: "https://rkcreativebuilds.in",
  /** EDIT: the city you ship from (shown on About and in the policies) */
  city: "Hyderabad, India",
  /** EDIT: the PIN code you ship from (delivery estimates are worked out from it, see lib/delivery.ts) */
  originPin: "500001",

  // WhatsApp number in international format, digits only (no +, spaces or dashes).
  // Example for India: 91 + 10-digit number → "919876543210"
  whatsapp: "919999999999",
  email: "orders@example.com",
  instagram: "https://instagram.com/rk_creative_builds_3d",

  /** EDIT: UPI details shown as a QR code after someone places an order */
  upi: { id: "yourname@okaxis", payee: "RK Creative Builds" },

  currency: "INR",
  locale: "en-IN",
  shippingFlat: 99,
  freeShippingOver: 1499,
  /** working days to print + pack, then days in transit with the courier (when the PIN isn't known yet) */
  dispatch: [3, 5] as [number, number],
  transit: [2, 6] as [number, number],
  /** add-on price for engraving a name / message on products that offer it */
  engravingPrice: 99,

  /** Optional analytics. Leave empty to load nothing. */
  analytics: {
    plausibleDomain: "", // e.g. "rkcreativebuilds.in"
    ga4Id: "", // e.g. "G-XXXXXXX"
  },
};

export const dispatchLabel = `${site.dispatch[0]}–${site.dispatch[1]}`;

const priceFormat = new Intl.NumberFormat(site.locale, {
  style: "currency",
  currency: site.currency,
  maximumFractionDigits: 0,
});

export const formatPrice = (n: number) => priceFormat.format(n);

export const shippingFor = (subtotal: number) =>
  subtotal === 0 || subtotal >= site.freeShippingOver ? 0 : site.shippingFlat;

export const whatsappUrl = (text: string) =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;

export const mailtoUrl = (subject: string, body: string) =>
  `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

/** UPI deep link: opens GPay / PhonePe / Paytm with the amount filled in. */
export const upiUrl = (amount: number, note: string) =>
  `upi://pay?pa=${encodeURIComponent(site.upi.id)}&pn=${encodeURIComponent(site.upi.payee)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;
