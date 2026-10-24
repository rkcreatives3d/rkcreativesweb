// Where the owner page saves changes: this site's GitHub repository. Each
// "Publish" is one commit to `branch`; the host (Render) rebuilds the site
// from it automatically, so changes go live a few minutes later.
export const REPO = { owner: "rkcreatives3d", name: "rkcreativesweb", branch: "main" } as const;

/** Files the owner page reads and writes. */
export const PATHS = {
  products: "content/products.json",
  finishes: "content/finishes.json",
  shop: "content/shop.json",
  renders: "lib/renders.generated.json",
} as const;
