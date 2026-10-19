"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { about } from "@/lib/content";
import { Reveal, SectionLabel } from "./ui";

/** "Meet the maker": the printer video next to the first lines of the story. Hidden until about.video is set. */
export function StudioClip({ link = true }: { link?: boolean }) {
  const video = about.video;
  const ref = useRef<HTMLVideoElement>(null);
  const [calm, setCalm] = useState(false);

  // only plays while on screen, and never by itself for people who prefer reduced motion
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setCalm(reduce);
    if (reduce) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.4 });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  if (!video) return null;
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[1.2fr_1fr]">
      <Reveal>
        <video
          ref={ref}
          src={video.src}
          poster={video.poster}
          muted
          loop
          playsInline
          preload="none"
          controls={calm}
          aria-label="Our printer at work"
          className="aspect-video w-full rounded-[32px] border border-fg/10 bg-fg/5 object-cover"
        />
      </Reveal>
      <div>
        <SectionLabel>Meet the maker</SectionLabel>
        <Reveal y={24}>
          <h2 className="mt-4 font-display text-4xl font-extrabold display-case leading-[0.9] tracking-tight sm:text-6xl">
            Printed <span className="text-pop">right here</span>
          </h2>
        </Reveal>
        <p className="mt-5 max-w-md leading-relaxed text-fg/80">{about.story[0]}</p>
        {link && (
          <Link href="/about/" className="mt-6 inline-block font-semibold underline underline-offset-4 hover:text-accent">
            Our story →
          </Link>
        )}
      </div>
    </section>
  );
}
