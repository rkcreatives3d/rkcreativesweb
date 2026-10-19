// ─────────────────────────────────────────────────────────────
//  EDIT ME — words and photos for the About page and the trust
//  sections. Put photo files in public/photos/ and list them here.
//  Any list left empty simply hides its section — nothing fake is
//  shown in the meantime.
// ─────────────────────────────────────────────────────────────

export type Photo = { src: string; caption?: string };

export type Review = {
  name: string;
  /** e.g. "Bengaluru" */
  city?: string;
  /** 1–5 */
  rating: number;
  text: string;
  /** product slug it was about, optional */
  product?: string;
};

export const about = {
  /** EDIT: your own story, in your words. One string per paragraph. */
  story: [
    "RK Creative Builds is a small 3D printing studio that turns ideas into objects you can hold. Every piece is printed to order on our own machines, then cleaned up, checked and packed by hand.",
    "We print decor, lamps, desk gear, gifts and one-off custom builds. If you can describe it, sketch it or send a file, we can usually make it.",
    "Have something in mind? Message us on WhatsApp and we'll help you bring it to life.",
  ],
  /** EDIT: e.g. { src: "/photos/me-and-my-printer.jpg", caption: "The workshop" } */
  photos: [] as Photo[],
  /**
   * EDIT: a ~15 second clip of your printer at work, shown on the home and About pages.
   * Silent MP4, 720p, under 3 MB, e.g. { src: "/video/printing.mp4", poster: "/video/printing.jpg" }
   */
  video: null as { src: string; poster: string } | null,
};

/** EDIT: real customer reviews only (with their permission). */
export const reviews: Review[] = [];

/** EDIT: photos customers have sent you of their prints. */
export const customerPhotos: Photo[] = [];

/** EDIT: photos of how you pack orders. */
export const packingPhotos: Photo[] = [];

/** EDIT: custom jobs you've printed before, shown on the Custom page. */
export const customJobs: Photo[] = [];

/**
 * EDIT: custom jobs as before / after pairs: the photo or sketch the customer
 * sent, and the finished print. Shown as a drag-to-compare slider on the Custom page.
 * e.g. { title: "Pet portrait", before: { src: "/photos/dog-photo.jpg" }, after: { src: "/photos/dog-print.jpg" } }
 * Use photos with the same shape (both square works best).
 */
export const beforeAfter: { title: string; before: Photo; after: Photo }[] = [];

/**
 * EDIT: your latest Instagram posts: a square thumbnail saved in public/photos/
 * and the post's link. Shown as a grid on the home and About pages.
 * e.g. { src: "/photos/ig-1.jpg", href: "https://instagram.com/p/XXXX", caption: "Ganesha in silk gold" }
 */
export const instagramPosts: (Photo & { href: string })[] = [];

/** EDIT: rough custom-order pricing used by the estimator on the Custom page. */
export const estimator = {
  /** fixed cost per job: setup, slicing, finishing */
  base: 149,
  /** price ≈ base + perSize × (size in cm)^2.2 × material × detail */
  perSize: 2.85,
  materials: { PLA: 1, "Silk PLA": 1.2, PETG: 1.25, "TPU (flexible)": 1.5, "Glow in the dark": 1.35 } as Record<string, number>,
  detail: { "Simple shape": 1, "Detailed figure / model": 1.35, "Painted or multi-colour": 1.8 } as Record<string, number>,
  /** bulk discounts: [minimum quantity, discount] */
  bulk: [
    [10, 0.15],
    [5, 0.1],
  ] as [number, number][],
  /** shown as a ± range around the estimate */
  spread: 0.2,
};

export function estimate(sizeCm: number, material: string, detail: string, qty: number) {
  const e = estimator;
  const each = e.base + e.perSize * Math.pow(sizeCm, 2.2) * (e.materials[material] ?? 1) * (e.detail[detail] ?? 1);
  const discount = e.bulk.find(([min]) => qty >= min)?.[1] ?? 0;
  const total = each * qty * (1 - discount);
  const round = (n: number) => Math.round(n / 10) * 10;
  return { low: round(total * (1 - e.spread)), high: round(total * (1 + e.spread)), discount };
}
