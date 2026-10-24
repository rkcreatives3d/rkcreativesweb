"use client";

import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { modelFor } from "@/lib/models";
import { commit, shaOf } from "@/lib/owner/github";
import { summarize } from "@/lib/owner/edit";
import { buildChanges, renderJobs, type ShotFiles } from "@/lib/owner/publish";
import { PATHS } from "@/lib/owner/repo";
import { useOwner } from "@/lib/owner/store";
const StudioCapture = lazy(() => import("./Studio3D").then((m) => ({ default: m.StudioCapture })));

type Phase =
  | { k: "review" }
  | { k: "conflict" }
  | { k: "pictures"; job: number }
  | { k: "upload"; done: number; total: number }
  | { k: "done"; sha: string }
  | { k: "error"; message: string };

/** Review the changes, make any studio pictures, save everything as one commit, then watch for it to go live. */
export function PublishPanel({ onClose }: { onClose: () => void }) {
  const s = useOwner();
  const original = s.original!;
  const draft = s.draft!;
  const lines = useMemo(
    () =>
      summarize(
        original,
        draft,
        Object.keys(s.uploads).map((path) => ({ path })),
        Object.keys(s.models),
      ),
    [original, draft, s.uploads, s.models],
  );
  const jobs = useMemo(() => renderJobs(original, draft, s.models, (p) => modelFor(p)), [original, draft, s.models]);
  const [phase, setPhase] = useState<Phase>({ k: "review" });
  const shots = useRef<Record<string, ShotFiles[]>>({});
  const [shotCount, setShotCount] = useState(0);

  const start = async (force = false) => {
    try {
      if (!force) {
        // someone (or another device) published since this page loaded?
        for (const path of [PATHS.products, PATHS.finishes, PATHS.shop]) {
          const now = await shaOf(s.token, path);
          if (now && s.shas[path] && now !== s.shas[path]) return setPhase({ k: "conflict" });
        }
      }
      shots.current = {};
      if (jobs.length) setPhase({ k: "pictures", job: 0 });
      else upload();
    } catch {
      setPhase({ k: "error", message: "Couldn't reach GitHub. Check your connection and try again." });
    }
  };

  const upload = async () => {
    setPhase({ k: "upload", done: 0, total: 1 });
    try {
      const { changes, content } = await buildChanges(s.token, original, draft, s.uploads, s.models, shots.current);
      if (!changes.length) return setPhase({ k: "error", message: "Nothing to publish." });
      const message = `Owner: ${lines.slice(0, 3).join("; ")}${lines.length > 3 ? ` and ${lines.length - 3} more` : ""}\n\n${lines.map((l) => `- ${l}`).join("\n")}`;
      const sha = await commit(s.token, message, changes, (done, total) => setPhase({ k: "upload", done, total }));
      useOwner.setState({ draft: content });
      useOwner.getState().published();
      const shas: Record<string, string> = {};
      for (const path of [PATHS.products, PATHS.finishes, PATHS.shop]) shas[path] = (await shaOf(s.token, path)) ?? "";
      useOwner.setState({ shas });
      setPhase({ k: "done", sha });
    } catch (e) {
      setPhase({ k: "error", message: e instanceof Error ? `Publishing failed: ${e.message}` : "Publishing failed." });
    }
  };

  const job = phase.k === "pictures" ? jobs[phase.job] : null;
  const totalShots = jobs.reduce((n, j) => n + j.finishes.length, 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-title"
      className="fixed inset-0 z-[70] grid place-items-end bg-black/40 sm:place-items-center"
    >
      <div className="max-h-[90svh] w-full overflow-y-auto rounded-t-3xl bg-page p-5 sm:max-w-lg sm:rounded-3xl sm:p-6">
        <h2 id="publish-title" className="font-display text-2xl font-extrabold display-case">
          Publish to the website
        </h2>

        {phase.k === "review" && (
          <>
            {lines.length ? (
              <ul className="mt-4 space-y-1.5 text-sm">
                {lines.map((l) => (
                  <li key={l} className="flex gap-2">
                    <span className="text-pop">•</span>
                    {l}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-muted">No changes yet.</p>
            )}
            {totalShots > 0 && (
              <p className="mt-4 rounded-xl bg-surface p-3 text-xs text-muted">
                {totalShots} studio picture{totalShots === 1 ? "" : "s"} will be made on this device first (for the cart, share previews and slow
                phones). Keep this page open.
              </p>
            )}
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button onClick={onClose} className="btn">
                Not yet
              </button>
              <button onClick={() => start()} disabled={!lines.length} className="btn btn-primary disabled:opacity-50">
                Publish
              </button>
            </div>
          </>
        )}

        {phase.k === "conflict" && (
          <>
            <p className="mt-4 text-sm">
              The shop was changed somewhere else (another device, or a site update) since you opened this page. Publishing now replaces those changes
              with yours.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button onClick={() => location.reload()} className="btn">
                Reload the latest (lose my changes)
              </button>
              <button onClick={() => start(true)} className="btn btn-primary">
                Publish mine anyway
              </button>
            </div>
          </>
        )}

        {phase.k === "pictures" && job && (
          <>
            <p className="mt-4 text-sm" role="status">
              Making studio pictures… {shotCount} of {totalShots}
              <span className="block text-xs text-muted">{job.product.name}</span>
            </p>
            <Progress value={shotCount / totalShots} />
            <Suspense fallback={null}>
              <StudioCapture
                key={phase.job}
                product={job.product}
                modelUrl={job.modelUrl}
                finishes={job.finishes}
                onShot={() => setShotCount((n) => n + 1)}
                onDone={(list) => {
                  shots.current[job.product.slug] = list;
                  if (phase.job + 1 < jobs.length) setPhase({ k: "pictures", job: phase.job + 1 });
                  else upload();
                }}
                onError={(e) => setPhase({ k: "error", message: e.message })}
              />
            </Suspense>
          </>
        )}

        {phase.k === "upload" && (
          <>
            <p className="mt-4 text-sm" role="status">
              Saving to the website… {phase.done} of {phase.total}
            </p>
            <Progress value={phase.done / Math.max(1, phase.total)} />
          </>
        )}

        {phase.k === "done" && <Live sha={phase.sha} onClose={onClose} />}

        {phase.k === "error" && (
          <>
            <p role="alert" className="mt-4 rounded-xl border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
              {phase.message} Your changes are still here.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={onClose} className="btn">
                Close
              </button>
              <button onClick={() => setPhase({ k: "review" })} className="btn btn-primary">
                Try again
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Progress({ value }: { value: number }) {
  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-fg/10">
      <div className="h-full rounded-full bg-accent-fill transition-[width]" style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}

/** Watches the live site's version.json until it reports the new commit. */
function Live({ sha, onClose }: { sha: string; onClose: () => void }) {
  const local = typeof location !== "undefined" && /^(localhost|127\.|192\.168\.)/.test(location.hostname);
  const [live, setLive] = useState(false);
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (local) return;
    const t0 = Date.now();
    const id = setInterval(async () => {
      setSecs(Math.round((Date.now() - t0) / 1000));
      try {
        const v = (await (await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" })).json()) as { commit?: string };
        if (v.commit === sha) {
          setLive(true);
          clearInterval(id);
        }
      } catch {}
    }, 10_000);
    return () => clearInterval(id);
  }, [sha, local]);
  return (
    <>
      <p className="mt-4 text-sm" role="status">
        {live ? (
          <>
            <b>Live on the website.</b> Customers see your changes now.
          </>
        ) : local ? (
          <>
            <b>Published.</b> The website rebuilds on its own and shows the changes in about 3–5 minutes.
          </>
        ) : (
          <>
            <b>Published.</b> The website is rebuilding… {secs > 0 && `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`}
            <span className="block text-xs text-muted">Usually 3–5 minutes. You can keep editing or close this page.</span>
          </>
        )}
      </p>
      <p className="mt-2 font-mono text-xs text-muted">Saved as {sha.slice(0, 7)}</p>
      <div className="mt-6 flex justify-end gap-3">
        {live && (
          <a href="/shop/" className="btn">
            Open the shop
          </a>
        )}
        <button onClick={onClose} className="btn btn-primary">
          Done
        </button>
      </div>
    </>
  );
}
