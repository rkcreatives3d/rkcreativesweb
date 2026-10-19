// Prints what still needs real details before going live (runs before every build).
// While any sample value is left, the site tells search engines not to index it
// (see lib/launch.ts), so nothing breaks; this is just a reminder.
import fs from "node:fs";

const site = fs.readFileSync(new URL("../lib/site.ts", import.meta.url), "utf8");
const left = [];
if (/whatsapp:\s*"91?9{9,}"/.test(site)) left.push("WhatsApp number (site.whatsapp)");
if (/email:\s*"[^"]*@example\.com"/.test(site)) left.push("order email (site.email)");
if (/id:\s*"yourname@/.test(site)) left.push("UPI ID (site.upi.id)");

if (left.length) {
  console.log(`\n⚠  Not live-ready yet. Search engines are told not to index the site until you set, in lib/site.ts:`);
  for (const l of left) console.log(`   - ${l}`);
  console.log("");
} else console.log("✓ Launch details set: the site can be indexed.");
