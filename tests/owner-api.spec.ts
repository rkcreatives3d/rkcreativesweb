import http from "node:http";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import type { AddressInfo } from "node:net";
import { expect, test } from "@playwright/test";

// The owner sign-in server (scripts/owner-api.mjs), run for real as its own
// process, in front of a pretend GitHub that records what it was asked.

test.skip(({ isMobile }) => isMobile, "server tests run once");

type Call = { url: string; method: string; auth: string };

const freePort = () =>
  new Promise<number>((r) => {
    const s = http.createServer().listen(0, () => {
      const { port } = s.address() as AddressInfo;
      s.close(() => r(port));
    });
  });

async function start(extra: Record<string, string>) {
  const calls: Call[] = [];
  const github = http.createServer((req, res) => {
    calls.push({ url: req.url ?? "", method: req.method ?? "", auth: String(req.headers.authorization) });
    res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ ok: true }));
  });
  await new Promise<void>((r) => github.listen(0, r));
  const port = await freePort();
  const proc = spawn(process.execPath, ["scripts/owner-api.mjs"], {
    env: {
      PATH: process.env.PATH,
      PORT: String(port),
      GITHUB_API: `http://127.0.0.1:${(github.address() as AddressInfo).port}`,
      GITHUB_RAW: `http://127.0.0.1:${(github.address() as AddressInfo).port}/raw`,
      ...extra,
    } as unknown as NodeJS.ProcessEnv,
    stdio: ["ignore", "pipe", "inherit"],
  });
  await new Promise<void>((r) => proc.stdout!.on("data", (d: Buffer) => String(d).includes("port") && r()));
  const base = `http://127.0.0.1:${port}/api/owner`;
  const call = (path: string, init: RequestInit = {}) => fetch(base + path, init);
  const login = (password: string) =>
    call("/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
  return {
    calls,
    call,
    login,
    close: () => {
      proc.kill();
      github.close();
    },
  };
}

const env = { OWNER_PASSWORD: "correct horse", GITHUB_TOKEN: "ghp_secret", GITHUB_REPO: "shop/site" };

test("says when it isn't set up, and which settings are missing (names only)", async () => {
  const s = await start({});
  const res = await s.call("/");
  expect(res.status).toBe(503);
  expect(await res.json()).toEqual({ error: "not-set-up", missing: ["OWNER_PASSWORD", "GITHUB_TOKEN"] });
  s.close();
});

test("the password alone signs in and reads the shop; publishing waits for the GitHub key", async () => {
  const s = await start({ OWNER_PASSWORD: "pw only" });
  expect(await (await s.call("/")).json()).toEqual({ ok: true, canPublish: false, missing: ["GITHUB_TOKEN"] });
  const { session } = (await (await s.login("pw only")).json()) as { session: string };
  const auth = { Authorization: `Bearer ${session}` };
  // read from the public repo's raw files, with the same blob id GitHub uses
  const file = (await (await s.call("/github/contents/content/shop.json?ref=main", { headers: auth })).json()) as { content: string; sha: string };
  expect(Buffer.from(file.content, "base64").toString()).toBe('{"ok":true}');
  expect(file.sha).toBe(createHash("sha1").update('blob 11\0{"ok":true}').digest("hex"));
  expect(s.calls.at(-1)!.url).toBe("/raw/rkcreatives3d/rkcreativesweb/main/content/shop.json");
  const save = await s.call("/github/git/blobs", { method: "POST", headers: auth, body: "{}" });
  expect(save.status).toBe(503);
  expect(((await save.json()) as { error: string }).error).toBe("no-github-token");
  s.close();
});

test("right password → a session that opens the GitHub calls, with the server's key", async () => {
  const s = await start(env);
  expect((await s.call("/")).status).toBe(200);
  const res = await s.login("correct horse");
  expect(res.status).toBe(200);
  const { session } = (await res.json()) as { session: string };
  const auth = { Authorization: `Bearer ${session}` };
  expect((await s.call("/me", { headers: auth })).status).toBe(200);
  expect((await s.call("/github/contents/content/products.json?ref=main", { headers: auth })).status).toBe(200);
  expect(s.calls.at(-1)).toEqual({ url: "/repos/shop/site/contents/content/products.json?ref=main", method: "GET", auth: "Bearer ghp_secret" });
  // the GitHub key never comes back to the browser
  expect(JSON.stringify(await (await s.login("correct horse")).json())).not.toContain("ghp_secret");
  s.close();
});

test("no session, a tampered one, or a disallowed GitHub call is refused", async () => {
  const s = await start(env);
  expect((await s.call("/me")).status).toBe(401);
  expect((await s.call("/github/contents/x.json")).status).toBe(401);
  const { session } = (await (await s.login("correct horse")).json()) as { session: string };
  const [body, mac] = session.split(".");
  const forged = `${Buffer.from(JSON.stringify({ exp: Date.now() + 9e12 })).toString("base64url")}.${mac}`;
  expect((await s.call("/me", { headers: { Authorization: `Bearer ${forged}` } })).status).toBe(401);
  expect(body).toBeTruthy();
  const auth = { Authorization: `Bearer ${session}` };
  // only the owner page's own calls get through
  expect((await s.call("/github/collaborators", { headers: auth })).status).toBe(403);
  expect((await s.call("/github/contents/x.json", { method: "PATCH", headers: auth, body: "{}" })).status).toBe(403);
  expect((await s.call("/github/git/refs/heads/main", { method: "PATCH", headers: auth, body: "{}" })).status).toBe(200);
  expect(s.calls.every((c) => !c.url.includes("collaborators"))).toBe(true);
  s.close();
});

test("wrong passwords count down, then lock out for a while", async () => {
  test.slow(); // each wrong try is slowed down on purpose
  const s = await start(env);
  for (let left = 4; left >= 0; left--) {
    const res = await s.login("guess");
    expect(res.status).toBe(401);
    expect(((await res.json()) as { left: number }).left).toBe(left);
  }
  expect((await s.login("guess")).status).toBe(429);
  // locked even with the right password, until the wait is over
  expect((await s.login("correct horse")).status).toBe(429);
  s.close();
});
