import { REPO } from "./repo";

// A small GitHub REST client for the owner page. Every call carries the
// owner's personal access token: without one that can write to the repo,
// nothing can be changed, whatever page someone manages to open.

const API = "https://api.github.com";
const base = `${API}/repos/${REPO.owner}/${REPO.name}`;

export class GitHubError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function call<T>(token: string, url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      msg = ((await res.json()) as { message?: string }).message ?? msg;
    } catch {}
    throw new GitHubError(msg, res.status);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

/** Checks the token: who it belongs to, and whether it can write to the repo. */
export async function verify(token: string): Promise<{ login: string; canWrite: boolean }> {
  const repo = await call<{ permissions?: { push?: boolean } }>(token, base);
  let login = "";
  try {
    login = (await call<{ login: string }>(token, `${API}/user`)).login;
  } catch {
    // fine-grained tokens limited to one repo may not read the profile; that's OK
  }
  return { login, canWrite: !!repo.permissions?.push };
}

const decode = (b64: string) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\n/g, "")), (c) => c.charCodeAt(0)));

/** A JSON file from the branch, with its blob sha (to notice changes made elsewhere). */
export async function readJSON<T>(token: string, path: string): Promise<{ data: T; sha: string }> {
  const f = await call<{ content: string; sha: string }>(token, `${base}/contents/${path}?ref=${REPO.branch}&t=${Date.now()}`);
  return { data: JSON.parse(decode(f.content)) as T, sha: f.sha };
}

/** Blob sha of a file on the branch right now (null if it doesn't exist). */
export async function shaOf(token: string, path: string): Promise<string | null> {
  try {
    return (await call<{ sha: string }>(token, `${base}/contents/${path}?ref=${REPO.branch}&t=${Date.now()}`)).sha;
  } catch (e) {
    if (e instanceof GitHubError && e.status === 404) return null;
    throw e;
  }
}

function toBase64(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export type FileChange = { path: string; content: string | Uint8Array } | { path: string; delete: true };

/** Every file path under these folders on the branch (used to delete a product's files). */
export async function listFiles(token: string, prefixes: string[]): Promise<string[]> {
  const ref = await call<{ object: { sha: string } }>(token, `${base}/git/ref/heads/${REPO.branch}`);
  const commit = await call<{ tree: { sha: string } }>(token, `${base}/git/commits/${ref.object.sha}`);
  const tree = await call<{ tree: { path: string; type: string }[] }>(token, `${base}/git/trees/${commit.tree.sha}?recursive=1`);
  return tree.tree.filter((e) => e.type === "blob" && prefixes.some((p) => e.path.startsWith(p))).map((e) => e.path);
}

/**
 * All changes as ONE commit on the branch (files written and deleted together,
 * so the site never sees half a change). Returns the new commit's sha.
 */
export async function commit(token: string, message: string, changes: FileChange[], onProgress?: (done: number, total: number) => void) {
  const ref = await call<{ object: { sha: string } }>(token, `${base}/git/ref/heads/${REPO.branch}`);
  const head = ref.object.sha;
  const parent = await call<{ tree: { sha: string } }>(token, `${base}/git/commits/${head}`);
  const entries: { path: string; mode: "100644"; type: "blob"; sha: string | null }[] = [];
  let done = 0;
  for (const c of changes) {
    if ("delete" in c) entries.push({ path: c.path, mode: "100644", type: "blob", sha: null });
    else {
      const bytes = typeof c.content === "string" ? new TextEncoder().encode(c.content) : c.content;
      const blob = await call<{ sha: string }>(token, `${base}/git/blobs`, {
        method: "POST",
        body: JSON.stringify({ content: toBase64(bytes), encoding: "base64" }),
      });
      entries.push({ path: c.path, mode: "100644", type: "blob", sha: blob.sha });
    }
    onProgress?.(++done, changes.length);
  }
  const tree = await call<{ sha: string }>(token, `${base}/git/trees`, {
    method: "POST",
    body: JSON.stringify({ base_tree: parent.tree.sha, tree: entries }),
  });
  const made = await call<{ sha: string }>(token, `${base}/git/commits`, {
    method: "POST",
    body: JSON.stringify({ message, tree: tree.sha, parents: [head] }),
  });
  await call(token, `${base}/git/refs/heads/${REPO.branch}`, { method: "PATCH", body: JSON.stringify({ sha: made.sha, force: false }) });
  return made.sha;
}
