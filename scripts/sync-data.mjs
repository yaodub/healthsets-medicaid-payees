// Dev-only: copy the newest export bundle from the parent workspace. Fails
// with a clear message when the parent isn't present (public clones should
// set VITE_DATA_BASE to the published dataset instead).
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";

const root = "../../data/exports/healthsets-medicaid-payees";
if (!existsSync(root)) {
  console.error(
    "sync-data is for development inside the healthsets workspace.\n" +
    "For a standalone clone, point VITE_DATA_BASE at the published dataset (see README)."
  );
  process.exit(1);
}
const releases = readdirSync(root).sort();
const release = releases[releases.length - 1];
rmSync("public/data", { recursive: true, force: true });
mkdirSync("public/data", { recursive: true });
cpSync(`${root}/${release}`, "public/data", { recursive: true });
console.log(`synced bundle: ${release}`);
