import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { TabBar } from "@/components/TabBar";
import { Intro } from "@/components/intro/Intro";
import { Analytics } from "@/components/Analytics";
import { site } from "@/lib/site";
import { routeGuardScript } from "@/lib/routeGuard";
import { bootScript } from "@/lib/lite";
import { launchProblems } from "@/lib/launch";

// One family for everything: Inter (variable, so one file covers every weight),
// with the system's own UI font as the fallback while it loads.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

// Until the real WhatsApp number, email and UPI ID are in lib/site.ts, ask
// search engines not to index anything, so sample details never reach Google.
// (scripts/launch-check.mjs prints what's left on every build.)
const problems = launchProblems();

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  robots: problems.length ? { index: false, follow: true } : { index: true, follow: true },
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
  address: {
    "@type": "PostalAddress",
    addressLocality: site.city.split(",")[0],
    postalCode: site.originPin,
    addressCountry: "IN",
    ...(site.business.address ? { streetAddress: site.business.address } : {}),
  },
  ...(site.business.gstin ? { taxID: site.business.gstin } : {}),
  ...(site.business.legalName ? { legalName: site.business.legalName } : {}),
  priceRange: "₹₹",
  currenciesAccepted: "INR",
  paymentAccepted: ["UPI", "Bank transfer", ...(site.payments.cardPayUrl ? ["Credit card", "Debit card"] : []), ...(site.payments.cod.enabled ? ["Cash"] : [])].join(", "),
  sameAs: [site.instagram],
};

export const viewport: Viewport = { themeColor: "#ffffff", viewportFit: "cover", colorScheme: "light" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
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
          <TabBar />
          <CartDrawer />
          <Intro />
        </Providers>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }} />
        <Analytics />
      </body>
    </html>
  );
}
