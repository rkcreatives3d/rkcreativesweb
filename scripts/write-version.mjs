// Writes public/version.json with the commit being built, so the owner page
// can tell when a change it published is live (it polls this file).
// Render sets RENDER_GIT_COMMIT; GitHub Actions sets GITHUB_SHA.
import fs from "node:fs";
import { execSync } from "node:child_process";

let commit = process.env.RENDER_GIT_COMMIT || process.env.GITHUB_SHA || "";
if (!commit) {
  try {
    commit = execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {}
}
fs.writeFileSync("public/version.json", JSON.stringify({ commit, builtAt: new Date().toISOString() }) + "\n");
