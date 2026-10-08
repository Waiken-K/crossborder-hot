// Pushes a Chrome DevTools capture JSON to a running trial preview without exposing DB credentials.
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

const file = process.argv[2];
if (!file) throw new Error("usage: node scripts/push-x-capture.ts <capture.json>");
const root = process.env.TRIAL_APP_SECRET?.trim() ?? "";
const preview = process.env.TRIAL_PREVIEW_URL?.trim().replace(/\/+$/, "") ?? "";
if (root.length < 32) throw new Error("TRIAL_APP_SECRET is missing or too short");
if (!/^https:\/\//.test(preview)) throw new Error("TRIAL_PREVIEW_URL must be the current https preview URL");

const body = JSON.parse(await readFile(path.resolve(file), "utf8")) as unknown;
const token = createHash("sha256").update(`${root}:ingest`).digest("hex");
const response = await fetch(`${preview}/api/ingest/items`, {
  method: "POST",
  headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
  body: JSON.stringify(body),
  signal: AbortSignal.timeout(30_000),
});
const text = await response.text();
if (!response.ok) throw new Error(`ingest failed (${response.status}): ${text.slice(0, 500)}`);
console.log(text);
