// A secret-free, compact report for the GitHub Actions summary after each trial cycle.
import { closeDb, sql } from "@aihot/backend/db";

const [counts] = await sql<{
  articles_total: number; articles_6h: number; eligible_total: number; selected_total: number;
  failed_articles: number; failing_sources: number; model_calls_24h: number; model_cost_24h: string | null;
}[]>`
  SELECT
    (SELECT count(*)::int FROM articles) AS articles_total,
    (SELECT count(*)::int FROM articles WHERE discovered_at > now() - interval '6 hours') AS articles_6h,
    (SELECT count(*)::int FROM publications WHERE eligible AND visibility = 'public') AS eligible_total,
    (SELECT count(*)::int FROM publications WHERE selected AND visibility = 'public') AS selected_total,
    (SELECT count(*)::int FROM articles WHERE processing_state = 'failed') AS failed_articles,
    (SELECT count(*)::int FROM sources WHERE enabled AND health = 'failing') AS failing_sources,
    (SELECT count(*)::int FROM receipt_attempts WHERE service = 'llm' AND started_at > now() - interval '24 hours') AS model_calls_24h,
    (SELECT sum(cost)::text FROM receipt_attempts WHERE service = 'llm' AND started_at > now() - interval '24 hours') AS model_cost_24h`;

const recentSources = await sql<{ name: string; health: string; last_ok_at: Date | null; last_error: string | null }[]>`
  SELECT name, health, last_ok_at, left(last_error, 120) AS last_error
  FROM sources WHERE enabled ORDER BY last_fetch_at DESC NULLS LAST, name LIMIT 12`;
const failures = await sql<{ job: string; error: string | null }[]>`
  SELECT job, left(error, 160) AS error FROM job_runs
  WHERE status = 'failed' AND started_at > now() - interval '24 hours'
  ORDER BY started_at DESC LIMIT 8`;

const c = counts!;
console.log(JSON.stringify({ checkedAt: new Date().toISOString(), counts: c, recentSources, failures }, null, 2));
console.log("\n## 跨境热点 · 试运行报告\n");
console.log(`- 素材：总计 ${c.articles_total}，最近 6 小时新增 ${c.articles_6h}`);
console.log(`- 公共池：${c.eligible_total}；精选：${c.selected_total}`);
console.log(`- 最近 24 小时模型调用：${c.model_calls_24h}；记录成本：${c.model_cost_24h ?? "供应商未返回"}`);
console.log(`- 异常：处理失败 ${c.failed_articles}，失败信源 ${c.failing_sources}，最近失败任务 ${failures.length}`);
console.log("\n### 信源状态\n");
for (const source of recentSources) console.log(`- ${source.name}: ${source.health}${source.last_ok_at ? `（最近成功 ${source.last_ok_at.toISOString()}）` : "（尚未成功）"}${source.last_error ? ` — ${source.last_error}` : ""}`);
if (failures.length) {
  console.log("\n### 最近失败\n");
  for (const failure of failures) console.log(`- ${failure.job}: ${failure.error ?? "无错误详情"}`);
}
await closeDb();
