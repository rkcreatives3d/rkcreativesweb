import { REPO } from "./repo";

// A small GitHub REST client for the owner page. Two ways in:
//  - password: the owner signs in to the owner sign-in server
//    (scripts/owner-api.mjs), which holds the GitHub key and passes the calls
//    on. The "token" is then "session:<signed session>".
//  - GitHub key: the owner's own fine-grained token, straight to GitHub.
// Either way, nothing can be changed without the password or the key,
// whatever page someone manages to open.

const API = "https://api.github.com";
/** The owner sign-in server: NEXT_PUBLIC_OWNER_API at build time, else this site's own /api/owner. */
export const OWNER_API = (process.env.NEXT_PUBLIC_OWNER_API || "/api/owner").replace(/\/$/, "");
const SESSION = "session:";
const isSession = (t: string) => t.startsWith(SESSION);
const repoBase = (t: string) => (isSession(t) ? `${OWNER_API}/github` : `${API}/repos/${REPO.owner}/${REPO.name}`);

export class GitHubError extends Error {
  constructor(
    message: string,
    public status: number,
    /** password tries left before a 15-minute wait */
    public left?: number,
  ) {
    super(message);
  }
}

/**
 * Owner-server addresses end in "/" like every address on the site, so the
 * host never redirects them (a redirect can drop a POST's body). Addresses
 * ending in a file name (…/products.json) are the exception: they never
 * take a slash.
 */
function slashed(url: string) {
  if (!url.startsWith(OWNER_API)) return url;
  const [path, query] = url.split("?");
  const file = /\.[a-z0-9]+$/i.test(path.split("/").pop() ?? "");
  return `${path.endsWith("/") || file ? path : `${path}/`}${query ? `?${query}` : ""}`;
}

async function call<T>(token: string, url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(slashed(url), {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${isSession(token) ? token.slice(SESSION.length) : token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const body = (await res.json()) as { message?: string; error?: string };
      msg = body.message ?? body.error ?? msg;
    } catch {}
    throw new GitHubError(msg, res.status);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export type Ping = { state: "ok" | "not-set-up" | "unreachable"; canPublish: boolean; missing: string[] };

/** Is the owner sign-in server there (and awake), and which of its settings are missing? */
export async function ping(): Promise<Ping> {
  try {
    const res = await fetch(`${OWNER_API}/`, { cache: "no-store" });
    const body = (await res.json().catch(() => ({}))) as { canPublish?: boolean; missing?: string[] };
    const missing = body.missing ?? (res.ok ? [] : ["OWNER_PASSWORD", "GITHUB_TOKEN"]);
    if (res.ok) return { state: "ok", canPublish: body.canPublish ?? true, missing };
    return { state: res.status === 503 || res.status === 404 ? "not-set-up" : "unreachable", canPublish: false, missing };
  } catch {
    return { state: "unreachable", canPublish: false, missing: [] };
  }
}

/** Password sign-in: a session "token" for the other calls. Errors carry the server's reason. */
export async function passwordLogin(password: string, remember: boolean): Promise<string> {
  const res = await fetch(`${OWNER_API}/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password, remember }),
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as { session?: string; error?: string; left?: number };
  if (!res.ok || !body.session) throw new GitHubError(body.error ?? "failed", res.status, body.left);
  return SESSION + body.session;
}

/** Checks the token: who it belongs to, and whether it can write to the repo. */
export async function verify(token: string): Promise<{ login: string; canWrite: boolean }> {
  if (isSession(token)) return call<{ login: string; canWrite: boolean }>(token, `${OWNER_API}/me`);
  const repo = await call<{ permissions?: { push?: boolean } }>(token, repoBase(token));
  let login = "";
  try {
    login = (await call<{ login: string }>(token, `${API}/user`)).login;
  } catch {
    // fine-grained tokens limited to one repo may not read the profile; that's OK
  }
  return { login, canWrite: !!repo.permissions?.push };
}

const decode = (b64: string) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\n/g, "")), (c) => c.charCodeAt(0)));

/** A JSON file from a branch, with its blob sha (to notice changes made elsewhere). */
export async function readJSON<T>(token: string, path: string, ref: string = REPO.branch): Promise<{ data: T; sha: string }> {
  const f = await call<{ content: string; sha: string }>(token, `${repoBase(token)}/contents/${path}?ref=${ref}&t=${Date.now()}`);
  return { data: JSON.parse(decode(f.content)) as T, sha: f.sha };
}

/** Blob sha of a file on the branch right now (null if it doesn't exist). */
export async function shaOf(token: string, path: string): Promise<string | null> {
  try {
    return (await call<{ sha: string }>(token, `${repoBase(token)}/contents/${path}?ref=${REPO.branch}&t=${Date.now()}`)).sha;
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

/** Every file under these folders on a branch, with its blob sha. */
export async function listTree(token: string, prefixes: string[], branch: string = REPO.branch): Promise<{ path: string; sha: string }[]> {
  const ref = await call<{ object: { sha: string } }>(token, `${repoBase(token)}/git/ref/heads/${branch}`);
  const commit = await call<{ tree: { sha: string } }>(token, `${repoBase(token)}/git/commits/${ref.object.sha}`);
  const tree = await call<{ tree: { path: string; type: string; sha: string }[] }>(token, `${repoBase(token)}/git/trees/${commit.tree.sha}?recursive=1`);
  return tree.tree.filter((e) => e.type === "blob" && prefixes.some((p) => e.path.startsWith(p))).map(({ path, sha }) => ({ path, sha }));
}

/** Every file path under these folders on the branch (used to delete a product's files). */
export async function listFiles(token: string, prefixes: string[], branch: string = REPO.branch): Promise<string[]> {
  return (await listTree(token, prefixes, branch)).map((e) => e.path);
}

/** A file's bytes by its blob sha (works for files over GitHub's 1 MB contents limit). */
export async function readBlob(token: string, sha: string): Promise<Uint8Array<ArrayBuffer>> {
  const b = await call<{ content: string }>(token, `${repoBase(token)}/git/blobs/${sha}`);
  return Uint8Array.from(atob(b.content.replace(/\n/g, "")), (c) => c.charCodeAt(0));
}

/**
 * All changes as ONE commit on the branch (files written and deleted together,
 * so the site never sees half a change). Returns the new commit's sha.
 */
export async function commit(
  token: string,
  message: string,
  changes: FileChange[],
  onProgress?: (done: number, total: number) => void,
  branch: string = REPO.branch,
) {
  const ref = await call<{ object: { sha: string } }>(token, `${repoBase(token)}/git/ref/heads/${branch}`);
  const head = ref.object.sha;
  const parent = await call<{ tree: { sha: string } }>(token, `${repoBase(token)}/git/commits/${head}`);
  const entries: { path: string; mode: "100644"; type: "blob"; sha: string | null }[] = [];
  let done = 0;
  for (const c of changes) {
    if ("delete" in c) entries.push({ path: c.path, mode: "100644", type: "blob", sha: null });
    else {
      const bytes = typeof c.content === "string" ? new TextEncoder().encode(c.content) : c.content;
      const blob = await call<{ sha: string }>(token, `${repoBase(token)}/git/blobs`, {
        method: "POST",
        body: JSON.stringify({ content: toBase64(bytes), encoding: "base64" }),
      });
      entries.push({ path: c.path, mode: "100644", type: "blob", sha: blob.sha });
    }
    onProgress?.(++done, changes.length);
  }
  const tree = await call<{ sha: string }>(token, `${repoBase(token)}/git/trees`, {
    method: "POST",
    body: JSON.stringify({ base_tree: parent.tree.sha, tree: entries }),
  });
  const made = await call<{ sha: string }>(token, `${repoBase(token)}/git/commits`, {
    method: "POST",
    body: JSON.stringify({ message, tree: tree.sha, parents: [head] }),
  });
  await call(token, `${repoBase(token)}/git/refs/heads/${branch}`, { method: "PATCH", body: JSON.stringify({ sha: made.sha, force: false }) });
  return made.sha;
}
