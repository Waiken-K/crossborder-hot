// Generates the one secret a trial needs and shows the deterministic credentials derived from it.
// Nothing is written to disk. Put only TRIAL_APP_SECRET in GitHub Actions secrets.
import { createHash, randomBytes } from "node:crypto";

const root = process.argv[2]?.trim() || randomBytes(32).toString("hex");
if (root.length < 32) throw new Error("trial app secret must contain at least 32 characters");

const derive = (purpose: string) => createHash("sha256").update(`${root}:${purpose}`).digest("hex");

console.log(`TRIAL_APP_SECRET=${root}`);
console.log(`TRIAL_ADMIN_PASSWORD=${derive("admin").slice(0, 24)}`);
console.log(`TRIAL_INGEST_TOKEN=${derive("ingest")}`);
console.log("Save the first line as a GitHub Actions secret. Keep the other values private.");
