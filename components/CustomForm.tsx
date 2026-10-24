"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { estimate, estimator } from "@/lib/content";
import { formatPrice, mailtoUrl, site, whatsappUrl } from "@/lib/site";
import { track } from "@/lib/track";
import { MailIcon } from "./Icons";
import { Field, Fieldset, WhatsAppIcon } from "./CheckoutForm";
import { ButtonLink } from "./ui";

const materials = Object.keys(estimator.materials);
const details = Object.keys(estimator.detail);

type Req = {
  name: string;
  phone: string;
  idea: string;
  size: number;
  material: string;
  detail: string;
  qty: number;
  colour: string;
  deadline: string;
  link: string;
};

export function CustomForm() {
  const [r, setR] = useState<Req>({
    name: "",
    phone: "",
    idea: "",
    size: 12,
    material: materials[0],
    detail: details[0],
    qty: 1,
    colour: "",
    deadline: "",
    link: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [sent, setSent] = useState<{ url: string; attachHint: boolean } | null>(null);
  const set = (k: keyof Req) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setR((v) => ({ ...v, [k]: e.target.value }));
  const est = estimate(r.size, r.material, r.detail, r.qty);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const via = ((e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)?.value;
    const msg = [
      "CUSTOM PRINT REQUEST",
      "",
      `Idea: ${r.idea}`,
      `Size: about ${r.size} cm`,
      `Material: ${r.material}`,
      `Detail: ${r.detail}`,
      `Quantity: ${r.qty}`,
      r.colour ? `Colour: ${r.colour}` : null,
      `Website estimate: ${formatPrice(est.low)} – ${formatPrice(est.high)}`,
      r.deadline ? `Needed by: ${r.deadline}` : null,
      r.link ? `Reference: ${r.link}` : null,
      files.length ? `Files: ${files.map((f) => f.name).join(", ")}` : null,
      "",
      `Name: ${r.name}`,
      `Phone: ${r.phone}`,
    ]
      .filter((l) => l !== null)
      .join("\n");
    track("custom_request", { via, files: files.length });

    if (via === "email") {
      const url = mailtoUrl(`Custom print request — ${r.name}`, msg);
      window.location.href = url;
      setSent({ url, attachHint: files.length > 0 });
      return;
    }
    // On phones, share the files and the message together (pick WhatsApp in the share sheet).
    if (files.length && navigator.canShare?.({ files })) {
      try {
        await navigator.share({ files, text: msg });
        setSent({ url: whatsappUrl(msg), attachHint: false });
        return;
      } catch {
        // cancelled or failed: fall back to a plain WhatsApp message
      }
    }
    const url = whatsappUrl(msg);
    window.open(url, "_blank", "noopener");
    setSent({ url, attachHint: files.length > 0 });
  };

  if (sent) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="cta-card rounded-[var(--radius-tile)] p-8 sm:p-10">
        <p className="text-sm font-semibold text-accent">Request drafted ✦</p>
        <h2 className="mt-3 section-title text-3xl">Send it over</h2>
        <p className="mt-3 text-muted">
          Hit send in the window that just opened. We usually reply with an exact quote within a day.
          {sent.attachHint && " Your files couldn't be attached automatically, so please attach them in the chat."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href={sent.url} target="_blank" rel="noreferrer">
            Didn&apos;t open? Try again
          </ButtonLink>
          <button className="btn" onClick={() => setSent(null)}>
            Edit request
          </button>
        </div>
      </motion.div>
    );
  }

  const selectCls =
    "mt-1.5 w-full appearance-none rounded-xl border border-line bg-page px-4 py-3 text-fg outline-none focus:border-fg/60 focus:ring-4 focus:ring-fg/[0.06]";

  return (
    <form onSubmit={submit} className="space-y-5">
      <Fieldset title="01 · The idea">
        <Field
          label="What should we print?"
          required
          textarea
          placeholder="e.g. a 10 cm dragon holding my D20, in silk gold"
          value={r.idea}
          onChange={set("idea")}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Colour(s)" placeholder="Gold, matte black, rainbow…" value={r.colour} onChange={set("colour")} />
          <Field label="Needed by" type="date" value={r.deadline} onChange={set("deadline")} />
        </div>
        <Field label="Reference link (Thingiverse, Printables, Pinterest…)" type="url" value={r.link} onChange={set("link")} />
        <label className="block text-sm">
          <span className="text-muted">Files: STL, 3MF, OBJ, photos or sketches (optional)</span>
          <input
            type="file"
            multiple
            accept=".stl,.3mf,.obj,image/*,application/pdf"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            className="mt-1.5 block w-full cursor-pointer rounded-xl border border-dashed border-fg/25 bg-page/60 px-4 py-4 text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-fg file:px-4 file:py-2 file:text-sm file:font-semibold file:text-page hover:border-accent"
          />
          {files.length > 0 && (
            <span className="mt-1.5 block text-xs text-muted">
              {files.length} file{files.length > 1 ? "s" : ""} ready. On phones, photos go straight into WhatsApp. Attach STL
              files in the chat.
            </span>
          )}
        </label>
      </Fieldset>

      <Fieldset title="02 · Size & instant estimate">
        <label className="block text-sm">
          <span className="flex justify-between text-muted">
            Approximate size (longest side)
            <span className="tabular-nums text-fg">{r.size} cm</span>
          </span>
          <input
            type="range"
            min={3}
            max={40}
            value={r.size}
            onChange={(e) => setR((v) => ({ ...v, size: Number(e.target.value) }))}
            className="mt-3 h-6 w-full accent-[var(--color-accent)]"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <Select label="Material" value={r.material} onChange={set("material")} options={materials} cls={selectCls} />
          <Select label="Detail" value={r.detail} onChange={set("detail")} options={details} cls={selectCls} />
          <Field
            label="Quantity"
            type="number"
            min={1}
            max={500}
            value={r.qty}
            onChange={(e) => setR((v) => ({ ...v, qty: Math.max(1, Number(e.target.value) || 1) }))}
          />
        </div>
        <div className="rounded-xl bg-page-2 p-5">
          <p className="text-sm font-semibold text-accent">Estimated price</p>
          <AnimatePresence mode="popLayout">
            <motion.p
              key={`${est.low}-${est.high}`}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              className="mt-1 text-2xl font-semibold tracking-tight tabular-nums"
            >
              {formatPrice(est.low)} – {formatPrice(est.high)}
            </motion.p>
          </AnimatePresence>
          <p className="mt-1 text-xs text-muted">
            {r.qty > 1 && `For ${r.qty} pieces${est.discount ? `, including ${est.discount * 100}% bulk discount` : ""}. `}
            A rough guide. We confirm the exact price before printing.
          </p>
        </div>
      </Fieldset>

      <Fieldset title="03 · You">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required value={r.name} onChange={set("name")} autoComplete="name" />
          <Field label="Phone (WhatsApp)" required type="tel" value={r.phone} onChange={set("phone")} autoComplete="tel" />
        </div>
        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <button type="submit" value="whatsapp" className="btn btn-primary flex-1">
            <WhatsAppIcon /> Send on WhatsApp
          </button>
          <button type="submit" value="email" className="btn flex-1">
            <MailIcon /> Send by email
          </button>
        </div>
        <p className="text-xs text-muted">
          Opens WhatsApp ({`+${site.whatsapp}`}) or your email app with everything filled in.
        </p>
      </Fieldset>
    </form>
  );
}

function Select({
  label,
  options,
  cls,
  ...rest
}: { label: string; options: string[]; cls: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block text-sm">
      <span className="text-muted">{label}</span>
      <select className={cls} {...rest}>
        {options.map((o) => (
          <option key={o} value={o} className="bg-page">
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
