"use client";

import { useRouter } from "next/navigation";
import { site } from "@/lib/site";
import { ownerTap } from "@/lib/ownerTap";
import { MoreLink, Reveal } from "../ui";

/** Who's behind the pieces, with the logo in its own world (black). 5 taps on the logo open the owner page. */
export function BrandStory() {
  const router = useRouter();
  return (
    <section className="theme-dark overflow-hidden px-5 py-14 sm:px-6 sm:py-28" aria-labelledby="brand-title">
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2 md:gap-16">
        <div
          data-owner-tap
          onClick={(e) => ownerTap(e.timeStamp) && router.push("/owner/")}
          className="mx-auto aspect-square w-[min(74vw,460px)] touch-manipulation select-none md:w-full md:max-w-[460px]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            id="brand-logo"
            src="/brand/logo-cut-720.webp"
            srcSet="/brand/logo-cut-480.webp 480w, /brand/logo-cut-720.webp 720w, /brand/logo-cut-1080.webp 1080w"
            sizes="(min-width: 768px) 460px, 74vw"
            width={720}
            height={720}
            alt={`${site.name} logo`}
            loading="lazy"
            decoding="async"
            className="logo-cut h-full w-full"
          />
        </div>
        <Reveal className="text-center md:text-left">
          <p className="eyebrow">{site.name}</p>
          <h2 id="brand-title" className="headline-lg mt-2">
            Bring ideas to life.
          </h2>
          <p className="lead mt-4 md:max-w-md">
            We&apos;re a small 3D printing studio. We design and print décor, gifts, keepsakes and one-off builds, each one made to order and finished by hand.
          </p>
          <MoreLink href="/about/" className="mt-6">
            Our story
          </MoreLink>
        </Reveal>
      </div>
    </section>
  );
}
