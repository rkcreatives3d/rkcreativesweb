"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { photosFor } from "@/lib/products";
import { lastOrderDay, promoHref, promoLive, promoProducts } from "@/lib/promo";
import { renderFor, renderSrcSet } from "@/lib/renders";
import { site, whatsappUrl } from "@/lib/site";

/**
 * Shows its children while the festival banner is live. The page is built
 * ahead of time, so the build decides at first and the visitor's own date
 * decides once the page is running (a banner never outstays its last day).
 */
export function PromoGate({ children }: { children: React.ReactNode }) {
  const [live, setLive] = useState(true);
  useEffect(() => setLive(promoLive()), []);
  return live ? children : null;
}

const dayFormat = new Intl.DateTimeFormat(site.locale, { weekday: "short", day: "numeric", month: "short" });
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/**
 * The festival banner (content/shop.json "promo", set on the owner page): a
 * dark tile with a warm glow, its headline, the last day to order so it
 * arrives in time (worked out from the shop's making and courier days), and
 * three of its pieces. Phones stack it; computers set it side by side.
 */
export function Promo() {
  const p = site.promo;
  const name = p.eyebrow || "the festival";
  // undefined until the page is running in the browser: the deadline depends on today's date
  const [last, setLast] = useState<Date | null | undefined>(undefined);
  const [live, setLive] = useState(true);
  useEffect(() => {
    setLive(promoLive());
    setLast(lastOrderDay());
  }, []);
  if (!live) return null;

  // standing studio pictures group well; photos have their own backgrounds
  const pics = promoProducts()
    .filter((x) => !photosFor(x, x.finishes[0]).list.length && renderFor(x, x.finishes[0]))
    .slice(0, 3);
  const rush = p.deliverBy && last === null;
  const deadline =
    last === undefined || !p.deliverBy
      ? null
      : last
        ? `${sameDay(last, new Date()) ? "Order today" : `Order by ${dayFormat.format(last)}`} for delivery in time for ${name}.`
        : `Cutting it close? Message us and we'll tell you honestly if it can reach you in time.`;

  return (
    <section aria-labelledby="promo-title" className="px-3 sm:px-4">
      <div className="theme-dark promo-glow mx-auto grid max-w-[90rem] items-center overflow-hidden rounded-[var(--radius-tile)] px-6 pt-12 sm:px-10 lg:grid-cols-[1fr_1.1fr] lg:gap-10 lg:px-16 lg:pt-0">
        <div className="text-center lg:py-16 lg:text-left">
          {p.eyebrow && <p className="eyebrow">{p.eyebrow}</p>}
          <h2 id="promo-title" className="headline-lg mt-2">
            {p.title}
          </h2>
          {p.text && <p className="lead mx-auto mt-3 max-w-md lg:mx-0">{p.text}</p>}
          {/* room kept for the deadline line, so nothing jumps when it appears */}
          {p.deliverBy && <p className="mx-auto mt-4 min-h-[3em] max-w-md text-sm text-fg sm:min-h-[1.5em] lg:mx-0">{deadline}</p>}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 lg:justify-start">
            <Link href={promoHref} className="btn btn-primary">
              Shop {p.eyebrow || "festive"} gifts
            </Link>
            {rush && (
              <a
                href={whatsappUrl(`Hi ${site.name}! Can an order still reach me in time for ${name}? My PIN code is `)}
                target="_blank"
                rel="noreferrer"
                className="link-more"
              >
                Ask on WhatsApp
              </a>
            )}
          </div>
        </div>
        {pics.length > 0 && (
          <div aria-hidden className="relative mx-auto mt-4 h-[min(64vw,320px)] w-full max-w-[540px] lg:mt-0 lg:h-[400px]">
            {pics.map((x, i) => {
              const f = x.finishes[0];
              // the middle piece stands in front, a little bigger
              const place = pics.length === 1 || i === 1 ? "left-1/2 z-10 w-[56%] -translate-x-1/2" : i === 0 ? "left-0 w-[44%]" : "right-0 w-[44%]";
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={x.slug}
                  src={renderFor(x, f)}
                  srcSet={renderSrcSet(x, f)}
                  sizes="(min-width: 1024px) 300px, 56vw"
                  width={720}
                  height={720}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className={`absolute bottom-0 aspect-square object-contain ${place}`}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
