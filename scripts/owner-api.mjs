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
//    OWNER_PASSWORD   the owner page password
//    GITHUB_TOKEN     fine-grained token: this repo only, Contents read & write
//    GITHUB_REPO      optional, default "rkcreatives3d/rkcreativesweb"
//    PORT             set by the host
//
//  Run on its own:   node scripts/owner-api.mjs      (e.g. a Render Web Service)
//  Or inside scripts/serve.mjs, which mounts it at /api/owner when the two
//  secrets are set.
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
 * A request handler for /api/owner/*. Returns true if it handled the request.
 * `env` defaults to process.env; `fetchImpl` lets tests point it at a fake GitHub.
 */
export function createOwnerApi({ env = process.env, prefix = "/api/owner", fetchImpl = fetch, githubApi = env.GITHUB_API || "https://api.github.com" } = {}) {
  const password = env.OWNER_PASSWORD || "";
  const token = env.GITHUB_TOKEN || "";
  const repo = env.GITHUB_REPO || "rkcreatives3d/rkcreativesweb";
  const ready = !!(password && token);
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
  const ipOf = (req) => String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
  const send = (res, status, body, extra = {}) => {
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      // sessions travel in a header, never in cookies, so any origin may call
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
      ...extra,
    });
    res.end(typeof body === "string" ? body : JSON.stringify(body));
  };
  const readBody = (req) =>
    new Promise((resolve, reject) => {
      const chunks = [];
      let size = 0;
      req.on("data", (c) => {
        size += c.length;
        if (size > MAX_BODY) {
          reject(new Error("too large"));
          req.destroy();
        } else chunks.push(c);
      });
      req.on("end", () => resolve(Buffer.concat(chunks)));
      req.on("error", reject);
    });

  return async function handle(req, res) {
    const url = new URL(req.url || "/", "http://x");
    if (url.pathname !== prefix && !url.pathname.startsWith(`${prefix}/`)) return false;
    const route = url.pathname.slice(prefix.length).replace(/^\//, "");
    if (req.method === "OPTIONS") return send(res, 204, ""), true;
    if (!ready) return send(res, 503, { error: "not-set-up" }), true;

    // wake-up / health check (free hosts sleep when idle)
    if (route === "" && req.method === "GET") return send(res, 200, { ok: true }), true;

    if (route === "login" && req.method === "POST") {
      const now = Date.now();
      const ip = ipOf(req);
      const mine = (fails.get(ip) || []).filter((t) => now - t < 15 * 60_000);
      allFails = allFails.filter((t) => now - t < 60 * 60_000);
      if (mine.length >= MAX_FAILS_PER_IP || allFails.length >= MAX_FAILS_TOTAL)
        return send(res, 429, { error: "too-many-tries" }, { "Retry-After": "900" }), true;
      let body = {};
      try {
        body = JSON.parse((await readBody(req)).toString() || "{}");
      } catch {}
      // compare hashes: same length, constant time
      const ok = crypto.timingSafeEqual(sha256(String(body.password ?? "")), sha256(password));
      if (!ok) {
        mine.push(now);
        fails.set(ip, mine);
        allFails.push(now);
        // a little wait on every wrong try, so guessing is slow even within the limit
        await new Promise((r) => setTimeout(r, 800));
        return send(res, 401, { error: "wrong-password", left: Math.max(0, MAX_FAILS_PER_IP - mine.length) }), true;
      }
      fails.delete(ip);
      const exp = now + (body.remember ? REMEMBER_DAYS * 24 : SESSION_HOURS) * 3600_000;
      return send(res, 200, { session: sign({ exp }), expiresAt: exp }), true;
    }

    const auth = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!check(auth)) return send(res, 401, { error: "signed-out" }), true;

    if (route === "me" && req.method === "GET") return send(res, 200, { login: "owner", canWrite: true }), true;

    if (route === "github" || route.startsWith("github/")) {
      const path = route.slice("github".length).replace(/^\//, "");
      if (!ALLOWED.some(([m, re]) => m === req.method && re.test(path))) return send(res, 403, { error: "not-allowed" }), true;
      let body;
      if (req.method !== "GET") {
        try {
          body = await readBody(req);
        } catch {
          return send(res, 413, { error: "too-large" }), true;
        }
      }
      try {
        const gh = await fetchImpl(`${githubApi}/repos/${repo}${path ? `/${path}` : ""}${url.search}`, {
          method: req.method,
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${token}`,
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "rk-owner-api",
            ...(body ? { "Content-Type": "application/json" } : {}),
          },
          body,
        });
        return send(res, gh.status, (await gh.text()) || "{}"), true;
      } catch {
        return send(res, 502, { error: "github-unreachable" }), true;
      }
    }
    return send(res, 404, { error: "not-found" }), true;
  };
}

// run on its own
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const handle = createOwnerApi();
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
