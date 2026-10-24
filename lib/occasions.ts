import type { Product } from "./products";

// Ways to shop shown as tiles on the home page and as filters on the shop
// page (linkable: /shop/?for=birthday). Driven by product tags/category/price.

export type Occasion = { id: string; label: string; blurb: string; test: (p: Product) => boolean };

export const occasions: Occasion[] = [
  { id: "bestseller", label: "Bestsellers", blurb: "What everyone's ordering", test: (p) => !!p.tags?.includes("bestseller") },
  { id: "birthday", label: "Birthday gifts", blurb: "Names, keepsakes, wow-gifts", test: (p) => !!p.tags?.includes("birthday") },
  { id: "festive", label: "Diwali & festive", blurb: "Lamps, decor and gifting", test: (p) => !!p.tags?.includes("festive") },
  { id: "desk", label: "For the desk", blurb: "Stands, nameplates, fidgets", test: (p) => p.category === "Desk & office" || !!p.tags?.includes("desk") },
  { id: "car", label: "Car & keys", blurb: "Keychains and car bits", test: (p) => !!p.tags?.includes("car") },
  { id: "under499", label: "Under ₹499", blurb: "Small price, big smile", test: (p) => p.price <= 499 },
];

export const getOccasion = (id: string | null) => occasions.find((o) => o.id === id);
