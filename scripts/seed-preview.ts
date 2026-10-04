// Synthetic, clearly labelled cards for temporary UI previews. This script refuses to run unless
// PREVIEW_FIXTURES=true, so production deployments cannot accidentally publish the examples.
import { closeDb, sql } from "@aihot/backend/db";

if (process.env.PREVIEW_FIXTURES !== "true") {
  throw new Error("seed-preview requires PREVIEW_FIXTURES=true");
}

const sourceId = "crossborder-preview-fixtures";
const now = Date.now();
const examples = [
  {
    id: "preview-wise-ach",
    title: "Wise 的 ACH 收款信息，先确认账户地区与可用币种",
    summary: "预览样例：展示一条实操卡片如何同时写清账户前提、功能边界和核验入口；不代表当前产品规则。",
    reason: "账户能力会因注册地区、验证状态和币种而不同，操作前应回到官方帮助中心确认。",
    url: "https://wise.com/help/",
    tags: ["实操/避坑", "Wise", "ACH", "产品/规则更新"],
  },
  {
    id: "preview-wise-name",
    title: "中文姓名改成英文拼写前，先统一证件与账户资料",
    summary: "预览样例：姓名修改类问题需要区分显示名称、法定姓名和收款信息，避免只给一个没有前提的操作步骤。",
    reason: "资料不一致可能影响身份验证和收款，指南应注明证件类型、适用账户和可能需要的补件。",
    url: "https://wise.com/help/",
    tags: ["实操/避坑", "Wise", "身份验证", "KYC"],
  },
  {
    id: "preview-wise-id",
    title: "注册时使用哪种身份证件，可能影响后续可用的账户能力",
    summary: "预览样例：把“使用身份证还是护照”拆成注册地区、居住地、证件签发地和产品资格四个核验条件。",
    reason: "个别用户经验不能直接外推；需要官方规则与多个独立案例共同支持。",
    url: "https://wise.com/help/",
    tags: ["实操/避坑", "Wise", "身份验证", "香港银行"],
  },
  {
    id: "preview-itin-checklist",
    title: "申请 ITIN 前，先确认申请理由、税表和身份证明路径",
    summary: "预览样例：清单型指南会分别列出适用对象、所需文件、提交路径、处理时间和常见退件点。",
    reason: "ITIN 不是通用开户工具，申请必须有符合 IRS 规则的税务理由。",
    url: "https://www.irs.gov/individuals/individual-taxpayer-identification-number",
    tags: ["实操/避坑", "ITIN", "美国税表", "官方指引"],
  },
  {
    id: "preview-crs-residency",
    title: "填写 CRS 税务居民声明，不要只按国籍判断",
    summary: "预览样例：税务居民判断需要结合居住、永久住所和当地规则；页面会保留司法辖区与时间条件。",
    reason: "国籍、居住地和税务居民不是同一个概念，错误外推可能导致账户声明不准确。",
    url: "https://www.oecd.org/en/topics/sub-issues/international-standards-on-tax-transparency.html",
    tags: ["实操/避坑", "CRS", "税务居民", "政策/监管"],
  },
  {
    id: "preview-esim-keep-number",
    title: "海外号码长期保号，要同时检查充值、活跃和漫游条件",
    summary: "预览样例：保号指南会区分套餐有效期、号码回收规则、境外短信、Wi-Fi Calling 和设备兼容性。",
    reason: "能收到一次验证码不等于可以长期保号，运营商条款和实际使用条件都要核验。",
    url: "https://support.apple.com/en-us/118669",
    tags: ["实操/避坑", "eSIM", "保号", "漫游"],
  },
] as const;

await sql`
  INSERT INTO sources (id, name, kind, tier, first_party, participation_mode, enabled, next_fetch_at)
  VALUES (${sourceId}, '跨境热点 · 预览样例', 'external', 'T2', false, 'editorial', false, '2100-01-01')
  ON CONFLICT (id) DO UPDATE SET name=excluded.name, enabled=false`;

for (const [index, item] of examples.entries()) {
  const at = new Date(now - index * 3_600_000);
  await sql`
    INSERT INTO articles (id, source_id, identity_key, url, title, discovered_at, timeline_at)
    VALUES (${item.id}, ${sourceId}, ${`preview:${item.id}`}, ${item.url}, ${item.title}, ${at}, ${at})
    ON CONFLICT (id) DO UPDATE SET title=excluded.title, url=excluded.url, discovered_at=excluded.discovered_at, timeline_at=excluded.timeline_at`;
  await sql`
    INSERT INTO publications (
      article_id, title, summary, reason, source_id, channel, url, published_at, discovered_at, timeline_at, sort_at,
      eligible, selected, score, visible_after, visibility, tags, first_party, body_mode, indexable
    ) VALUES (
      ${item.id}, ${item.title}, ${item.summary}, ${item.reason}, ${sourceId}, 'news', ${item.url}, ${at}, ${at}, ${at}, ${at},
      true, true, 82, ${new Date(now - 60_000)}, 'public', ${[...item.tags]}, false, 'summary', false
    )
    ON CONFLICT (article_id) DO UPDATE SET
      title=excluded.title, summary=excluded.summary, reason=excluded.reason, url=excluded.url,
      published_at=excluded.published_at, discovered_at=excluded.discovered_at, timeline_at=excluded.timeline_at,
      sort_at=excluded.sort_at, selected=true, eligible=true, score=excluded.score, visible_after=excluded.visible_after,
      visibility='public', tags=excluded.tags, indexable=false`;
}

console.log(`preview fixtures: ${examples.length}`);
await closeDb();
