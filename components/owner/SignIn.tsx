"use client";

import { useEffect, useState } from "react";
import { REPO } from "@/lib/owner/repo";
import { GitHubError, passwordLogin, ping, verify } from "@/lib/owner/github";
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

/** The Vercel project's environment-variable settings (team "rkc4", project "rkcreativesweb"). */
const VERCEL_ENV = "https://vercel.com/rkc4/rkcreativesweb/settings/environment-variables";

const input = "w-full rounded-xl border border-fg/15 bg-raised px-3.5 py-3 outline-none focus:border-accent-2 focus:ring-2 focus:ring-accent-2/20";

function keep(token: string, remember: boolean) {
  try {
    (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
  } catch {}
}

/**
 * Sign-in: the owner password, checked by the owner sign-in server
 * (scripts/owner-api.mjs), or a GitHub key as a backup. The secret tap only
 * finds this page; this is what protects it.
 */
export function SignIn() {
  const signIn = useOwner((s) => s.signIn);
  const [server, setServer] = useState<"checking" | "slow" | "ok" | "not-set-up" | "unreachable">("checking");
  const [useKey, setUseKey] = useState(false);
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // is the sign-in server there? (a free host can take up to a minute to wake)
  const connect = () => {
    setServer("checking");
    const slow = setTimeout(() => setServer((s) => (s === "checking" ? "slow" : s)), 2500);
    ping().then((r) => {
      clearTimeout(slow);
      setServer(r);
      if (r === "not-set-up") setUseKey(true);
    });
  };
  useEffect(connect, []);

  const withPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setBusy(true);
    setError("");
    try {
      const session = await passwordLogin(password, remember);
      keep(session, remember);
      signIn(session, "owner");
    } catch (err) {
      const g = err instanceof GitHubError ? err : null;
      setError(
        g?.status === 401
          ? `Wrong password.${g.left !== undefined ? ` ${g.left} ${g.left === 1 ? "try" : "tries"} left before a 15-minute wait.` : ""}`
          : g?.status === 429
            ? "Too many wrong tries. Wait 15 minutes, then try again."
            : "Couldn't reach the sign-in server. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
      setPassword("");
    }
  };

  const withKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = token.trim();
    if (!t) return;
    // GitHub keys start like this; anything else is probably the password, typed in the wrong box
    if (!/^(github_pat_|ghp_)/.test(t)) {
      setError("That's not a GitHub key (they start with github_pat_). If it's your password: the password box appears once password sign-in is switched on in Vercel, see the box above.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { login, canWrite } = await verify(t);
      if (!canWrite) {
        setError(`That key can't change ${REPO.owner}/${REPO.name}. Give it "Contents: Read and write" on that repository.`);
        return;
      }
      keep(t, remember);
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

  const rememberBox = (
    <label className="flex items-center gap-2.5 text-sm">
      <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-5 w-5 accent-[var(--color-accent)]" />
      Keep me signed in on this device
    </label>
  );
  const errorBox = error && (
    <p role="alert" className="rounded-xl border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
      {error}
    </p>
  );

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-pop">Owner</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold display-case leading-none">Shop manager</h1>
      <p className="mt-3 text-muted">Add products, change prices and colours, and update shop settings.</p>

      {!useKey && (
        <form onSubmit={withPassword} className="mt-8 space-y-4">
          <div>
            <label htmlFor="owner-password" className="mb-1.5 block text-sm font-semibold">
              Password
            </label>
            <input
              id="owner-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={server !== "ok"}
              className={input}
            />
          </div>
          {rememberBox}
          {server === "checking" && <p className="text-sm text-muted">Connecting…</p>}
          {server === "slow" && (
            <p className="text-sm text-muted" role="status">
              Waking up the sign-in server. This can take up to a minute the first time in a while.
            </p>
          )}
          {server === "unreachable" && (
            <p className="text-sm text-danger" role="alert">
              Couldn&apos;t reach the sign-in server.{" "}
              <button type="button" onClick={connect} className="font-semibold underline underline-offset-4">
                Try again
              </button>
            </p>
          )}
          {errorBox}
          <button type="submit" disabled={busy || server !== "ok" || !password} className="btn btn-primary w-full disabled:opacity-50">
            {busy ? "Checking…" : "Sign in"}
          </button>
        </form>
      )}

      {useKey && (
        <form onSubmit={withKey} className="mt-8 space-y-4">
          {server === "not-set-up" && (
            <p className="rounded-xl border border-pop/40 bg-pop/10 p-3 text-sm">
              Password sign-in isn&apos;t switched on yet. In{" "}
              <a href={VERCEL_ENV} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-4">
                Vercel → Settings → Environment Variables
              </a>
              , add <code className="font-mono">OWNER_PASSWORD</code> (your password) and <code className="font-mono">GITHUB_TOKEN</code> (a GitHub key), then
              redeploy. Then this page shows a password box. Meanwhile you can sign in with a GitHub key.
            </p>
          )}
          <div>
            <label htmlFor="owner-key" className="mb-1.5 block text-sm font-semibold">
              GitHub key
            </label>
            <input
              id="owner-key"
              type="password"
              autoComplete="off"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="github_pat_…"
              className={`${input} font-mono text-sm`}
            />
          </div>
          {rememberBox}
          {errorBox}
          <button type="submit" disabled={busy || !token.trim()} className="btn btn-primary w-full disabled:opacity-50">
            {busy ? "Checking…" : "Sign in with key"}
          </button>
          <details className="rounded-2xl border border-line bg-surface p-4 text-sm">
            <summary className="cursor-pointer font-semibold">How to make a GitHub key (2 minutes)</summary>
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
                Under <b className="text-fg">Permissions → Contents</b>, choose <i>Read and write</i>.
              </li>
              <li>Generate, copy the key, and paste it above. Keep it private: anyone with it can change the shop.</li>
            </ol>
          </details>
        </form>
      )}

      {server !== "not-set-up" && (
        <button
          type="button"
          onClick={() => {
            setUseKey((v) => !v);
            setError("");
          }}
          className="mt-6 text-sm font-semibold text-muted underline underline-offset-4 hover:text-fg"
        >
          {useKey ? "Sign in with the password instead" : "Sign in with a GitHub key instead"}
        </button>
      )}
    </div>
  );
}
