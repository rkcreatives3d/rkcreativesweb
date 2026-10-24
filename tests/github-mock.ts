import fs from "node:fs";
import type { Page } from "@playwright/test";

// A pretend GitHub for the owner-page tests: reads come from this checkout,
// writes are recorded instead of sent, so tests never touch the real repo.

export type Recorded = {
  blobs: string[];
  /** every tree entry written, across all commits */
  tree: { path: string; sha: string | null }[];
  message: string;
  refUpdated: boolean;
  /** branches moved, in order */
  branches: string[];
};
export type InboxItem = { id: string; name: string; rating: number; text: string; product?: string; city?: string; date: string; photo?: Buffer };

/**
 * `password`: also play the owner sign-in server (scripts/owner-api.mjs) at
 * /api/owner with this password; otherwise it's "not set up" there, and the
 * page offers the GitHub key.
 */
export async function mockGitHub(
  page: Page,
  {
    canWrite = true,
    files = ["models/vortex-vase.stl", "public/renders/vortex-vase/amber.webp"],
    password = "",
    canPublish = true,
    inbox = [] as InboxItem[],
  } = {},
) {
  const rec: Recorded = { blobs: [], tree: [], message: "", refUpdated: false, branches: [] };
  // the reviews inbox branch: inbox/<id>.json (+ .jpg)
  const inboxFiles = inbox.flatMap((r, i) => {
    const { photo, ...entry } = r;
    return [
      { path: `inbox/${r.id}.json`, sha: `inbox-json-${i}`, bytes: Buffer.from(JSON.stringify({ ...entry, photo: !!photo })) },
      ...(photo ? [{ path: `inbox/${r.id}.jpg`, sha: `inbox-jpg-${i}`, bytes: photo }] : []),
    ];
  });
  const blobs = new Map<string, string>();
  let tries = 5;
  await page.route("**/api/owner/**", async (route) => {
    const req = route.request();
    const json = (body: unknown, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    const rest = new URL(req.url()).pathname.replace(/^.*\/api\/owner\/?/, "").replace(/\/+$/, "");
    if (!password) return json({ error: "not-set-up", missing: ["OWNER_PASSWORD", "GITHUB_TOKEN"] }, 503);
    if (rest === "") return json({ ok: true, canPublish, missing: canPublish ? [] : ["GITHUB_TOKEN"] });
    if (rest === "login") {
      if ((req.postDataJSON() as { password: string }).password === password) return json({ session: "test-session" });
      return json({ error: "wrong-password", left: --tries }, 401);
    }
    if (req.headers().authorization !== "Bearer test-session") return json({ error: "signed-out" }, 401);
    if (rest === "me") return json({ login: "owner", canWrite: true });
    if (rest.startsWith("github")) {
      const path = `/${rest.slice("github".length).replace(/^\//, "")}`.replace(/\/$/, "");
      if (!canPublish && !path.startsWith("/contents/")) return json({ error: "no-github-token" }, 503);
      return repo(route, path);
    }
    return json({}, 404);
  });
  await page.route("https://api.github.com/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/user") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ login: "rkcreatives3d" }) });
    return repo(route, url.pathname.replace(/^\/repos\/[^/]+\/[^/]+/, ""));
  });
  async function repo(route: import("@playwright/test").Route, path: string) {
    const req = route.request();
    const json = (body: unknown, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (path === "" && req.method() === "GET") return json({ permissions: { push: canWrite } });
    if (path.startsWith("/contents/")) {
      const file = decodeURIComponent(path.slice("/contents/".length));
      if (!fs.existsSync(file)) return json({ message: "Not Found" }, 404);
      return json({ content: fs.readFileSync(file).toString("base64"), sha: `sha-${file}` });
    }
    if (path === "/git/ref/heads/main") return json({ object: { sha: "head-1" } });
    if (path === "/git/ref/heads/reviews-inbox") return inbox.length ? json({ object: { sha: "inbox-head" } }) : json({ message: "Not Found" }, 404);
    if (path.startsWith("/git/commits/")) return json({ tree: { sha: path.endsWith("inbox-head") ? "inbox-tree" : "tree-1" } });
    if (path.startsWith("/git/trees/inbox-tree")) return json({ tree: inboxFiles.map((f) => ({ path: f.path, type: "blob", sha: f.sha })) });
    if (path.startsWith("/git/trees/") && req.method() === "GET") return json({ tree: [...files, "content/products.json"].map((p) => ({ path: p, type: "blob", sha: "x" })) });
    if (path.startsWith("/git/blobs/") && req.method() === "GET") {
      const f = inboxFiles.find((x) => x.sha === path.slice("/git/blobs/".length));
      return f ? json({ content: f.bytes.toString("base64"), encoding: "base64" }) : json({ message: "Not Found" }, 404);
    }
    if (path === "/git/blobs") {
      const sha = `blob-${blobs.size + 1}`;
      blobs.set(sha, (req.postDataJSON() as { content: string }).content);
      rec.blobs.push(sha);
      return json({ sha });
    }
    if (path === "/git/trees") {
      rec.tree.push(...(req.postDataJSON() as { tree: Recorded["tree"] }).tree);
      return json({ sha: "tree-2" });
    }
    if (path === "/git/commits") {
      rec.message = (req.postDataJSON() as { message: string }).message;
      return json({ sha: "commit-2abcdef" });
    }
    if (path.startsWith("/git/refs/heads/")) {
      rec.branches.push(path.slice("/git/refs/heads/".length));
      if (path.endsWith("/main")) rec.refUpdated = true;
      return json({});
    }
    return json({ message: `unmocked ${req.method()} ${path}` }, 500);
  }
  /** What was committed to a path (decoded text), or null if it wasn't written. */
  const written = (p: string) => {
    const e = rec.tree.findLast((t) => t.path === p && t.sha);
    return e ? Buffer.from(blobs.get(e.sha!)!, "base64").toString("utf8") : null;
  };
  /** Raw bytes committed to a path. */
  const raw = (p: string) => {
    const e = rec.tree.findLast((t) => t.path === p && t.sha);
    return e ? Buffer.from(blobs.get(e.sha!)!, "base64") : null;
  };
  return { rec, written, raw };
}

/** A binary STL with `n` small triangles (about 50 bytes each). */
export function bigSTL(n: number) {
  const buf = Buffer.alloc(84 + n * 50);
  buf.writeUInt32LE(n, 80);
  for (let i = 0; i < n; i++) {
    const o = 84 + i * 50 + 12;
    const x = (i % 300) / 10, y = Math.floor(i / 300) / 10;
    [x, y, 0, x + 0.1, y, 0, x, y + 0.1, 0.05].forEach((v, k) => buf.writeFloatLE(v, o + k * 4));
  }
  return buf;
}

/** A tiny cube as an ASCII STL file. */
export function cubeSTL() {
  const v = [
    [0, 0, 0], [10, 0, 0], [10, 10, 0], [0, 10, 0],
    [0, 0, 10], [10, 0, 10], [10, 10, 10], [0, 10, 10],
  ];
  const faces = [[0, 2, 1], [0, 3, 2], [4, 5, 6], [4, 6, 7], [0, 1, 5], [0, 5, 4], [1, 2, 6], [1, 6, 5], [2, 3, 7], [2, 7, 6], [3, 0, 4], [3, 4, 7]];
  const body = faces.map((f) => `facet normal 0 0 0\nouter loop\n${f.map((i) => `vertex ${v[i].join(" ")}`).join("\n")}\nendloop\nendfacet`).join("\n");
  return Buffer.from(`solid cube\n${body}\nendsolid cube\n`);
}

/** A tiny valid JPEG (1×1 px). */
export const TINY_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==",
  "base64",
);
