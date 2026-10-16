import Script from "next/script";
import { site } from "@/lib/site";

/** Loads Plausible and/or Google Analytics only if their IDs are set in lib/site.ts. */
export function Analytics() {
  const { plausibleDomain, ga4Id } = site.analytics;
  return (
    <>
      {plausibleDomain && <Script defer data-domain={plausibleDomain} src="https://plausible.io/js/script.js" strategy="afterInteractive" />}
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
