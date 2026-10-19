import type { NextConfig } from "next";

// Static export: the whole site builds to /out and can be hosted anywhere
// (Vercel, Netlify, GitHub Pages, Cloudflare Pages). Orders go out via
// WhatsApp / email, so no server is needed.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
