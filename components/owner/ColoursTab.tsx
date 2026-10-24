"use client";

import { useState } from "react";
import type { FinishKind } from "@/lib/products";
import { makeFinish, uniqueId } from "@/lib/owner/edit";
import { useOwner } from "@/lib/owner/store";
import { Card, Choice, dangerBtn, smallBtn, Text } from "./fields";

const KINDS = [
  ["matte", "Matte (flat, no shine)"],
  ["silk", "Silk (metallic sheen)"],
  ["glossy", "Glossy (shiny plastic)"],
] as const;

/** The filament colours the shop offers. Products pick from these. */
export function ColoursTab() {
  const draft = useOwner((s) => s.draft)!;
  const { setFinishes } = useOwner.getState();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3a7bd5");
  const [kind, setKind] = useState<FinishKind>("matte");
  const usedBy = (id: string) => draft.products.filter((p) => p.finishes.includes(id));

  const update = (id: string, patch: { name?: string; color?: string; kind?: FinishKind }) =>
    setFinishes(
      draft.finishes.map((f) => (f.id === id ? makeFinish(f.id, patch.name ?? f.name, patch.color ?? f.color, patch.kind ?? f.kind ?? "matte") : f)),
    );

  return (
    <div className="space-y-4">
      <Card title="Add a colour">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          <Text label="Name" value={name} onChange={setName} placeholder="e.g. Ocean Blue" />
          <div>
            <label htmlFor="new-colour" className="mb-1.5 block text-sm font-semibold">
              Colour
            </label>
            <input id="new-colour" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-11 w-20 cursor-pointer rounded-xl border border-fg/15 bg-raised p-1" />
          </div>
          <Choice label="Look" value={kind} onChange={setKind} options={KINDS} />
        </div>
        <button
          disabled={!name.trim()}
          onClick={() => {
            const id = uniqueId(name, draft.finishes.map((f) => f.id));
            setFinishes([...draft.finishes, makeFinish(id, name.trim(), color, kind)]);
            setName("");
          }}
          className="btn btn-primary disabled:opacity-50"
        >
          + Add colour
        </button>
        <p className="text-xs text-muted">Then tick it on the products that come in it. Match the colour to the real spool: the 3D preview and photo previews use it.</p>
      </Card>

      <ul className="space-y-2" aria-label="Colours">
        {draft.finishes.map((f) => {
          const users = usedBy(f.id);
          return (
            <li key={f.id} className="rounded-2xl border border-line bg-surface p-3">
              <div className="flex flex-wrap items-end gap-3">
                <span className="h-12 w-12 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: f.swatch }} aria-hidden />
                <div className="min-w-[10rem] flex-1">
                  <Text label="Name" value={f.name} onChange={(v) => update(f.id, { name: v })} />
                </div>
                <div>
                  <label htmlFor={`c-${f.id}`} className="mb-1.5 block text-sm font-semibold">
                    Colour
                  </label>
                  <input
                    id={`c-${f.id}`}
                    type="color"
                    value={f.color}
                    onChange={(e) => update(f.id, { color: e.target.value })}
                    className="h-11 w-16 cursor-pointer rounded-xl border border-fg/15 bg-raised p-1"
                  />
                </div>
                <div className="min-w-[10rem]">
                  <Choice label="Look" value={f.kind ?? "matte"} onChange={(v) => update(f.id, { kind: v })} options={KINDS} />
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted">
                <span>{users.length ? `Used by ${users.length} product${users.length === 1 ? "" : "s"}` : "Not used yet"}</span>
                <button
                  onClick={() => {
                    const only = users.filter((p) => p.finishes.length === 1);
                    if (only.length) return alert(`${only.map((p) => p.name).join(", ")} only come${only.length === 1 ? "s" : ""} in ${f.name}. Give them another colour first.`);
                    if (users.length && !confirm(`Remove ${f.name}? It's taken off ${users.length} product(s).`)) return;
                    setFinishes(
                      draft.finishes.filter((x) => x.id !== f.id),
                      draft.products.map((p) => ({ ...p, finishes: p.finishes.filter((x) => x !== f.id), photoFinish: p.photoFinish === f.id ? undefined : p.photoFinish })),
                    );
                  }}
                  className={draft.finishes.length > 1 ? dangerBtn : `${smallBtn} invisible`}
                >
                  Remove
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
