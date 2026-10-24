import fs from "node:fs";
import type { Page } from "@playwright/test";

// A pretend GitHub for the owner-page tests: reads come from this checkout,
// writes are recorded instead of sent, so tests never touch the real repo.

export type Recorded = { blobs: string[]; tree: { path: string; sha: string | null }[]; message: string; refUpdated: boolean };

export async function mockGitHub(page: Page, { canWrite = true, files = ["models/vortex-vase.stl", "public/renders/vortex-vase/amber.webp"] } = {}) {
  const rec: Recorded = { blobs: [], tree: [], message: "", refUpdated: false };
  const blobs = new Map<string, string>();
  await page.route("https://api.github.com/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace(/^\/repos\/[^/]+\/[^/]+/, "");
    const json = (body: unknown, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (url.pathname === "/user") return json({ login: "rkcreatives3d" });
    if (path === "" && req.method() === "GET") return json({ permissions: { push: canWrite } });
    if (path.startsWith("/contents/")) {
      const file = decodeURIComponent(path.slice("/contents/".length));
      if (!fs.existsSync(file)) return json({ message: "Not Found" }, 404);
      return json({ content: fs.readFileSync(file).toString("base64"), sha: `sha-${file}` });
    }
    if (path === "/git/ref/heads/main") return json({ object: { sha: "head-1" } });
    if (path.startsWith("/git/commits/")) return json({ tree: { sha: "tree-1" } });
    if (path.startsWith("/git/trees/") && req.method() === "GET") return json({ tree: [...files, "content/products.json"].map((p) => ({ path: p, type: "blob" })) });
    if (path === "/git/blobs") {
      const sha = `blob-${blobs.size + 1}`;
      blobs.set(sha, (req.postDataJSON() as { content: string }).content);
      rec.blobs.push(sha);
      return json({ sha });
    }
    if (path === "/git/trees") {
      rec.tree = (req.postDataJSON() as { tree: Recorded["tree"] }).tree;
      return json({ sha: "tree-2" });
    }
    if (path === "/git/commits") {
      rec.message = (req.postDataJSON() as { message: string }).message;
      return json({ sha: "commit-2abcdef" });
    }
    if (path === "/git/refs/heads/main") {
      rec.refUpdated = true;
      return json({});
    }
    return json({ message: `unmocked ${req.method()} ${path}` }, 500);
  });
  /** What was committed to a path (decoded text), or null if it wasn't written. */
  const written = (p: string) => {
    const e = rec.tree.find((t) => t.path === p && t.sha);
    return e ? Buffer.from(blobs.get(e.sha!)!, "base64").toString("utf8") : null;
  };
  /** Raw bytes committed to a path. */
  const raw = (p: string) => {
    const e = rec.tree.find((t) => t.path === p && t.sha);
    return e ? Buffer.from(blobs.get(e.sha!)!, "base64") : null;
  };
  return { rec, written, raw };
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
