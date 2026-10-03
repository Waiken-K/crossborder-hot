import { data as withHeaders, Link, useLoaderData } from "react-router";
import type { FeedItemSummary } from "@aihot/contracts/site";
import type { Route } from "./+types/guides";
import { SITE } from "@aihot/industry/site";
import { apiGet, releaseBoundCache } from "../lib/api.server";
import { breadcrumbLd, pageMeta } from "../lib/seo";
import { DayList } from "../features/feed/DayList";
import { EmptyState, MoreLink } from "../components/ui/Page";
import { IconCheck, IconChevronRight } from "../components/icons";

interface TopicSummary {
  slug: string;
  name: string;
  definition: string;
  total: number;
}

interface GuideTopicPage {
  topic: TopicSummary;
  items: FeedItemSummary[];
  refreshAt: string | null;
}

const SECTIONS = [
  { title: "账户与资金", note: "开户、收款、ACH、港卡和券商入金", slugs: ["wise", "us-banking", "hk-banking", "funding-paths"] },
  { title: "税务身份", note: "ITIN、CRS、税务居民与常见税表", slugs: ["itin", "crs", "tax-residency", "tax-forms"] },
  { title: "海外通信", note: "eSIM、保号、漫游和短信收码", slugs: ["esim", "keep-number", "sms-roaming"] },
  { title: "验证与风险", note: "身份核验、规则变化和异常处置", slugs: ["kyc", "rule-changes", "risk-alerts", "official-guidance"] },
] as const;

export async function loader({ request }: Route.LoaderArgs) {
  const upstream = new Headers();
  const [guides, directory] = await Promise.all([
    apiGet<GuideTopicPage>("/api/site/topics/practical-guides?page=1", { signal: request.signal, responseHeaders: upstream }),
    apiGet<{ topics: TopicSummary[] }>("/api/site/topics", { signal: request.signal }),
  ]);
  const topics = new Map(directory.topics.map((topic) => [topic.slug, topic]));
  const sections = SECTIONS.map((section) => ({
    ...section,
    topics: section.slugs.map((slug) => topics.get(slug)).filter((topic): topic is TopicSummary => !!topic),
  }));
  return withHeaders({ guides, sections }, { headers: releaseBoundCache(guides.refreshAt, 60, Date.now(), upstream) });
}

export function meta() {
  return pageMeta({
    title: "实用避坑",
    description: "跨境账户、ITIN、CRS、美卡、资金路径与海外通信的可核验实操信息；标明适用条件、时效和原始来源。",
    path: "/guides",
    image: "/og/pages/topics.png",
    jsonLd: breadcrumbLd([{ name: SITE.name, path: "/" }, { name: "实用避坑", path: "/guides" }]),
  });
}

export function headers({ loaderHeaders }: Route.HeadersArgs) {
  return loaderHeaders;
}

export default function GuidesPage() {
  const { guides, sections } = useLoaderData<typeof loader>();
  return (
    <div className="pb-10">
      <header className="rounded-card border border-line bg-surface px-5 py-6 shadow-card sm:px-7 sm:py-7 lg:mt-1">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-[12px] font-semibold text-accent dark:bg-accent-soft">
          <IconCheck size={14} /> 实用避坑
        </div>
        <h1 className="mt-3 text-[25px] font-bold leading-[1.35] text-ink sm:text-[30px]">把容易错过的跨境经验，整理成能核验的答案</h1>
        <p className="mt-2 max-w-[720px] text-[14px] leading-[1.8] text-ink-3">
          不只告诉你“怎么做”，还会标明适用地区、账户类型、证件条件、信息时效和原始出处。个人经验只作为线索，不能替代官方规则。
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-[12px] text-ink-3">
          {["条件写清楚", "优先一手来源", "失效内容可追踪", "个案不外推"].map((item) => (
            <span key={item} className="rounded-full border border-line-strong bg-bg px-3 py-1.5">{item}</span>
          ))}
        </div>
      </header>

      <section aria-labelledby="guide-categories" className="pt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="guide-categories" className="text-[19px] font-bold text-ink">先按问题找</h2>
            <p className="mt-1 text-[12.5px] text-ink-4">从你正在解决的问题进入，不必先理解所有跨境概念。</p>
          </div>
          <MoreLink to="/topics">全部主题</MoreLink>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {sections.map((section) => (
            <article key={section.title} className="card px-4 py-4 sm:px-5">
              <h3 className="text-[15px] font-bold text-ink">{section.title}</h3>
              <p className="mt-0.5 text-[12px] text-ink-4">{section.note}</p>
              <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                {section.topics.map((topic) => (
                  <li key={topic.slug}>
                    <Link to={`/topics/${topic.slug}`} prefetch="intent" className="group flex items-center justify-between rounded-control bg-bg-sunk px-3 py-2.5 text-[13px] text-ink-2 transition-colors hover:bg-accent/10 hover:text-accent dark:hover:bg-accent-soft">
                      <span className="font-medium">{topic.name}</span>
                      <span className="flex items-center gap-1 text-[11px] text-ink-4 group-hover:text-accent">
                        {topic.total} 条 <IconChevronRight size={12} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="latest-guides" className="pt-9">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <h2 id="latest-guides" className="text-[19px] font-bold text-ink">最新实操与避坑</h2>
            <p className="mt-1 text-[12.5px] text-ink-4">按新证据持续更新；重要操作请打开原始来源再次确认。</p>
          </div>
          {guides.topic.total > guides.items.length && <MoreLink to="/topics/practical-guides">查看全部</MoreLink>}
        </div>
        <div className="mt-3">
          {guides.items.length > 0 ? (
            <DayList items={guides.items} />
          ) : (
            <div className="card">
              <EmptyState title="首批实用指南正在整理">信号源已接入；满足证据与适用条件要求的内容会出现在这里。</EmptyState>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
