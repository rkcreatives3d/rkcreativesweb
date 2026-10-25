import { products } from "./products";

/** A few pieces to suggest when there's nothing else to show: bestsellers and new ones first. */
export const popular = (n = 4) => [...products.filter((p) => p.badge), ...products.filter((p) => !p.badge)].slice(0, n);
