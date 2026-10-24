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
      initial={{ opacity: 0, y: 10 }}
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
  y = 24,
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
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
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
      className={`inline-block shrink-0 rounded-full border border-black/15 ${ring ? "ring-2 ring-fg ring-offset-2 ring-offset-page" : ""}`}
      style={{ background: css, width: size, height: size }}
    />
  );
}

/** The small line above a page or section title, in the accent colour (sentence case, no shouting). */
export function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`eyebrow ${className}`}>{children}</p>;
}

/** A quiet text link with a chevron, the second action beside a button. */
export function MoreLink({ href, children, className = "", ...rest }: { href: string; children: React.ReactNode; className?: string; target?: string; rel?: string }) {
  return /^(https?:|mailto:)/.test(href) ? (
    <a href={href} className={`link-more ${className}`} {...rest}>
      {children}
    </a>
  ) : (
    <Link href={href} className={`link-more ${className}`}>
      {children}
    </Link>
  );
}
