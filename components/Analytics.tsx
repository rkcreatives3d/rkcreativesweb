import Script from "next/script";
import { site } from "@/lib/site";
import { TrackClicks } from "./TrackClicks";

/**
 * Loads Plausible and/or Google Analytics only if their IDs are set in
 * lib/site.ts. Shop events (add to cart, orders, WhatsApp clicks…) are sent
 * by lib/track.ts; in Plausible, add them under Site settings → Goals.
 */
export function Analytics() {
  const { plausibleDomain, ga4Id } = site.analytics;
  if (!plausibleDomain && !ga4Id) return null;
  return (
    <>
      <TrackClicks />
      {plausibleDomain && (
        <>
          {/* queues events fired before the script has loaded */}
          <Script id="plausible-queue" strategy="afterInteractive">
            {`window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)}`}
          </Script>
          <Script defer data-domain={plausibleDomain} src="https://plausible.io/js/script.js" strategy="afterInteractive" />
        </>
      )}
      {ga4Id && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga4Id}');`}
          </Script>
        </>
      )}
    </>
  );
}
