import type { Metadata, Viewport } from "next";
import { Manrope, Saira_Semi_Condensed } from "next/font/google";
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
import { launchProblems } from "@/lib/launch";

// Two families: Saira's squared caps (close to the logo wordmark) for
// headings, Manrope for everything else. Headings only ever use Saira Semi
// Condensed ExtraBold, so just that one ~20 KB file is loaded.
const saira = Saira_Semi_Condensed({ subsets: ["latin"], weight: "800", variable: "--font-saira" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

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

export const viewport: Viewport = { themeColor: "#efe6d8", viewportFit: "cover" };

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
