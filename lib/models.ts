import generated from "./models.generated.json";
import type { Product } from "./products";

// Real 3D models converted from models/ by `npm run models` (scripts/prepare-models.mjs).
const converted = generated as Record<string, string>;

/** URL of a product's real 3D model, if there is one. */
export const modelFor = (p: Product): string | undefined => p.model ?? converted[p.slug];
