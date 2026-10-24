"use client";

import { useEffect, useState } from "react";
import type { Finish, Product } from "@/lib/products";
import type { Review } from "@/lib/content";
import type { Content, Shop } from "@/lib/owner/edit";
import { GitHubError, ping, readJSON, verify } from "@/lib/owner/github";
import { PATHS, REPO } from "@/lib/owner/repo";
import { isDirty, TOKEN_KEY, useOwner } from "@/lib/owner/store";
import { SignIn } from "./SignIn";
import { ProductsTab } from "./ProductsTab";
import { ProductEditor } from "./ProductEditor";
import { ColoursTab } from "./ColoursTab";
import { SettingsTab } from "./SettingsTab";
import { ReviewsTab } from "./ReviewsTab";
import { PublishPanel } from "./PublishPanel";

type Tab = "products" | "colours" | "reviews" | "settings";

/**
 * The owner's shop manager (/owner/). Reads the shop's content files from
 * GitHub, edits a working copy, and publishes everything as one commit; the
 * host rebuilds the site from it. Covers the site's own header and footer.
 */
export function OwnerApp() {
  const { token, login, draft, canPublish } = useOwner();
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("products");
  const [editing, setEditing] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  // re-render when photos or 3D files are added (they count as changes)
  useOwner((s) => s.uploads);
  useOwner((s) => s.models);
  useOwner((s) => s.inboxDone);
  const dirty = isDirty();

  // signed in on this device before?
  useEffect(() => {
    let saved = "";
    try {
      saved = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || "";
    } catch {}
    if (!saved) return setChecking(false);
    verify(saved)
      .then(({ login, canWrite }) => (canWrite ? useOwner.getState().signIn(saved, login) : useOwner.getState().signOut()))
      .catch((e) => {
        if (e instanceof GitHubError && e.status === 401) useOwner.getState().signOut();
        else setError("Couldn't reach GitHub. Check your connection, then reload.");
      })
      .finally(() => setChecking(false));
  }, []);

  // signed in with the password: can the host publish yet? (it needs its GitHub key)
  useEffect(() => {
    if (token.startsWith("session:")) ping().then((r) => useOwner.setState({ canPublish: r.canPublish }));
  }, [token]);

  // load the shop's current content
  useEffect(() => {
    if (!token || draft) return;
    Promise.all([
      readJSON<Product[]>(token, PATHS.products),
      readJSON<Finish[]>(token, PATHS.finishes),
      readJSON<Shop>(token, PATHS.shop),
      readJSON<Record<string, string[]>>(token, PATHS.renders),
      readJSON<Review[]>(token, PATHS.reviews).catch(() => ({ data: [] as Review[], sha: "" })),
    ])
      .then(([products, finishes, shop, renders, reviews]) => {
        const content: Content = { products: products.data, finishes: finishes.data, shop: shop.data, renders: renders.data, reviews: reviews.data };
        useOwner.getState().loaded(content, { [PATHS.products]: products.sha, [PATHS.finishes]: finishes.sha, [PATHS.shop]: shop.sha });
      })
      .catch(() => setError("Couldn't load the shop's products from GitHub. Reload to try again."));
  }, [token, draft]);

  // don't lose unpublished work by accident
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (isDirty()) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  return (
    // over the site's own header and footer; scrolls by itself (Lenis leaves it alone)
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-page" data-lenis-prevent>
      {checking ? (
        <p className="p-10 text-center text-muted">Loading…</p>
      ) : !token ? (
        <SignIn />
      ) : (
        <>
          <header className="sticky top-0 z-10 border-b border-line bg-page/95 px-4 py-3 sm:px-6">
            <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-3">
              <div className="mr-auto">
                <p className="font-display text-lg font-extrabold display-case leading-none">Shop manager</p>
                <p className="text-xs text-muted">
                  {login ? `Signed in as ${login}` : "Signed in"} · {REPO.owner}/{REPO.name}
                </p>
              </div>
              {dirty && (
                <button onClick={() => confirm("Throw away all changes since the last publish?") && useOwner.getState().discard()} className="text-sm font-semibold text-muted hover:text-fg">
                  Discard
                </button>
              )}
              <button onClick={() => setPublishing(true)} disabled={!dirty} className="btn btn-primary disabled:opacity-50">
                {dirty ? "Publish changes" : "All published"}
              </button>
              <button
                onClick={() => (!isDirty() || confirm("You have unpublished changes. Sign out anyway?")) && useOwner.getState().signOut()}
                className="text-sm font-semibold text-muted hover:text-fg"
              >
                Sign out
              </button>
            </div>
            {!editing && draft && (
              <nav className="-mx-4 mt-3 flex max-w-4xl gap-1 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-auto sm:px-0" aria-label="Sections">
                {(
                  [
                    ["products", `Products (${draft.products.length})`],
                    ["colours", "Colours"],
                    ["reviews", "Reviews"],
                    ["settings", "Shop settings"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    aria-current={tab === id ? "page" : undefined}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${tab === id ? "bg-fg text-page" : "text-muted hover:text-fg"}`}
                  >
                    {label}
                  </button>
                ))}
              </nav>
            )}
          </header>

          <main className="mx-auto max-w-4xl px-4 py-5 pb-24 sm:px-6">
            {!canPublish && (
              <p className="mb-4 rounded-xl border border-pop/40 bg-pop/10 p-3 text-sm" role="status">
                <b>You can edit, but Publish is off</b> until the website has its GitHub key: in{" "}
                <a
                  href="https://vercel.com/rkc4/rkcreativesweb/settings/environment-variables"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold underline underline-offset-4"
                >
                  Vercel → Settings → Environment Variables
                </a>
                , add <code className="font-mono">GITHUB_TOKEN</code> for Production, then redeploy.
              </p>
            )}
            {error ? (
              <p role="alert" className="rounded-xl border border-danger/30 bg-danger/5 p-4 text-danger">
                {error}
              </p>
            ) : !draft ? (
              <p className="py-10 text-center text-muted">Loading the shop…</p>
            ) : editing ? (
              <ProductEditor slug={editing} onClose={() => setEditing(null)} />
            ) : tab === "products" ? (
              <ProductsTab onEdit={setEditing} />
            ) : tab === "colours" ? (
              <ColoursTab />
            ) : tab === "reviews" ? (
              <ReviewsTab />
            ) : (
              <SettingsTab />
            )}
          </main>
          {publishing && <PublishPanel onClose={() => setPublishing(false)} />}
        </>
      )}
    </div>
  );
}
