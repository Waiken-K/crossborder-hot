// External collection reports (docs/sources.md). Same identity rules and timeline
// rule as every other entrance: old or future-dated items and explicit backfill never count as
// today's news and are never pushed. Unknown sources are created isolated, awaiting an operator.
import { sql } from "../db.ts";
import { upsertMaterial, type XPostData } from "../content/materials.ts";
import { queueProcessing } from "../jobs/content.ts";
import { normalizeUrl } from "../lib/url.ts";

export const MAX_ITEMS = 50;

export class IngestError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface ItemIn {
  title?: unknown;
  url?: unknown;
  publishedAt?: unknown;
  author?: unknown;
  language?: unknown;
  excerpt?: unknown;
  bodyText?: unknown;
  xPost?: unknown;
  raw?: { _aihot?: { backfill?: boolean; baseline?: boolean } } & Record<string, unknown>;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function optionalText(value: unknown, max: number): string | null {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;
}

/** The small, explicit X shape accepted from a trusted collector; arbitrary browser DOM is never stored as x_post. */
function parseXPost(value: unknown, index: number): XPostData | null {
  if (value === undefined || value === null) return null;
  if (!isObject(value)) throw new IngestError(400, `items[${index}].xPost must be an object`);
  const tweetId = optionalText(value.tweetId, 32) ?? "";
  const handle = optionalText(value.handle, 32)?.replace(/^@/, "") ?? "";
  const text = optionalText(value.text, 50_000) ?? "";
  if (!/^\d{1,32}$/.test(tweetId) || !/^[A-Za-z0-9_]{1,15}$/.test(handle) || !text) {
    throw new IngestError(400, `items[${index}].xPost requires a numeric tweetId, valid handle and text`);
  }
  return {
    tweetId,
    handle,
    text,
    authorName: optionalText(value.authorName, 200) ?? `@${handle}`,
    avatarUrl: optionalText(value.avatarUrl, 2_000),
    lang: optionalText(value.lang, 32),
    replyTo: optionalText(value.replyTo, 32),
  };
}

export async function ingestItems(body: unknown): Promise<{ ok: true; created: number }> {
  if (!isObject(body)) throw new IngestError(400, "request body must be an object");
  const sourceId = typeof body.sourceId === "string" ? body.sourceId.trim() : "";
  const items = Array.isArray(body.items) ? (body.items as ItemIn[]) : [];
  if (!sourceId || !items.length) throw new IngestError(400, "sourceId and items[] required");
  if (items.length > MAX_ITEMS) throw new IngestError(413, `items[] exceeds max ${MAX_ITEMS} per request`);
  // Validate the entire batch before even updating its source: a malformed later item must not
  // leave earlier items stored. Objects missing a title or URL still follow the documented skip.
  const xPosts = new Map<number, XPostData | null>();
  for (const [index, item] of items.entries()) {
    if (!isObject(item)) throw new IngestError(400, `items[${index}] must be an object`);
    xPosts.set(index, parseXPost(item.xPost, index));
  }

  const [source] = await sql<{ id: string; participation_mode: string; enabled: boolean }[]>`
    INSERT INTO sources (id, name, kind, config, tier, participation_mode, interval_minutes, enabled, health, tags)
    VALUES (${sourceId.slice(0, 120)}, ${typeof body.sourceName === "string" && body.sourceName.trim() ? body.sourceName.trim().slice(0, 200) : sourceId.slice(0, 120)},
            'external', '{}'::jsonb, 'T2', 'isolated', 1440, true, 'ok', ${["ingest:auto-created"]})
    ON CONFLICT (id) DO UPDATE SET last_ok_at = now() WHERE sources.enabled
    RETURNING id, participation_mode, enabled`;
  if (!source) throw new IngestError(409, "source paused");

  const seen = new Set<string>();
  let created = 0;
  for (const [index, it] of items.entries()) {
    const title = typeof it.title === "string" ? it.title.trim() : "";
    const rawUrl = typeof it.url === "string" ? it.url.trim() : "";
    if (!title || !rawUrl) continue;
    let url: string | null = null;
    try {
      url = normalizeUrl(rawUrl);
    } catch {
      url = null;
    }
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const published = typeof it.publishedAt === "string" ? new Date(it.publishedAt) : null;
    const flags = it.raw?._aihot ?? {};
    const xPost = xPosts.get(index) ?? null;
    const bodyText = optionalText(it.bodyText, 100_000) ?? xPost?.text ?? null;
    const res = await upsertMaterial({
      sourceId: source!.id,
      url,
      title,
      author: typeof it.author === "string" ? it.author.slice(0, 200) : null,
      language: optionalText(it.language, 32),
      publishedAt: published && Number.isFinite(published.getTime()) ? published : null,
      excerpt: optionalText(it.excerpt, 2_000),
      bodyText,
      bodyStatus: bodyText ? "ok" : "pending",
      xPost,
      raw: it.raw ?? null,
      via: "ingest",
      backfill: flags.backfill ? "reported-backfill" : flags.baseline ? "reported-baseline" : null,
    });
    if (res.created) created += 1;
    if (res.created || res.revised) await queueProcessing(res.articleId);
  }
  await sql`UPDATE sources SET last_fetch_at = now(), last_ok_at = now() WHERE id = ${source!.id}`;
  await sql`INSERT INTO ingest_events (client, kind, status, summary) VALUES ('ingest-items', 'items', 'ok', ${sql.json({ sourceId: source!.id, received: items.length, created })})`;
  return { ok: true, created };
}
