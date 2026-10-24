"use client";

import { useId } from "react";

// Form pieces for the owner page: labelled, big enough to tap, consistent.

const input =
  "w-full rounded-xl border border-fg/15 bg-raised px-3.5 py-2.5 text-fg outline-none transition-colors placeholder:text-fg/40 focus:border-accent-2 focus:ring-2 focus:ring-accent-2/20";

export function Text({
  label,
  value,
  onChange,
  hint,
  multiline,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  multiline?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      {multiline ? (
        <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} rows={4} className={input} placeholder={rest.placeholder} />
      ) : (
        <input id={id} value={value} onChange={(e) => onChange(e.target.value)} className={input} {...rest} />
      )}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Num({
  label,
  value,
  onChange,
  hint,
  prefix,
  min = 0,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
  prefix?: string;
  min?: number;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <div className="relative">
        {prefix && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">{prefix}</span>}
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => onChange(e.target.value === "" ? 0 : Math.max(min, Math.round(Number(e.target.value))))}
          className={`${input} tabular-nums ${prefix ? "pl-8" : ""}`}
        />
      </div>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Choice<T extends string>({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: readonly (readonly [T, string])[];
  hint?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)} className={input}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Switch({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-line bg-raised p-3.5">
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-muted">{hint}</span>}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-6 w-6 shrink-0 accent-[var(--color-accent)]" />
    </label>
  );
}

export function Card({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-pop">{title}</h3>
        {actions}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export const smallBtn = "rounded-full border border-fg/15 px-3.5 py-2 text-sm font-semibold transition-colors hover:border-fg/40 disabled:opacity-40";
export const dangerBtn = "rounded-full border border-danger/40 px-3.5 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger/5";
