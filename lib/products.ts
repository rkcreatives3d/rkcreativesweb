// ─────────────────────────────────────────────────────────────
//  Product catalogue. Add / edit products here.
//  `shape` picks the procedural 3D placeholder model shown until you add
//  real photos. Add photos by putting files in public/products/ and listing
//  them in `images` — they then replace the 3D placeholder everywhere.
//  Colours: photos of the item in each colour go in `colorPhotos`. Colours
//  without their own photo get an automatic colour preview made from `images`.
// ─────────────────────────────────────────────────────────────

export type Shape =
  | "vase"
  | "knot"
  | "lattice"
  | "gear"
  | "planter"
  | "mobius"
  | "serpent"
  | "crystal"
  | "saturn"
  | "stand"
  | "keychain"
  | "nameplate";

export type Category = "Decor" | "Lighting" | "Desk" | "Toys" | "Personalised";

/** Quick-filter tags on the shop page. */
export type Tag = "bestseller" | "gift" | "festive" | "birthday" | "desk" | "car";

export type Finish = {
  id: string;
  name: string;
  /** CSS background for the swatch chip */
  swatch: string;
  color: string;
  metalness: number;
  roughness: number;
  iridescence: number;
  clearcoat: number;
  emissive: string;
  emissiveIntensity: number;
};

export type Size = {
  id: string;
  label: string;
  dims: string;
  priceDelta: number;
};

export type Product = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  category: Category;
  shape: Shape;
  finishes: string[];
  sizes: Size[];
  material: string;
  printTime: string;
  badge?: string;
  tags?: Tag[];
  /** e.g. ["/products/vortex-vase-1.jpg", "/products/vortex-vase-2.jpg"] — first one is the cover */
  images?: string[];
  /** which finish the `images` show (defaults to the first finish) */
  photoFinish?: string;
  /** real photos per colour, e.g. { gold: ["/products/vase-gold.jpg"], onyx: ["/products/vase-black.jpg"] } */
  colorPhotos?: Partial<Record<string, string[]>>;
  /** a photo of it in someone's hand or on a desk, shown in the size guide, e.g. "/products/vase-in-hand.jpg" */
  scalePhoto?: string;
  /** extra questions for this product, shown above the standard ones: [["Is it waterproof?", "Yes, …"]] */
  faq?: [string, string][];
  /**
   * Real 3D model. Usually leave this out: drop `<slug>.stl` / `.3mf` / `.obj`
   * into models/ and it's converted and picked up automatically (lib/models.ts).
   */
  model?: string;
  /**
   * "optional": customers can add a name / message for site.engravingPrice.
   * "included": the product IS the name (keychains, nameplates) — text required, no extra charge.
   */
  personalisation?: "optional" | "included";
};

// EDIT: the filaments you actually stock. Customers can only pick these.
// `color` is what the 3D preview renders and what photos are recoloured to,
// so match it to the real spool. Swatches are flat colours (silk ones get a
// soft sheen) so they read as plastic, not paint.
export const finishes: Finish[] = [
  {
    id: "amber",
    name: "Molten Amber",
    swatch: "linear-gradient(135deg, #ffb24d, #ff8a1a 60%)",
    color: "#ff8a1a",
    metalness: 0.35,
    roughness: 0.25,
    iridescence: 0,
    clearcoat: 1,
    emissive: "#000000",
    emissiveIntensity: 0,
  },
  {
    id: "gold",
    name: "Silk Gold",
    swatch: "linear-gradient(135deg, #f0c56a, #d4973f 60%)",
    color: "#e0a542",
    metalness: 0.9,
    roughness: 0.25,
    iridescence: 0,
    clearcoat: 0.6,
    emissive: "#000000",
    emissiveIntensity: 0,
  },
  {
    id: "copper",
    name: "Silk Copper",
    swatch: "linear-gradient(135deg, #d98a5c, #b0603a 60%)",
    color: "#b8673a",
    metalness: 0.9,
    roughness: 0.28,
    iridescence: 0,
    clearcoat: 0.5,
    emissive: "#000000",
    emissiveIntensity: 0,
  },
  {
    id: "silver",
    name: "Silk Silver",
    swatch: "linear-gradient(135deg, #e6e8eb, #b8bcc2 60%)",
    color: "#c9ccd1",
    metalness: 0.95,
    roughness: 0.2,
    iridescence: 0,
    clearcoat: 0.5,
    emissive: "#000000",
    emissiveIntensity: 0,
  },
  {
    id: "onyx",
    name: "Matte Black",
    swatch: "#1d1d1f",
    color: "#1d1d1f",
    metalness: 0,
    roughness: 0.62,
    iridescence: 0,
    clearcoat: 0.15,
    emissive: "#000000",
    emissiveIntensity: 0,
  },
  {
    id: "graphite",
    name: "Matte Grey",
    swatch: "#6e6f73",
    color: "#6e6f73",
    metalness: 0,
    roughness: 0.65,
    iridescence: 0,
    clearcoat: 0.1,
    emissive: "#000000",
    emissiveIntensity: 0,
  },
  {
    id: "frost",
    name: "Matte White",
    swatch: "#f1f1ee",
    color: "#f1f1ee",
    metalness: 0,
    roughness: 0.6,
    iridescence: 0,
    clearcoat: 0.1,
    emissive: "#000000",
    emissiveIntensity: 0,
  },
];

const finishMap = new Map(finishes.map((f) => [f.id, f]));
export const getFinish = (id: string) => finishMap.get(id) ?? finishes[0];

const sizes = (base: string[], deltas: [number, number, number]): Size[] => [
  { id: "S", label: "Small", dims: base[0], priceDelta: deltas[0] },
  { id: "M", label: "Medium", dims: base[1], priceDelta: deltas[1] },
  { id: "L", label: "Large", dims: base[2], priceDelta: deltas[2] },
];

export const products: Product[] = [
  {
    slug: "vortex-vase",
    name: "Vortex Vase",
    tagline: "A seven-point star, twisted through time.",
    description:
      "Printed in vase mode as a single continuous spiral, so there are zero seams — just one unbroken line of plastic. The twisted star profile throws light in every direction. Watertight for dried and faux flowers.",
    price: 899,
    category: "Decor",
    shape: "vase",
    finishes: ["amber", "gold", "frost", "onyx", "copper"],
    sizes: sizes(["12 cm tall", "18 cm tall", "25 cm tall"], [0, 400, 900]),
    material: "Silk PLA",
    printTime: "6–14 h",
    tags: ["bestseller", "gift", "festive", "birthday"],
    personalisation: "optional",
    badge: "Bestseller",
  },
  {
    slug: "infinity-knot",
    name: "Infinity Knot",
    tagline: "A trefoil loop with no beginning and no end.",
    description:
      "A mathematically perfect (2,3) torus knot. It looks impossible on a shelf and feels unreal in the hand. Sanded and clear-coated for a glass-smooth finish.",
    price: 649,
    category: "Decor",
    shape: "knot",
    finishes: ["gold", "silver", "copper", "onyx"],
    sizes: sizes(["8 cm", "12 cm", "18 cm"], [0, 250, 650]),
    material: "Silk PLA",
    printTime: "4–9 h",
    tags: ["gift", "birthday"],
  },
  {
    slug: "geodesic-orb-lamp",
    name: "Geodesic Orb Lamp",
    tagline: "A glowing lattice that casts star-shadows.",
    description:
      "An 80-face geodesic cage around a warm LED core. Switch it on and it throws a web of shadows across the whole room. USB-C powered, LED module included.",
    price: 1299,
    category: "Lighting",
    shape: "lattice",
    finishes: ["frost", "onyx", "gold"],
    sizes: sizes(["12 cm Ø", "16 cm Ø", "22 cm Ø"], [0, 500, 1200]),
    material: "PETG + LED",
    printTime: "10–20 h",
    tags: ["gift", "festive", "birthday"],
    badge: "New",
  },
  {
    slug: "gear-spinner",
    name: "Gear Spinner",
    tagline: "Fidget-grade spin, machine-shop looks.",
    description:
      "A twelve-tooth desk fidget with a press-fit steel bearing. Flick it and it spins for ages. Lightening holes keep it balanced.",
    price: 399,
    category: "Desk",
    shape: "gear",
    finishes: ["silver", "onyx", "amber", "graphite"],
    sizes: sizes(["5 cm", "7 cm", "9 cm"], [0, 100, 200]),
    material: "PLA + 608 bearing",
    printTime: "1–2 h",
    tags: ["bestseller"],
  },
  {
    slug: "hex-planter",
    name: "Twisted Hex Planter",
    tagline: "Faceted, tapered, and slightly unhinged.",
    description:
      "A hexagonal planter that twists as it rises. Includes a drainage hole and a matching drip tray. Fits succulents, cacti, and small herbs.",
    price: 549,
    category: "Decor",
    shape: "planter",
    finishes: ["graphite", "frost", "onyx", "amber"],
    sizes: sizes(["8 cm", "12 cm", "16 cm"], [0, 200, 450]),
    material: "PETG",
    printTime: "3–8 h",
    tags: ["gift"],
    personalisation: "optional",
  },
  {
    slug: "mobius-loop",
    name: "Möbius Loop",
    tagline: "One surface. One edge. Infinite vibes.",
    description:
      "Trace it with your finger and you visit both 'sides' without ever crossing an edge. A sculpture and a maths lesson in one.",
    price: 749,
    category: "Decor",
    shape: "mobius",
    finishes: ["copper", "gold", "silver", "onyx"],
    sizes: sizes(["10 cm", "15 cm", "20 cm"], [0, 300, 700]),
    material: "Silk PLA",
    printTime: "5–10 h",
    tags: [],
  },
  {
    slug: "flexi-serpent",
    name: "Flexi Serpent",
    tagline: "Articulated. Wiggly. Printed in one piece.",
    description:
      "Comes off the printer fully jointed. No assembly, no glue. Every segment moves, so it wriggles in your hand like it's alive.",
    price: 999,
    category: "Toys",
    shape: "serpent",
    finishes: ["onyx", "amber", "silver", "graphite"],
    sizes: sizes(["30 cm long", "45 cm long", "60 cm long"], [0, 350, 700]),
    material: "PLA",
    printTime: "5–12 h",
    tags: ["bestseller", "gift", "birthday"],
    badge: "Articulated",
  },
  {
    slug: "crystal-cluster",
    name: "Crystal Cluster",
    tagline: "Geode energy without the mining.",
    description:
      "A cluster of hexagonal crystal points on a rough base. Looks wild in Holo Chrome under RGB light. Makes a good bookend or paperweight.",
    price: 699,
    category: "Decor",
    shape: "crystal",
    finishes: ["frost", "silver", "gold", "copper"],
    sizes: sizes(["8 cm", "12 cm", "16 cm"], [0, 250, 550]),
    material: "Silk PLA",
    printTime: "4–9 h",
    tags: ["gift", "birthday"],
  },
  {
    slug: "saturn-lamp",
    name: "Saturn Night Lamp",
    tagline: "A ringed planet for your bedside.",
    description:
      "A diffused planet globe wrapped in a floating ring. Warm white LED with a touch dimmer. Sits on a hidden base so the ring looks like it's hovering.",
    price: 1499,
    category: "Lighting",
    shape: "saturn",
    finishes: ["gold", "frost", "amber"],
    sizes: sizes(["12 cm", "16 cm", "20 cm"], [0, 450, 950]),
    material: "PLA + LED",
    printTime: "8–16 h",
    tags: ["gift", "festive", "birthday"],
    personalisation: "optional",
  },
  {
    slug: "wedge-phone-stand",
    name: "Wedge Phone Stand",
    tagline: "Cantilevered. Minimal. Holds up to tablets.",
    description:
      "A single-piece cantilever stand angled at 65° for video calls and recipes. The cable slot fits any charger. Rubber feet included.",
    price: 449,
    category: "Desk",
    shape: "stand",
    finishes: ["onyx", "graphite", "frost", "silver"],
    sizes: sizes(["Phone", "Phablet", "Tablet"], [0, 100, 250]),
    material: "PETG",
    printTime: "2–4 h",
    tags: ["bestseller"],
    personalisation: "optional",
  },
  {
    slug: "name-keychain",
    name: "Name Keychain",
    tagline: "Your name, raised in gold, on your keys.",
    description:
      "Any name or short word (up to 14 letters) printed as raised 3D letters on a sturdy backing plate, with a metal key ring. A tiny gift that always lands. Try your name live in 3D on the Personalise page.",
    price: 249,
    category: "Personalised",
    shape: "keychain",
    finishes: ["gold", "silver", "amber", "onyx", "frost"],
    sizes: sizes(["6 cm wide", "8 cm wide", "10 cm wide"], [0, 50, 100]),
    material: "PLA, two colours",
    printTime: "1–2 h",
    badge: "Personalised",
    tags: ["bestseller", "gift", "festive", "birthday", "car"],
    personalisation: "included",
  },
  {
    slug: "desk-nameplate",
    name: "Desk Nameplate",
    tagline: "Claim your desk in brushed gold letters.",
    description:
      "A weighted, angled nameplate with your name in bold raised letters. Great for offices, study tables and gifting to new joiners. Up to 14 letters. Try it live in 3D on the Personalise page.",
    price: 499,
    category: "Personalised",
    shape: "nameplate",
    finishes: ["gold", "silver", "copper", "frost"],
    sizes: sizes(["15 cm", "20 cm", "25 cm"], [0, 150, 300]),
    material: "PLA, two colours",
    printTime: "3–5 h",
    tags: ["gift", "festive", "birthday", "desk"],
    personalisation: "included",
  },
];

export const categories: Category[] = ["Decor", "Lighting", "Desk", "Toys", "Personalised"];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);

/**
 * Photos to show for a product in a finish. `recolor` is true when they're the
 * generic photos and should be colour-previewed into that finish.
 */
export function photosFor(p: Product, finish: string): { list: string[]; recolor: boolean } {
  const own = p.colorPhotos?.[finish];
  if (own?.length) return { list: own, recolor: false };
  const list = p.images ?? [];
  return { list, recolor: list.length > 0 && finish !== (p.photoFinish ?? p.finishes[0]) };
}

export const unitPrice = (p: Product, sizeId: string) =>
  p.price + (p.sizes.find((s) => s.id === sizeId)?.priceDelta ?? 0);
