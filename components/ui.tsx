"use client";

import Link from "next/link";
import { motion, type Variants } from "motion/react";

const letter: Variants = {
  hidden: { y: "110%", rotate: 8 },
  show: (delay: number) => ({ y: "0%", rotate: 0, transition: { duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] } }),
};

/**
 * Letters rise out of a mask, staggered. Words never break mid-word.
 * The in-view trigger sits on the whole line: each hidden letter is clipped by
 * its word's mask, so an observer on a narrow letter ("i") would never fire.
 * `holo` paints the highlight gradient. background-clip:text ignores
 * transformed children, so each letter carries its own slice of one shared
 * gradient, offset so it reads as continuous across the word.
 */
export function KineticText({
  text,
  className = "",
  delay = 0,
  stagger = 0.03,
  holo = false,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  holo?: boolean;
}) {
  const words = text.split(" ");
  const total = text.replace(/ /g, "").length;
  let i = 0;
  return (
    <motion.span
      className={`${className} ${holo ? "holo-hue" : ""}`}
      aria-label={text}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-5% 0px" }}
    >
      {words.map((word, w) => (
        <span key={w} aria-hidden className="inline-block whitespace-nowrap overflow-hidden pb-[0.08em] -mb-[0.08em] align-bottom">
          {word.split("").map((ch) => {
            const idx = i++;
            const d = delay + idx * stagger;
            return (
              <motion.span
                key={idx}
                className={`inline-block will-change-transform ${holo ? "holo-letter" : ""}`}
                style={
                  holo
                    ? {
                        backgroundSize: `${total * 100}% 100%`,
                        backgroundPosition: `${total > 1 ? (idx / (total - 1)) * 100 : 0}% 0`,
                      }
                    : undefined
                }
                variants={letter}
                custom={d}
              >
                {ch}
              </motion.span>
            );
          })}
          {w < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </motion.span>
  );
}

export function Reveal({
  children,
  className = "",
  delay = 0,
  y = 40,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Pointer handlers that pull an element a little toward the cursor. */
const magnet = {
  onPointerMove(e: React.PointerEvent<HTMLElement>) {
    if (e.pointerType !== "mouse") return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${(e.clientX - r.left - r.width / 2) * 0.22}px`);
    el.style.setProperty("--my", `${(e.clientY - r.top - r.height / 2) * 0.35}px`);
  },
  onPointerLeave(e: React.PointerEvent<HTMLElement>) {
    e.currentTarget.style.setProperty("--mx", "0px");
    e.currentTarget.style.setProperty("--my", "0px");
  },
};

type HoloProps = {
  children: React.ReactNode;
  solid?: boolean;
  className?: string;
};

export function HoloLink({ href, children, solid, className = "", ...rest }: HoloProps & { href: string; target?: string; rel?: string }) {
  const external = /^(https?:|mailto:)/.test(href);
  const cls = `holo-btn ${solid ? "holo-btn-solid" : ""} ${className}`;
  return external ? (
    <a href={href} className={cls} {...magnet} {...rest}>
      {children}
    </a>
  ) : (
    <Link href={href} className={cls} {...magnet}>
      {children}
    </Link>
  );
}

export function HoloButton({
  children,
  solid,
  className = "",
  ...rest
}: HoloProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`holo-btn ${solid ? "holo-btn-solid" : ""} ${className}`} {...magnet} {...rest}>
      {children}
    </button>
  );
}

export function Marquee({ items, reverse = false, className = "" }: { items: string[]; reverse?: boolean; className?: string }) {
  const row = items.flatMap((t, i) => [
    <span key={`t${i}`}>{t}</span>,
    <span key={`s${i}`} aria-hidden className="mx-6 inline-block">
      ✦
    </span>,
  ]);
  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`} aria-label={items.join(", ")}>
      <div className={`marquee-track ${reverse ? "reverse" : ""}`} aria-hidden>
        <div className="flex shrink-0 items-center">{row}</div>
        <div className="flex shrink-0 items-center">{row}</div>
      </div>
    </div>
  );
}

export function Swatch({ css, size = 18, ring = false }: { css: string; size?: number; ring?: boolean }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full border border-fg/25 ${ring ? "ring-2 ring-fg ring-offset-2 ring-offset-page" : ""}`}
      style={{ background: css, width: size, height: size }}
    />
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-muted">
      <span className="text-accent">[</span> {children} <span className="text-accent-2">]</span>
    </p>
  );
}
