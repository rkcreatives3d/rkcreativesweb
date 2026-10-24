// Copied to app/api/owner/[[...path]]/route.ts by scripts/setup-host.mjs on
// Vercel builds only: the owner sign-in server as a Vercel Function, at
// /api/owner on the site's own address. (Static builds can't have it.)
// Secrets: OWNER_PASSWORD and GITHUB_TOKEN in the Vercel project's settings.
import { createOwnerApi } from "@/scripts/owner-api.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// one per warm function instance: wrong-password counts carry over between requests
const api = createOwnerApi();

async function handle(request: Request) {
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  return (await api(request, ip)) ?? Response.json({ error: "not-found" }, { status: 404 });
}

export { handle as GET, handle as POST, handle as PATCH, handle as OPTIONS };
