import type { Metadata, Viewport } from "next";
import { Manrope, Saira } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { Intro } from "@/components/intro/Intro";
import { WhatsAppBubble } from "@/components/WhatsAppBubble";
import { Analytics } from "@/components/Analytics";
import { site } from "@/lib/site";
import { routeGuardScript } from "@/lib/routeGuard";
import { bootScript } from "@/lib/lite";

// Two families: Saira's squared caps (close to the logo wordmark) for
// headings, Manrope for everything else.
const saira = Saira({ subsets: ["latin"], variable: "--font-saira", axes: ["wdth"] });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.slogan}`, template: `%s — ${site.name}` },
  description: site.description,
  keywords: ["3D printing", "3D printed gifts", "custom 3D print", "name keychain", "personalised gifts", "India", site.name],
  openGraph: {
    title: `${site.name} — ${site.slogan}`,
    description: site.description,
    type: "website",
    siteName: site.name,
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image" },
};

// Tells Google who runs the shop (name, logo, contact, social profile).
const storeJsonLd = {
  "@context": "https://schema.org",
  "@type": "Store",
  name: site.name,
  description: site.description,
  url: site.url,
  logo: `${site.url}/brand/logo.jpg`,
  image: `${site.url}/brand/logo.jpg`,
  email: site.email,
  telephone: `+${site.whatsapp}`,
  address: { "@type": "PostalAddress", addressLocality: site.city.split(",")[0], addressCountry: "IN" },
  sameAs: [site.instagram],
};

export const viewport: Viewport = { themeColor: "#000000" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={[saira, manrope].map((f) => f.variable).join(" ")} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: routeGuardScript }} />
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
        {/* without JS the intro could never finish, so don't show it */}
        <noscript>
          <style>{`#intro{display:none!important}`}</style>
        </noscript>
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Providers>
          <Nav />
          <main id="main" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <Footer />
          <CartDrawer />
          <WhatsAppBubble />
          <Intro />
        </Providers>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }} />
        <Analytics />
      </body>
    </html>
  );
}
