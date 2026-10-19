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
 * `holo` colours the words brand gold. `shine` uses the brushed-gold
 * gradient instead: save it for one or two big moments. background-clip:text
 * ignores transformed children, so each letter carries its own slice of one
 * shared gradient, offset so it reads as continuous across the word.
 */
export function KineticText({
  text,
  className = "",
  delay = 0,
  stagger = 0.03,
  holo = false,
  shine = false,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  holo?: boolean;
  shine?: boolean;
}) {
  const gold = holo && !shine;
  holo = shine;
  const words = text.split(" ");
  const total = text.replace(/ /g, "").length;
  let i = 0;
  return (
    <motion.span
      className={`${className} ${holo ? "holo-hue" : ""} ${gold ? "text-pop" : ""}`}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-5% 0px" }}
    >
      {/* screen readers get the plain words; the animated letters are hidden from them */}
      <span className="sr-only">{text}</span>
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
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  /** "li" when it's an item in a list, so the list stays valid */
  as?: "div" | "li";
}) {
  const Tag = as === "li" ? motion.li : motion.div;
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Tag>
  );
}

type ButtonProps = {
  children: React.ReactNode;
  /** the one solid amber action on a screen; everything else stays quiet */
  primary?: boolean;
  className?: string;
};

export function ButtonLink({
  href,
  children,
  primary,
  className = "",
  ...rest
}: ButtonProps & { href: string; target?: string; rel?: string; onClick?: () => void }) {
  const external = /^(https?:|mailto:)/.test(href);
  const cls = `btn ${primary ? "btn-primary" : ""} ${className}`;
  return external ? (
    <a href={href} className={cls} {...rest}>
      {children}
    </a>
  ) : (
    <Link href={href} className={cls} onClick={rest.onClick}>
      {children}
    </Link>
  );
}

export function Button({
  children,
  primary,
  className = "",
  ...rest
}: ButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`btn ${primary ? "btn-primary" : ""} ${className}`} {...rest}>
      {children}
    </button>
  );
}

/** Section heading: fades up as one piece (letter-by-letter animation is kept for page titles). */
export function Heading({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <Reveal y={24}>
      <h2 className={`font-display font-extrabold display-case leading-[0.92] tracking-tight ${className}`}>{children}</h2>
    </Reveal>
  );
}

export function Marquee({ items, reverse = false, className = "" }: { items: string[]; reverse?: boolean; className?: string }) {
  const row = items.flatMap((t, i) => [
    <span key={`t${i}`}>{t}</span>,
    <span key={`s${i}`} aria-hidden className="mx-6 inline-block opacity-60">
      •
    </span>,
  ]);
  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`}>
      <p className="sr-only">{items.join(", ")}</p>
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
    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-pop" />
      {children}
    </p>
  );
}
