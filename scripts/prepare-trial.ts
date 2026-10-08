// Applies conservative trial-only limits after the ordinary migration and seed.
import { closeDb, sql } from "@aihot/backend/db";

if (process.env.TRIAL_MODE !== "true") throw new Error("prepare-trial.ts requires TRIAL_MODE=true");

await sql`
  UPDATE budgets SET per_minute = limits.per_minute, per_hour = limits.per_hour,
    per_day = limits.per_day, note = limits.note, updated_at = now()
  FROM (VALUES
    ('llm'::text, 12, 60, 180, '试运行安全阀：默认模型请求数'),
    ('embedding', 0, 0, 0, '试运行未启用向量服务'),
    ('socialdata', 0, 0, 0, 'X 由本机 Chrome 采集'),
    ('jina', 0, 0, 0, '试运行未启用付费正文兜底'),
    ('dajiala', 0, 0, 0, '试运行未启用付费公众号采集'),
    ('zhipu', 0, 0, 0, '试运行只使用默认模型'),
    ('deepseek', 0, 0, 0, '试运行只使用默认模型'),
    ('dashscope', 0, 0, 0, '试运行只使用默认模型'),
    ('mimo', 0, 0, 0, '试运行只使用默认模型')
  ) AS limits(service, per_minute, per_hour, per_day, note)
  WHERE budgets.service = limits.service`;

// A fresh trial should sample history, not spend its first cycle processing a large archive.
await sql`
  UPDATE sources
  SET config = jsonb_set(config, '{_aihot,initialBackfillLimit}', '3'::jsonb, true), updated_at = now()
  WHERE enabled AND last_fetch_at IS NULL AND config #> '{_aihot,initialBackfillLimit}' IS NOT NULL`;

const [summary] = await sql<{ enabled_sources: number; llm_daily_limit: number }[]>`
  SELECT (SELECT count(*)::int FROM sources WHERE enabled) AS enabled_sources,
         (SELECT per_day FROM budgets WHERE service = 'llm') AS llm_daily_limit`;
console.log(JSON.stringify({ ok: true, ...summary }));
await closeDb();
