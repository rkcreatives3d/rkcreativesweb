// Types for owner-api.mjs (plain JS so Node can run it directly).
export function createOwnerApi(opts?: {
  env?: Record<string, string | undefined>;
  prefix?: string;
  fetchImpl?: typeof fetch;
  githubApi?: string;
}): (request: Request, ip?: string) => Promise<Response | null>;
export function toNodeHandler(handle: (request: Request, ip?: string) => Promise<Response | null>): (req: unknown, res: unknown) => Promise<boolean>;
