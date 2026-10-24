"use client";

import { useEffect, useState } from "react";
import type { InboxReview } from "@/lib/owner/edit";
import { GitHubError, listTree, readBlob } from "@/lib/owner/github";
import { REVIEWS_BRANCH } from "@/lib/owner/repo";
import { photoSrc, useOwner } from "@/lib/owner/store";
import { Stars } from "../Reviews";
import { Card, dangerBtn, smallBtn } from "./fields";

/**
 * Customers' reviews: the ones waiting (sent in on /reviews/, kept on the
 * inbox branch) to approve or reject, and the published ones to remove.
 * Decisions take effect on Publish, like every other change.
 */
export function ReviewsTab() {
  const { token, inbox, inboxDone, draft, canPublish } = useOwner();
  const { setInbox, approveReview, rejectReview, removeReview } = useOwner.getState();
  const [error, setError] = useState("");
  const products = draft!.products;
  const nameOf = (slug?: string) => products.find((p) => p.slug === slug)?.name ?? "A custom print";

  useEffect(() => {
    if (inbox || !token) return;
    (async () => {
      try {
        const files = await listTree(token, ["inbox/"], REVIEWS_BRANCH);
        const list: InboxReview[] = [];
        for (const f of files.filter((f) => f.path.endsWith(".json"))) {
          const r = JSON.parse(new TextDecoder().decode(await readBlob(token, f.sha))) as InboxReview;
          const photo = files.find((x) => x.path === `inbox/${r.id}.jpg`);
          if (photo) {
            const bytes = await readBlob(token, photo.sha);
            list.push({ ...r, photoBytes: bytes, photoUrl: URL.createObjectURL(new Blob([bytes], { type: "image/jpeg" })) });
          } else list.push(r);
        }
        setInbox(list.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")));
      } catch (e) {
        // no inbox yet (nobody has sent a review), or no GitHub key on the host
        if (e instanceof GitHubError && e.status === 404) setInbox([]);
        else if (e instanceof GitHubError && e.status === 503) setError("Waiting reviews show here once the website has its GitHub key (GITHUB_TOKEN in Vercel).");
        else setError("Couldn't load the waiting reviews. Reload to try again.");
      }
    })();
  }, [inbox, token, setInbox]);

  // (an approved review whose inbox copy wasn't tidied away yet never shows twice)
  const live = new Set(draft!.reviews.map((r) => r.id));
  const waiting = (inbox ?? []).filter((r) => !inboxDone.includes(r.id) && !live.has(r.id));

  return (
    <div className="space-y-4">
      <Card title={`Waiting for approval${inbox ? ` (${waiting.length})` : ""}`}>
        {error ? (
          <p className="text-sm text-muted">{error}</p>
        ) : !inbox ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : waiting.length ? (
          <ul className="space-y-3" aria-label="Waiting reviews">
            {waiting.map((r) => (
              <li key={r.id} className="rounded-xl border border-line bg-raised p-3">
                <div className="flex gap-3">
                  {r.photoUrl && (
                    <a href={r.photoUrl} target="_blank" rel="noreferrer" className="shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.photoUrl} alt={`${r.name}'s photo`} className="h-24 w-24 rounded-lg object-cover" />
                    </a>
                  )}
                  <div className="min-w-0">
                    <Stars rating={r.rating} />
                    <p className="mt-1 text-sm">{r.text}</p>
                    <p className="mt-1 text-xs text-muted">
                      {r.name}
                      {r.city && `, ${r.city}`} · {nameOf(r.product)} · {r.date}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => approveReview(r)} className={`${smallBtn} border-fg bg-fg text-page hover:border-fg`}>
                    Approve
                  </button>
                  <button onClick={() => rejectReview(r.id)} className={dangerBtn}>
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">
            No reviews waiting. Customers write them on the <span className="font-mono">/reviews/</span> page.
          </p>
        )}
        {inboxDone.length > 0 && (
          <p className="text-xs text-muted">
            {inboxDone.length} decided: {canPublish ? "press Publish to put them live." : "they go live when you can publish."}
          </p>
        )}
      </Card>

      <Card title={`On the website (${draft!.reviews.length})`}>
        {draft!.reviews.length ? (
          <ul className="space-y-2" aria-label="Published reviews">
            {draft!.reviews.map((r) => (
              <li key={r.id} className="flex items-start gap-3 rounded-xl border border-line bg-raised p-3">
                {r.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoSrc(r.image)} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <Stars rating={r.rating} />
                  <p className="truncate text-sm">{r.text}</p>
                  <p className="text-xs text-muted">
                    {r.name} · {nameOf(r.product)}
                  </p>
                </div>
                <button onClick={() => confirm("Take this review off the website?") && r.id && removeReview(r.id)} className={dangerBtn}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">None yet.</p>
        )}
      </Card>
    </div>
  );
}
