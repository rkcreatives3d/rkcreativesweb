import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getFinish, getProduct, products } from "@/lib/products";
import { formatPrice, site } from "@/lib/site";
import { renderCoverFor } from "@/lib/renders";

// Share card for each product (WhatsApp, Instagram, Google): photo or finish
// orb, logo, name, price. Built at export time as /og/<slug>.png — a real .png
// file, so every host serves it with the right type.
export const dynamic = "force-static";
const size = { width: 1200, height: 630 };

export function generateStaticParams() {
  return products.map((p) => ({ file: `${p.slug}.png` }));
}

export async function GET(_: Request, { params }: { params: Promise<{ file: string }> }) {
  const p = getProduct((await params).file.replace(/\.png$/, ""));
  if (!p) return new Response("Not found", { status: 404 });
  const logo = `data:image/png;base64,${(await readFile(join(process.cwd(), "public/brand/mark-128.png"))).toString("base64")}`;
  // its photo, else its studio render (npm run renders), else a colour orb
  const coverFile = p.images?.[0] ?? renderCoverFor(p);
  const cover = coverFile ? `data:image/jpeg;base64,${(await readFile(join(process.cwd(), "public", coverFile))).toString("base64")}` : null;
  const f = getFinish(p.finishes[0]);
  const inter = await readFile(join(process.cwd(), "lib/fonts/Inter-SemiBold.ttf"));
  // Geist (bundled with next/og) for anything the Inter file lacks
  const geist = await readFile(join(process.cwd(), "node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf"));
  const from = p.sizes.some((s) => s.priceDelta) ? "From " : "";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#ffffff", color: "#1d1d1f", fontFamily: "Inter, Geist" }}>
        <div style={{ width: 630, height: 630, display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f7" }}>
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} width={630} height={630} style={{ objectFit: "cover" }} alt="" />
          ) : (
            <div style={{ width: 340, height: 340, borderRadius: 999, background: f.color, display: "flex" }} />
          )}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 64px 0 56px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} width={44} height={44} style={{ borderRadius: 999 }} alt="" />
            <span style={{ fontSize: 24, color: "#6e6e73" }}>{site.name}</span>
          </div>
          <div style={{ fontSize: 76, lineHeight: 1.04, letterSpacing: -2.5, marginTop: 34 }}>{p.name}</div>
          {p.tagline && <div style={{ fontSize: 28, lineHeight: 1.3, color: "#6e6e73", marginTop: 18 }}>{p.tagline}</div>}
          <div style={{ fontSize: 34, marginTop: 34 }}>{`${from}${formatPrice(p.price)}`}</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: inter, weight: 600, style: "normal" },
        { name: "Geist", data: geist, weight: 400, style: "normal" },
      ],
    },
  );
}
