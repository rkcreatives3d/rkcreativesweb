import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getFinish, getProduct, products } from "@/lib/products";
import { formatPrice, site } from "@/lib/site";

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
  const logo = `data:image/jpeg;base64,${(await readFile(join(process.cwd(), "public/brand/logo-160.jpg"))).toString("base64")}`;
  const cover = p.images?.[0]
    ? `data:image/jpeg;base64,${(await readFile(join(process.cwd(), "public", p.images[0]))).toString("base64")}`
    : null;
  const f = getFinish(p.finishes[0]);
  const saira = await readFile(join(process.cwd(), "lib/fonts/SairaSemiCondensed-ExtraBold.ttf"));
  // Saira has no ₹ glyph; Geist (bundled with next/og) does
  const geist = await readFile(join(process.cwd(), "node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf"));

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#000", color: "#f4efe6", fontFamily: "sans-serif" }}>
        <div style={{ width: 630, height: 630, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} width={630} height={630} style={{ objectFit: "cover" }} alt="" />
          ) : (
            <div
              style={{
                width: 360,
                height: 360,
                borderRadius: 999,
                background: f.color,
                boxShadow: `0 0 160px 40px ${f.color}55`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 140,
                fontFamily: "Saira",
                color: "rgba(0,0,0,0.55)",
              }}
            >
              {p.name
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("")}
            </div>
          )}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 60px 0 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} width={64} height={64} style={{ borderRadius: 999 }} alt="" />
            <span style={{ fontSize: 24, letterSpacing: 4, color: "#d4973f", textTransform: "uppercase" }}>{site.name}</span>
          </div>
          <div style={{ fontSize: 84, fontFamily: "Saira", lineHeight: 1, marginTop: 36, textTransform: "uppercase" }}>{p.name}</div>
          <div style={{ fontSize: 28, color: "#a39a8c", marginTop: 18 }}>{p.tagline}</div>
          <div style={{ display: "flex", marginTop: 40 }}>
            <div style={{ fontSize: 40, fontFamily: "Geist", padding: "12px 28px", borderRadius: 999, background: "linear-gradient(90deg,#d4973f,#f5d287,#ff9a1a)", color: "#000" }}>
              {`from ${formatPrice(p.price)}`}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Saira", data: saira, weight: 800, style: "normal" },
        { name: "Geist", data: geist, weight: 400, style: "normal" },
      ],
    },
  );
}
