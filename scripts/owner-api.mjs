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
//    OWNER_PASSWORD   optional: replaces the built-in owner password
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

// Customer reviews: anyone may send one, and it goes live straight away: it's
// added to content/reviews.json on the live branch, which rebuilds the site.
// The limits below (and refusing links) keep it from being abused; the owner can
// take any review down in the shop manager. (Older reviews may still wait on
// this branch from when reviews needed approval; the shop manager shows them.)
export const REVIEWS_BRANCH = "reviews-inbox";
const REVIEWS_PER_IP = 3; // per hour
const REVIEWS_TOTAL = 40; // per day, from everyone
const MAX_REVIEW_PHOTO = 1_600_000; // bytes, after the browser has shrunk it

/** Only the GitHub calls the owner page makes, on the shop's repo. */
const ALLOWED = [
  ["GET", /^$/],
  ["GET", /^contents\/[\w./-]+$/],
  ["GET", /^git\/ref\/heads\/[\w.-]+$/],
  ["GET", /^git\/commits\/[0-9a-f]{40}$/],
  ["GET", /^git\/trees\/[0-9a-f]{40}$/],
  ["GET", /^git\/blobs\/[0-9a-f]{40}$/],
  ["POST", /^git\/blobs$/],
  ["POST", /^git\/trees$/],
  ["POST", /^git\/commits$/],
  ["PATCH", /^git\/refs\/heads\/[\w.-]+$/],
];

const sha256 = (s) => crypto.createHash("sha256").update(s).digest();

// The owner's chosen password, built in (stored as a hash, not as text), so
// sign-in works with no host settings. OWNER_PASSWORD, when set, replaces it.
// Note: anyone can try passwords; publishing also needs GITHUB_TOKEN.
const DEFAULT_PASSWORD_HASH = "749ea368354dc1ea8c10bddb2c9025128f9b8563e3edbcbed9217db2779a798e";
const passwordHash = (p) => sha256(`rk-owner:${p}`);
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
  const wanted = password ? passwordHash(password) : Buffer.from(DEFAULT_PASSWORD_HASH, "hex");
  const token = env.GITHUB_TOKEN || "";
  const repo = env.GITHUB_REPO || "rkcreatives3d/rkcreativesweb";
  // the password signs the owner in (and reads the shop from the public repo);
  // publishing also needs the GitHub key
  const ready = true;
  const missing = token ? [] : ["GITHUB_TOKEN"];
  // signing key for sessions: changing the password (or the GitHub key) signs everyone out.
  // Without a GitHub key a session can only read what's public anyway.
  const key = sha256(`rk-owner-session\0${wanted.toString("hex")}\0${token}`);
  const fails = new Map(); // ip -> [times]
  let allFails = [];
  const sent = new Map(); // ip -> [times] (reviews)
  let allSent = [];

  /** GitHub REST call with the server's key, on the shop's repo. */
  const gh = async (path, init = {}) => {
    const res = await fetchImpl(`${githubApi}/repos/${repo}/${path}`, {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "rk-owner-api",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
      },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(body.message || res.statusText), { status: res.status });
    return body;
  };

  /** Puts one review (and its photo) straight on the site: content/reviews.json and public/reviews/<id>.jpg on main, in one commit. */
  async function postReview(entry, photo) {
    const photoBlob = photo ? await gh("git/blobs", { method: "POST", body: JSON.stringify({ content: photo.toString("base64"), encoding: "base64" }) }) : null;
    // the owner (or another customer) publishing at the same moment: the second retries on top of the first
    for (let attempt = 0; ; attempt++) {
      const head = (await gh("git/ref/heads/main")).object.sha;
      let list = [];
      try {
        const file = await gh(`contents/content/reviews.json?ref=${head}`);
        list = JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));
      } catch (e) {
        if (e.status !== 404) throw e;
      }
      if (!Array.isArray(list)) list = [];
      // newest first, written the way the shop manager writes it
      const json = Buffer.from(JSON.stringify([entry, ...list], null, 2) + "\n");
      const jsonBlob = await gh("git/blobs", { method: "POST", body: JSON.stringify({ content: json.toString("base64"), encoding: "base64" }) });
      const tree = [{ path: "content/reviews.json", mode: "100644", type: "blob", sha: jsonBlob.sha }];
      if (photoBlob) tree.push({ path: `public${entry.image}`, mode: "100644", type: "blob", sha: photoBlob.sha });
      const base = (await gh(`git/commits/${head}`)).tree.sha;
      const t = await gh("git/trees", { method: "POST", body: JSON.stringify({ base_tree: base, tree }) });
      const message = `Review: ${entry.name}, ${entry.rating}/5${entry.product ? ` (${entry.product})` : ""}`;
      const c = await gh("git/commits", { method: "POST", body: JSON.stringify({ message, tree: t.sha, parents: [head] }) });
      try {
        await gh("git/refs/heads/main", { method: "PATCH", body: JSON.stringify({ sha: c.sha, force: false }) });
        return;
      } catch (e) {
        if (attempt >= 2 || e.status !== 422) throw e;
      }
    }
  }

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
      const ok = crypto.timingSafeEqual(passwordHash(String(body.password ?? "")), wanted);
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

    // a customer's review: public, checked, rate-limited, then straight onto the site
    if (route === "review" && method === "POST") {
      const now = Date.now();
      const mine = (sent.get(ip) || []).filter((t) => now - t < 60 * 60_000);
      allSent = allSent.filter((t) => now - t < 24 * 3600_000);
      if (mine.length >= REVIEWS_PER_IP || allSent.length >= REVIEWS_TOTAL) return reply(429, { error: "too-many" });
      const raw = await request.text();
      if (raw.length > MAX_REVIEW_PHOTO * 1.4 + 20_000) return reply(413, { error: "too-large" });
      let b = {};
      try {
        b = JSON.parse(raw || "{}");
      } catch {}
      // filled in only by bots (the field is hidden from people): pretend it worked
      if (b.website) return reply(200, { ok: true });
      const clean = (v, max) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
      const name = clean(b.name, 40);
      const city = clean(b.city, 40);
      const text = String(b.text ?? "").trim().slice(0, 1000);
      const rating = Number(b.rating);
      const product = String(b.product ?? "");
      if (name.length < 2) return reply(400, { error: "name" });
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) return reply(400, { error: "rating" });
      if (text.length < 10) return reply(400, { error: "text" });
      if (product && !/^[a-z0-9-]{1,60}$/.test(product)) return reply(400, { error: "product" });
      // no links: they're how spam gets onto review pages
      // (web addresses only: "mom.in fact", a missing space after a full stop, is fine)
      if (/https?:\/\/|www\.|\b[\w-]{2,}\.(com|net|org|xyz|info|biz|ru|top|shop|online|link)\b|\b[\w-]{2,}\.co\.[a-z]{2}\b/i.test(`${name} ${city} ${text}`)) return reply(400, { error: "links" });
      let photo = null;
      if (b.photo) {
        photo = Buffer.from(String(b.photo), "base64");
        // JPEG only (the page converts every photo to one)
        if (photo.length > MAX_REVIEW_PHOTO || photo[0] !== 0xff || photo[1] !== 0xd8 || photo[2] !== 0xff) return reply(400, { error: "photo" });
      }
      if (!token) return reply(503, { error: "no-github-token" });
      const id = `${now.toString(36)}${crypto.randomBytes(3).toString("hex")}`;
      const entry = {
        id,
        name,
        ...(city ? { city } : {}),
        ...(product ? { product } : {}),
        rating,
        text,
        date: new Date(now).toISOString().slice(0, 10),
        ...(photo ? { image: `/reviews/${id}.jpg` } : {}),
      };
      try {
        await postReview(entry, photo);
      } catch {
        return reply(502, { error: "github-unreachable" });
      }
      mine.push(now);
      sent.set(ip, mine);
      allSent.push(now);
      return reply(200, { ok: true, review: entry });
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
