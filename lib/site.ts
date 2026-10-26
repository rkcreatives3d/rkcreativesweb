// ─────────────────────────────────────────────────────────────
//  Your shop's identity, contact and payment details.
//  Orders are sent to the WhatsApp number / email set in content/shop.json,
//  which the owner page (/owner/ → Shop settings) edits; you can also edit
//  that file by hand. What each setting means:
//    url               your live web address (share previews, Google, sitemap)
//    city, originPin   where you ship from (About page, policies, delivery dates)
//    whatsapp          international format, digits only: 91 + 10-digit number
//    upi               shown as a QR code after someone places an order
//    payments          cardPayUrl: a Razorpay Payment Page/Link ("" hides it);
//                      cod: cash on delivery, with an optional fee and order limit
//    business          footer / Contact / invoices; empty fields are hidden
//    tracking          your courier's tracking page; {awb} is the tracking number
//    reviewUrl         where happy customers can leave a review
//    dispatch, transit working days to print + pack, then days with the courier
//    engravingPrice    add-on price for a name / message on products that offer it
//    analytics         optional Plausible domain / GA4 id; empty loads nothing
//    home              the home page cover: heroProduct (a product's slug),
//                      heroImage (an optional photo of it, uploaded on the
//                      owner page) and heroImageCut (that photo was cut out
//                      onto a transparent background)
//    promo             a festival banner on the home page (Shop settings →
//                      Festival banner): whether it's on, its words, which
//                      pieces it links to (an occasion id, lib/occasions.ts),
//                      the date orders should arrive by (it works out the last
//                      day to order) and the day it ends (dates as YYYY-MM-DD)
// ─────────────────────────────────────────────────────────────
import shop from "@/content/shop.json";

const { categories: _categories, ...settings } = shop;

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
  currency: "INR",
  locale: "en-IN",
  ...settings,
  dispatch: settings.dispatch as [number, number],
  transit: settings.transit as [number, number],
  // (defaults, so a shop.json without "home" still builds)
  home: {
    heroProduct: "vortex-vase",
    heroImage: "",
    heroImageCut: false,
    ...((settings as unknown as { home?: Partial<{ heroProduct: string; heroImage: string; heroImageCut: boolean }> }).home ?? {}),
  },
  // (defaults, so a shop.json without "promo" still builds)
  promo: {
    on: false,
    eyebrow: "",
    title: "",
    text: "",
    occasion: "festive",
    deliverBy: "",
    ends: "",
    ...((settings as unknown as { promo?: Partial<Promo> }).promo ?? {}),
  },
};

type Promo = { on: boolean; eyebrow: string; title: string; text: string; occasion: string; deliverBy: string; ends: string };

/** A real order email is set (not empty, not the sample orders@example.com). */
export const emailReady = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(site.email) && !site.email.endsWith("@example.com");
/** A real UPI ID is set (not empty, not the sample yourname@…). */
export const upiReady = /^[^\s@]+@[^\s@]+$/.test(site.upi.id) && !site.upi.id.startsWith("yourname");

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
