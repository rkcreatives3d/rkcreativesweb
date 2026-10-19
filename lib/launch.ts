import { site } from "./site";

// Things in lib/site.ts that still hold sample values. While any are left, the
// build prints a warning and search engines are asked not to index the site,
// so placeholder phone numbers and prices never end up on Google.

export function launchProblems() {
  const p: string[] = [];
  if (/^91?9{9,}$/.test(site.whatsapp)) p.push("site.whatsapp is still the sample number");
  if (site.email.endsWith("@example.com")) p.push("site.email is still orders@example.com");
  if (site.upi.id.startsWith("yourname")) p.push("site.upi.id is still the sample UPI ID");
  return p;
}

export const launchReady = launchProblems().length === 0;
