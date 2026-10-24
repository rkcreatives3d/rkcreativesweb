import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/ProductDetail";
import { getProduct, products } from "@/lib/products";
import { site } from "@/lib/site";
import { faqFor } from "@/lib/faq";
import { reviewsFor } from "@/lib/content";
import { renderFor } from "@/lib/renders";

export const dynamicParams = false;

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getProduct((await params).slug);
  return p
    ? {
        title: p.name,
        description: `${p.tagline} ${p.description}`,
        alternates: { canonical: `/shop/${p.slug}/` },
        openGraph: {
          title: `${p.name} — ${site.name}`,
          description: p.tagline,
          type: "website",
          url: `/shop/${p.slug}/`,
          images: [{ url: `/og/${p.slug}.png`, width: 1200, height: 630, alt: p.name }],
        },
        twitter: { card: "summary_large_image", images: [`/og/${p.slug}.png`] },
      }
    : {};
}

export default async function ProductPage({ params }: Props) {
  const p = getProduct((await params).slug);
  if (!p) notFound();
  // product details Google can show in search results (price, availability, brand)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    sku: p.slug,
    category: p.category,
    material: p.material,
    image: p.images?.length
      ? p.images.map((src) => `${site.url}${src}`)
      : p.finishes.map((f) => renderFor(p, f)).filter(Boolean).map((src) => `${site.url}${src}`).concat(`${site.url}/brand/logo.jpg`).slice(0, 4),
    brand: { "@type": "Brand", name: site.name },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: p.price,
      highPrice: p.price + Math.max(...p.sizes.map((s) => s.priceDelta)),
      offerCount: p.sizes.length,
      availability: "https://schema.org/InStock",
      url: `${site.url}/shop/${p.slug}/`,
    },
    // real customer reviews only (approved in the shop manager)
    ...(reviewsFor(p.slug).length
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: (reviewsFor(p.slug).reduce((n, r) => n + r.rating, 0) / reviewsFor(p.slug).length).toFixed(1),
            reviewCount: reviewsFor(p.slug).length,
          },
          review: reviewsFor(p.slug)
            .slice(0, 5)
            .map((r) => ({
              "@type": "Review",
              reviewRating: { "@type": "Rating", ratingValue: r.rating },
              author: { "@type": "Person", name: r.name },
              reviewBody: r.text,
              ...(r.date ? { datePublished: r.date } : {}),
            })),
        }
      : {}),
  };
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Shop", item: `${site.url}/shop/` },
      { "@type": "ListItem", position: 2, name: p.name, item: `${site.url}/shop/${p.slug}/` },
    ],
  };
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqFor(p).map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, breadcrumbs, faq]) }} />
      <ProductDetail key={p.slug} product={p} />
    </>
  );
}
