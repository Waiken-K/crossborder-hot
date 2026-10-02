// 跨境账户、资金路径、税务身份与海外通信的分类体系。
// 类别 key 会进入 URL 与公开 API，上线后不要改；标签与实体可以继续增补。

export const CATEGORIES = [
  { key: "accounts", label: "账户资金", section: "账户与资金路径", guide: "跨境账户能力、收付款路径、入金出金、汇款、换汇、费用、限额与到账问题" },
  { key: "tax-identity", label: "税务身份", section: "税务与身份", guide: "ITIN、CRS、税务居民、税表、证件、姓名、地址证明与身份核验" },
  { key: "bank-cards", label: "银行美卡", section: "银行与信用卡", guide: "美国或香港银行账户、信用卡、借记卡、开户资格、奖励、账单与风控" },
  { key: "brokerage", label: "券商投资", section: "券商与投资账户", guide: "境外券商开户、税表、入金出金、账户安全、产品与服务规则变化" },
  { key: "telecom", label: "通信 eSIM", section: "海外通信与 eSIM", guide: "海外号码、eSIM、保号、漫游、短信收码、套餐、设备兼容与停机风险" },
  { key: "policy-risk", label: "政策风控", section: "监管、政策与平台风控", guide: "直接影响跨境账户或通信决策的法规、监管、制裁、平台风控、服务中断与市场事件" },
] as const;

export const ITEM_TYPES = [
  "policy_change",
  "service_change",
  "account_rule",
  "practical_tip",
  "risk_incident",
  "official_guidance",
  "analysis_explainer",
] as const;

export const CATEGORY_TAGS = [
  "政策/监管", "产品/规则更新", "开户/资格", "费用/汇率", "实操/避坑", "风险/故障", "官方指引", "观点/解读", "其他",
] as const;

export const TOPIC_TAGS = [
  "ITIN", "CRS", "W-8BEN", "1042-S", "1040-NR", "ACH", "SWIFT", "港卡", "美卡", "美国银行", "香港银行", "券商", "eSIM", "保号", "漫游", "短信收码", "地址证明", "税务居民", "身份验证", "入金/出金", "KYC", "账户冻结",
] as const;

export const ENTITY_TAGS = [
  "Wise", "IRS", "OECD", "Schwab", "Fidelity", "Interactive Brokers", "HSBC", "East West Bank", "American Express", "Chase", "Citi", "Bank of America", "Red Pocket", "Ultra Mobile", "T-Mobile", "AT&T", "Verizon", "Google Voice", "Airalo",
] as const;

export const TAG_SYNONYMS: Readonly<Record<string, string>> = {
  政策: "政策/监管", 监管: "政策/监管", 法规: "政策/监管", 合规: "政策/监管",
  更新: "产品/规则更新", 规则变更: "产品/规则更新", 产品更新: "产品/规则更新",
  开户: "开户/资格", 申请资格: "开户/资格",
  费用: "费用/汇率", 汇率: "费用/汇率", 手续费: "费用/汇率",
  教程: "实操/避坑", 指南: "实操/避坑", 技巧: "实操/避坑", 避坑: "实操/避坑", 实测: "实操/避坑",
  风险: "风险/故障", 故障: "风险/故障", 封号: "风险/故障", 冻结: "账户冻结",
  官方: "官方指引", 公告: "官方指引",
  观点: "观点/解读", 分析: "观点/解读", 解读: "观点/解读",
  税号: "ITIN", 非居民税号: "ITIN", 自动交换: "CRS", 电汇: "SWIFT", 美股券商: "券商",
  esim: "eSIM", Kyc: "KYC", kyc: "KYC", 出入金: "入金/出金",
};

export const CATEGORY_BY_ITEM_TYPE: Readonly<Record<string, string>> = {
  policy_change: "政策/监管",
  service_change: "产品/规则更新",
  account_rule: "开户/资格",
  practical_tip: "实操/避坑",
  risk_incident: "风险/故障",
  official_guidance: "官方指引",
  analysis_explainer: "观点/解读",
};

export const ENTITIES: Record<string, { name: string; displayTag: string | null; aliases: string[] }> = {
  wise: { name: "Wise", displayTag: "Wise", aliases: ["Wise", "TransferWise"] },
  irs: { name: "美国国税局 IRS", displayTag: "IRS", aliases: ["IRS", "Internal Revenue Service", "美国国税局"] },
  oecd: { name: "OECD", displayTag: "OECD", aliases: ["OECD", "经济合作与发展组织"] },
  schwab: { name: "Charles Schwab", displayTag: "Schwab", aliases: ["Charles Schwab", "Schwab", "嘉信理财", "嘉信"] },
  fidelity: { name: "Fidelity", displayTag: "Fidelity", aliases: ["Fidelity", "富达"] },
  "interactive-brokers": { name: "Interactive Brokers", displayTag: "Interactive Brokers", aliases: ["Interactive Brokers", "IBKR", "盈透证券", "盈透"] },
  hsbc: { name: "HSBC", displayTag: "HSBC", aliases: ["HSBC", "汇丰", "香港上海汇丰银行"] },
  "east-west-bank": { name: "East West Bank", displayTag: "East West Bank", aliases: ["East West Bank", "华美银行"] },
  amex: { name: "American Express", displayTag: "American Express", aliases: ["American Express", "Amex", "美国运通", "运通"] },
  chase: { name: "Chase", displayTag: "Chase", aliases: ["Chase", "JPMorgan Chase", "摩根大通"] },
  citi: { name: "Citi", displayTag: "Citi", aliases: ["Citi", "Citibank", "花旗"] },
  boa: { name: "Bank of America", displayTag: "Bank of America", aliases: ["Bank of America", "BofA", "美国银行"] },
  "red-pocket": { name: "Red Pocket", displayTag: "Red Pocket", aliases: ["Red Pocket", "红口袋"] },
  "ultra-mobile": { name: "Ultra Mobile", displayTag: "Ultra Mobile", aliases: ["Ultra Mobile", "Ultra PayGo"] },
  "t-mobile": { name: "T-Mobile", displayTag: "T-Mobile", aliases: ["T-Mobile", "TMobile"] },
  att: { name: "AT&T", displayTag: "AT&T", aliases: ["AT&T", "ATT"] },
  verizon: { name: "Verizon", displayTag: "Verizon", aliases: ["Verizon"] },
  "google-voice": { name: "Google Voice", displayTag: "Google Voice", aliases: ["Google Voice", "GV"] },
  airalo: { name: "Airalo", displayTag: "Airalo", aliases: ["Airalo"] },
};

export const IDENTITY_LEXICON: ReadonlyArray<{ id: string; name: string; patterns: RegExp[] }> = [
  { id: "wise", name: "Wise", patterns: [/\bwise\b|transferwise/i] },
  { id: "irs", name: "美国国税局 IRS", patterns: [/\bIRS\b|internal revenue service|美国国税局/i] },
  { id: "oecd", name: "OECD", patterns: [/\bOECD\b|经济合作与发展组织/i] },
  { id: "schwab", name: "Charles Schwab", patterns: [/charles schwab|\bschwab\b|嘉信理财|嘉信证券/i] },
  { id: "fidelity", name: "Fidelity", patterns: [/\bfidelity\b|富达/i] },
  { id: "interactive-brokers", name: "Interactive Brokers", patterns: [/interactive brokers|\bIBKR\b|盈透证券|盈透/i] },
  { id: "hsbc", name: "HSBC", patterns: [/\bHSBC\b|汇丰/i] },
  { id: "east-west-bank", name: "East West Bank", patterns: [/east west bank|华美银行/i] },
  { id: "amex", name: "American Express", patterns: [/american express|\bamex\b|美国运通/i] },
  { id: "chase", name: "Chase", patterns: [/jpmorgan chase|\bchase\b|摩根大通/i] },
  { id: "citi", name: "Citi", patterns: [/\bciti(?:bank)?\b|花旗/i] },
  { id: "boa", name: "Bank of America", patterns: [/bank of america|\bBofA\b/i] },
  { id: "red-pocket", name: "Red Pocket", patterns: [/red pocket|红口袋/i] },
  { id: "ultra-mobile", name: "Ultra Mobile", patterns: [/ultra mobile|ultra paygo/i] },
  { id: "t-mobile", name: "T-Mobile", patterns: [/t[ -]?mobile/i] },
  { id: "att", name: "AT&T", patterns: [/AT&T|\bATT\b/] },
  { id: "verizon", name: "Verizon", patterns: [/\bverizon\b/i] },
  { id: "google-voice", name: "Google Voice", patterns: [/google voice/i] },
  { id: "airalo", name: "Airalo", patterns: [/\bairalo\b/i] },
];

export const PUBLISHER_DOMAINS: ReadonlyArray<{ entityId: string; domains: readonly string[] }> = [
  { entityId: "wise", domains: ["wise.com"] },
  { entityId: "irs", domains: ["irs.gov"] },
  { entityId: "oecd", domains: ["oecd.org"] },
  { entityId: "schwab", domains: ["schwab.com"] },
  { entityId: "fidelity", domains: ["fidelity.com"] },
  { entityId: "interactive-brokers", domains: ["interactivebrokers.com"] },
  { entityId: "hsbc", domains: ["hsbc.com", "hsbc.com.hk"] },
  { entityId: "east-west-bank", domains: ["eastwestbank.com"] },
  { entityId: "amex", domains: ["americanexpress.com"] },
  { entityId: "chase", domains: ["chase.com"] },
  { entityId: "citi", domains: ["citi.com"] },
  { entityId: "boa", domains: ["bankofamerica.com"] },
  { entityId: "red-pocket", domains: ["redpocket.com"] },
  { entityId: "ultra-mobile", domains: ["ultramobile.com"] },
  { entityId: "t-mobile", domains: ["t-mobile.com"] },
  { entityId: "att", domains: ["att.com"] },
  { entityId: "verizon", domains: ["verizon.com"] },
  { entityId: "airalo", domains: ["airalo.com"] },
];

export const IDENTITY_CONTEXT_ALIASES: ReadonlyArray<{ entityId: string; pattern: RegExp }> = [
  { entityId: "wise", pattern: /@Wise\b/i },
  { entityId: "irs", pattern: /@IRSnews\b/i },
  { entityId: "schwab", pattern: /@CharlesSchwab\b/i },
  { entityId: "interactive-brokers", pattern: /@IBKR\b/i },
  { entityId: "red-pocket", pattern: /@RedPocketMobile\b/i },
];
