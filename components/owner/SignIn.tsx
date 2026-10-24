"use client";

import { useState } from "react";
import { REPO } from "@/lib/owner/repo";
import { GitHubError, verify } from "@/lib/owner/github";
import { TOKEN_KEY, useOwner } from "@/lib/owner/store";

// A link that opens GitHub's "new fine-grained token" page with the name,
// expiry and permission already filled in (the owner still picks the repo).
const TOKEN_URL =
  "https://github.com/settings/personal-access-tokens/new?" +
  new URLSearchParams({
    name: "RK shop owner page",
    description: "Lets the owner page update products on the website",
    target_name: REPO.owner,
    expires_in: "365",
    contents: "write",
  });

/**
 * The only way in: a GitHub access token that can write to the site's
 * repository. The secret tap only finds this page; this is what protects it.
 */
export function SignIn() {
  const signIn = useOwner((s) => s.signIn);
  const [token, setToken] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = token.trim();
    if (!t) return;
    setBusy(true);
    setError("");
    try {
      const { login, canWrite } = await verify(t);
      if (!canWrite) {
        setError(`That key can't change ${REPO.owner}/${REPO.name}. Give it "Contents: Read and write" on that repository.`);
        return;
      }
      try {
        (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, t);
      } catch {}
      signIn(t, login);
    } catch (err) {
      setError(
        err instanceof GitHubError && (err.status === 401 || err.status === 404)
          ? "GitHub didn't accept that key, or it can't see the shop's repository. Check you copied all of it."
          : "Couldn't reach GitHub. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-pop">Owner</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold display-case leading-none">Shop manager</h1>
      <p className="mt-3 text-muted">Add products, change prices and colours, and update shop settings. Sign in with your owner key.</p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="owner-key" className="mb-1.5 block text-sm font-semibold">
            Owner key
          </label>
          <input
            id="owner-key"
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="github_pat_…"
            className="w-full rounded-xl border border-fg/15 bg-raised px-3.5 py-3 font-mono text-sm outline-none focus:border-accent-2 focus:ring-2 focus:ring-accent-2/20"
          />
        </div>
        <label className="flex items-center gap-2.5 text-sm">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-5 w-5 accent-[var(--color-accent)]" />
          Keep me signed in on this device
        </label>
        {error && (
          <p role="alert" className="rounded-xl border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy || !token.trim()} className="btn btn-primary w-full disabled:opacity-50">
          {busy ? "Checking…" : "Sign in"}
        </button>
      </form>

      <details className="mt-8 rounded-2xl border border-line bg-surface p-4 text-sm">
        <summary className="cursor-pointer font-semibold">First time? Make your owner key (2 minutes)</summary>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-muted">
          <li>
            Sign in to GitHub as <b className="text-fg">{REPO.owner}</b>, then open{" "}
            <a href={TOKEN_URL} target="_blank" rel="noreferrer" className="font-semibold text-accent underline underline-offset-4">
              GitHub → new access token
            </a>
            .
          </li>
          <li>
            Under <b className="text-fg">Repository access</b>, choose <i>Only select repositories</i> → <b className="text-fg">{REPO.name}</b>.
          </li>
          <li>
            Under <b className="text-fg">Permissions → Contents</b>, choose <i>Read and write</i> (it may already be set).
          </li>
          <li>Generate, copy the key, and paste it above. Keep it private: anyone with it can change the shop.</li>
        </ol>
      </details>
    </div>
  );
}
