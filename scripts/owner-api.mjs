#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
//  Owner sign-in server: lets the owner page log in with a password.
//
//  The website itself is public and runs in the browser, so it can't keep a
//  secret. This tiny server does: it holds the GitHub key (GITHUB_TOKEN),
//  checks the owner's password (OWNER_PASSWORD), and passes the owner page's
//  requests on to the shop's GitHub repository, only the few kinds it needs.
//  Wrong passwords are rate-limited. No dependencies.
//
//  Environment (set them in your host's dashboard, never in code):
//    OWNER_PASSWORD   the owner page password (enough to sign in and edit)
//    GITHUB_TOKEN     fine-grained token: this repo only, Contents read & write
//                     (needed to publish; without it the shop is read from the public repo)
//    GITHUB_REPO      optional, default "rkcreatives3d/rkcreativesweb"
//    PORT             set by the host
//
//  Where it runs (all at /api/owner on the site's own address):
//    Vercel       app/api/owner/[[...path]]/route.ts, written at build time
//                 by scripts/setup-host.mjs (the rest of the site stays static)
//    Node hosts   inside scripts/serve.mjs when the two secrets are set
//    on its own   node scripts/owner-api.mjs  (then set NEXT_PUBLIC_OWNER_API)
// ─────────────────────────────────────────────────────────────
import http from "node:http";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const SESSION_HOURS = 12;
const REMEMBER_DAYS = 30;
const MAX_FAILS_PER_IP = 5; // per 15 minutes
const MAX_FAILS_TOTAL = 30; // per hour, from everyone: then everyone waits
const MAX_BODY = 120 * 1024 * 1024; // a big 3D file, base64-encoded

/** Only the GitHub calls the owner page makes, on the shop's repo. */
const ALLOWED = [
  ["GET", /^$/],
  ["GET", /^contents\/[\w./-]+$/],
  ["GET", /^git\/ref\/heads\/[\w.-]+$/],
  ["GET", /^git\/commits\/[0-9a-f]{40}$/],
  ["GET", /^git\/trees\/[0-9a-f]{40}$/],
  ["POST", /^git\/blobs$/],
  ["POST", /^git\/trees$/],
  ["POST", /^git\/commits$/],
  ["PATCH", /^git\/refs\/heads\/[\w.-]+$/],
];

const sha256 = (s) => crypto.createHash("sha256").update(s).digest();
const b64url = (buf) => Buffer.from(buf).toString("base64url");

/**
 * The owner API as a web-standard handler: (Request, client ip) → Response,
 * or null when the path isn't under `prefix`. Wrong-password counts live in
 * this closure, so create it once per server (or per warm serverless instance).
 * `env` defaults to process.env; `fetchImpl` / `githubApi` let tests use a fake GitHub.
 */
export function createOwnerApi({
  env = process.env,
  prefix = "/api/owner",
  fetchImpl = fetch,
  githubApi = env.GITHUB_API || "https://api.github.com",
  githubRaw = env.GITHUB_RAW || "https://raw.githubusercontent.com",
} = {}) {
  const password = env.OWNER_PASSWORD || "";
  const token = env.GITHUB_TOKEN || "";
  const repo = env.GITHUB_REPO || "rkcreatives3d/rkcreativesweb";
  // the password alone signs the owner in (and reads the shop from the public repo);
  // publishing also needs the GitHub key
  const ready = !!password;
  const missing = [...(password ? [] : ["OWNER_PASSWORD"]), ...(token ? [] : ["GITHUB_TOKEN"])];
  // signing key for sessions: changing the password (or the GitHub key) signs everyone out
  const key = sha256(`rk-owner-session\0${password}\0${token}`);
  const fails = new Map(); // ip -> [times]
  let allFails = [];

  const sign = (payload) => {
    const body = b64url(JSON.stringify(payload));
    return `${body}.${b64url(crypto.createHmac("sha256", key).update(body).digest())}`;
  };
  const check = (session) => {
    const [body, mac] = String(session || "").split(".");
    if (!body || !mac) return false;
    const want = crypto.createHmac("sha256", key).update(body).digest();
    const got = Buffer.from(mac, "base64url");
    if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) return false;
    try {
      return JSON.parse(Buffer.from(body, "base64url").toString()).exp > Date.now();
    } catch {
      return false;
    }
  };
  const reply = (status, body, extra = {}) =>
    new Response(status === 204 ? null : typeof body === "string" ? body : JSON.stringify(body), {
      status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        // sessions travel in a header, never in cookies, so any origin may call
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
        ...extra,
      },
    });

  return async function handle(request, ip = "") {
    const url = new URL(request.url);
    if (url.pathname !== prefix && !url.pathname.startsWith(`${prefix}/`)) return null;
    // trailing slashes are optional (the site adds them to every address)
    const route = url.pathname.slice(prefix.length).replace(/^\/+|\/+$/g, "");
    const method = request.method;
    if (method === "OPTIONS") return reply(204, "");
    // which settings are missing: names only, never values
    if (!ready) return reply(503, { error: "not-set-up", missing });

    // wake-up / health check (some hosts sleep when idle)
    if (route === "" && method === "GET") return reply(200, { ok: true, canPublish: !!token, missing });

    if (route === "login" && method === "POST") {
      const now = Date.now();
      const mine = (fails.get(ip) || []).filter((t) => now - t < 15 * 60_000);
      allFails = allFails.filter((t) => now - t < 60 * 60_000);
      if (mine.length >= MAX_FAILS_PER_IP || allFails.length >= MAX_FAILS_TOTAL) return reply(429, { error: "too-many-tries" }, { "Retry-After": "900" });
      let body = {};
      try {
        body = JSON.parse((await request.text()) || "{}");
      } catch {}
      // compare hashes: same length, constant time
      const ok = crypto.timingSafeEqual(sha256(String(body.password ?? "")), sha256(password));
      if (!ok) {
        mine.push(now);
        fails.set(ip, mine);
        allFails.push(now);
        // a little wait on every wrong try, so guessing is slow even within the limit
        await new Promise((r) => setTimeout(r, 800));
        return reply(401, { error: "wrong-password", left: Math.max(0, MAX_FAILS_PER_IP - mine.length) });
      }
      fails.delete(ip);
      const exp = now + (body.remember ? REMEMBER_DAYS * 24 : SESSION_HOURS) * 3600_000;
      return reply(200, { session: sign({ exp }), expiresAt: exp });
    }

    const auth = String(request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (!check(auth)) return reply(401, { error: "signed-out" });

    if (route === "me" && method === "GET") return reply(200, { login: "owner", canWrite: true });

    if (route === "github" || route.startsWith("github/")) {
      const path = route.slice("github".length).replace(/^\//, "");
      if (!ALLOWED.some(([m, re]) => m === method && re.test(path))) return reply(403, { error: "not-allowed" });
      if (!token) {
        // no GitHub key yet: files can still be read from the public repository; saving can't
        const file = path.match(/^contents\/(.+)$/)?.[1];
        if (method !== "GET" || !file) return reply(503, { error: "no-github-token", missing });
        const ref = url.searchParams.get("ref") || "main";
        try {
          const raw = await fetchImpl(`${githubRaw}/${repo}/${ref}/${file}`, { headers: { "User-Agent": "rk-owner-api" } });
          if (!raw.ok) return reply(raw.status === 404 ? 404 : 502, { error: raw.status === 404 ? "not-found" : "github-unreachable" });
          const bytes = Buffer.from(await raw.arrayBuffer());
          // the same blob id GitHub would report, so "changed elsewhere" checks still work
          const sha = crypto.createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
          return reply(200, { content: bytes.toString("base64"), sha, encoding: "base64" });
        } catch {
          return reply(502, { error: "github-unreachable" });
        }
      }
      let body;
      if (method !== "GET") {
        body = await request.arrayBuffer();
        if (body.byteLength > MAX_BODY) return reply(413, { error: "too-large" });
      }
      try {
        const gh = await fetchImpl(`${githubApi}/repos/${repo}${path ? `/${path}` : ""}${url.search}`, {
          method,
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${token}`,
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "rk-owner-api",
            ...(body ? { "Content-Type": "application/json" } : {}),
          },
          body,
        });
        return reply(gh.status, (await gh.text()) || "{}");
      } catch {
        return reply(502, { error: "github-unreachable" });
      }
    }
    return reply(404, { error: "not-found" });
  };
}

/** The same API for a plain Node http server: (req, res) → true if it handled the request. */
export function toNodeHandler(handle) {
  return async function (req, res) {
    if (!String(req.url || "").startsWith("/api/owner")) return false;
    const chunks = [];
    let size = 0;
    for await (const c of req) {
      size += c.length;
      if (size > MAX_BODY) {
        res.writeHead(413).end();
        return true;
      }
      chunks.push(c);
    }
    const hasBody = !["GET", "HEAD"].includes(req.method || "GET");
    const request = new Request(`http://localhost${req.url}`, { method: req.method, headers: req.headers, body: hasBody ? Buffer.concat(chunks) : undefined });
    const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
    const response = await handle(request, ip);
    if (!response) return false;
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
    return true;
  };
}

// run on its own
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const handle = toNodeHandler(createOwnerApi());
  const port = Number(process.env.PORT || 8787);
  http
    .createServer(async (req, res) => {
      if (!(await handle(req, res))) {
        // anything else (e.g. the host's health check on "/")
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("RK owner sign-in server");
      }
    })
    .listen(port, () => console.log(`Owner sign-in server on port ${port}${process.env.OWNER_PASSWORD && process.env.GITHUB_TOKEN ? "" : " (set OWNER_PASSWORD and GITHUB_TOKEN)"}`));
}
