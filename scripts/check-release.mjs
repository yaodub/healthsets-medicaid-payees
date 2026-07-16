// Mechanical publication gate. `npm run build:release` fails unless the synced
// bundle is anchored to a real data release AND carries zero citation debt.
// The default `build` stays available for dev; deploys must use build:release.
import { readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync("public/data/manifest.json", "utf8"));
const problems = [];
if (!manifest.publishable) {
  problems.push(`data release is "${manifest.data_release}" — publishable builds require a tagged release`);
}
if (manifest.citation_debt > 0) {
  problems.push(`${manifest.citation_debt} named entity families still carry needs_citation=true`);
}
if (problems.length) {
  console.error("RELEASE GATE FAILED:");
  for (const p of problems) console.error("  - " + p);
  process.exit(1);
}
console.log(`release gate ok: ${manifest.data_release}, citation debt 0`);
