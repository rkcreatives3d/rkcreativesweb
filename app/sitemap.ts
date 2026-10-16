import type { MetadataRoute } from "next";
import { products } from "@/lib/products";
import { policies } from "@/lib/policies";
import { guides } from "@/lib/guides";
import { site } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const page = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({
    url: `${site.url}${path}`,
    changeFrequency: "weekly",
    priority,
  });
  return [
    page("/", 1),
    page("/shop/", 0.9),
    ...products.map((p) => page(`/shop/${p.slug}/`, 0.8)),
    page("/personalise/", 0.8),
    page("/custom/", 0.8),
    page("/about/", 0.6),
    page("/guides/", 0.5),
    ...guides.map((g) => page(`/guides/${g.slug}/`, 0.5)),
    ...policies.map((p) => page(`/policies/${p.slug}/`, 0.3)),
  ];
}
