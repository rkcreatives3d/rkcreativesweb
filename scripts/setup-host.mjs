// Runs before every build. On Vercel (VERCEL=1), adds the owner sign-in
// server as a Vercel Function (app/api/owner/[[...path]]/route.ts, from
// scripts/vercel/owner-route.ts); next.config.ts then builds normally instead
// of a static export, and every page is still prerendered. Elsewhere it makes
// sure the function isn't there, so the static export works.
import fs from "node:fs";

const dest = "app/api/owner/[[...path]]/route.ts";
if (process.env.VERCEL) {
  fs.mkdirSync("app/api/owner/[[...path]]", { recursive: true });
  fs.copyFileSync("scripts/vercel/owner-route.ts", dest);
  console.log("Vercel: owner sign-in at /api/owner");
} else if (fs.existsSync("app/api")) {
  fs.rmSync("app/api", { recursive: true, force: true });
}
