import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getFinish, getProduct, isLightFinish, photoColour, products } from "@/lib/products";
import { formatPrice, site } from "@/lib/site";
import { renderFor } from "@/lib/renders";

// Share card for each product (WhatsApp, Instagram, Google): photo or finish
// orb, logo, name, price. Built at export time as /og/<slug>.png — a real .png
// file, so every host serves it with the right type. The picture sits on the
// site's studio backdrop: light, or dark for pale colours (globals.css .stage).

/**
 * A picture from public/ as a data URL the share-image renderer can draw: it
 * reads PNG and JPEG only, so WebP ones (studio pictures, cut-out photos) are
 * turned into PNG with sharp (installed with Next.js). null if that's missing.
 */
async function picture(file: string) {
  const bytes = await readFile(join(process.cwd(), "public", file));
  if (!file.endsWith(".webp")) return `data:image/${file.endsWith(".png") ? "png" : "jpeg"};base64,${bytes.toString("base64")}`;
  try {
    const sharp = (await import("sharp")).default;
    return `data:image/png;base64,${(await sharp(bytes).png().toBuffer()).toString("base64")}`;
  } catch (e) {
    console.warn(`share card: couldn't convert ${file}`, e);
    return null;
  }
}
export const dynamic = "force-static";
const size = { width: 1200, height: 630 };

export function generateStaticParams() {
  return products.map((p) => ({ file: `${p.slug}.png` }));
}

export async function GET(_: Request, { params }: { params: Promise<{ file: string }> }) {
  const p = getProduct((await params).file.replace(/\.png$/, ""));
  if (!p) return new Response("Not found", { status: 404 });
  const logo = `data:image/png;base64,${(await readFile(join(process.cwd(), "public/brand/mark-128.png"))).toString("base64")}`;
  // its own cover photo (as taken), else its photo, else its studio picture (transparent), else a colour orb
  const own = p.coverSmall ?? p.cover;
  const photo = p.images?.[0];
  const coverFile = (own ?? photo ?? renderFor(p, p.finishes[0]))?.split("?")[0];
  const cover = coverFile ? await picture(coverFile) : null;
  const f = getFinish(p.finishes[0]);
  const dark = !own && isLightFinish(photo ? photoColour(p, p.finishes[0]) : p.finishes[0]);
  const inter = await readFile(join(process.cwd(), "lib/fonts/Inter-SemiBold.ttf"));
  // Geist (bundled with next/og) for anything the Inter file lacks
  const geist = await readFile(join(process.cwd(), "node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf"));
  const from = p.sizes.some((s) => s.priceDelta) ? "From " : "";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#ffffff", color: "#1d1d1f", fontFamily: "Inter, Geist" }}>
        <div
          style={{
            width: 630,
            height: 630,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundImage: dark
              ? "radial-gradient(ellipse 70% 60% at 50% 42%, #4d4d52, #3a3a3e 58%, #2c2c2f 100%)"
              : "radial-gradient(ellipse 70% 60% at 50% 42%, #fcfcfd, #f5f5f7 58%, #ececef 100%)",
          }}
        >
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
