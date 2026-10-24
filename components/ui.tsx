"use client";

import Link from "next/link";
import { motion } from "motion/react";

/**
 * A title (or part of one) that fades up once as it comes into view: one calm
 * movement, not letter by letter. `holo` / `shine` are kept for old call sites
 * and now just mean "in the accent colour"; page titles are single-colour, and
 * only the home page headline uses the accent.
 */
export function KineticText({
  text,
  className = "",
  delay = 0,
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
  return (
    <motion.span
      data-reveal
      className={`inline-block ${holo || shine ? "text-accent" : ""} ${className}`}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-5% 0px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {text}
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
      data-reveal
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
      <h2 className={`section-title ${className}`}>{children}</h2>
    </Reveal>
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
