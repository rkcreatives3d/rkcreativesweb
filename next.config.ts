import type { NextConfig } from "next";

// Static export: the whole site builds to /out and can be hosted anywhere
// (Netlify, GitHub Pages, Cloudflare Pages, Render). Orders go out via
// WhatsApp / email, so no server is needed.
// On Vercel it builds normally instead, so the owner page's sign-in server can
// run there as a function (scripts/setup-host.mjs); every page is still
// prerendered and served as static files.
const nextConfig: NextConfig = {
  output: process.env.VERCEL ? undefined : "export",
  images: { unoptimized: true },
  trailingSlash: true,
  // Send the Vercel address to the real domain, so search engines index one
  // site. Only on Vercel: a static export can't redirect.
  ...(process.env.VERCEL && {
    redirects: async () => [
      {
        source: "/:path(.*)",
        has: [{ type: "host" as const, value: "rkcreativesweb.vercel.app" }],
        destination: "https://rkcreatives.app/:path",
        permanent: true,
      },
    ],
  }),
};

export default nextConfig;
