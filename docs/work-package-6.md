# 工作包 6：零服务器试运行

这个工作包让“跨境热点”先连续跑几天，再决定是否购买服务器。计算发生在短时 GitHub Actions runner，数据保存在 Neon PostgreSQL；本机不需要持续开机，也不需要持久运行 Docker。

## 运行结构

```text
官方 RSS / 官网 ── GitHub Actions（每 4 小时、约 24 分钟）──┐
                                                            ├── Neon（持续保存）
本机 Chrome DevTools ── 临时预览的鉴权采集接口 ──────────────┘
                                                            │
GitHub Actions（按需 15–120 分钟）── API + Web + HTTPS ──────┘
```

- `.github/workflows/trial-cycle.yml`：每四小时启动一次 worker，完成采集、AI 判断、归组、热点排序和翻译，然后正常退出。
- `.github/workflows/trial-preview.yml`：按需启动页面和 API，直接读取持久数据库；关闭自动采集和模型调用。
- `scripts/prepare-trial.ts`：把新信源首次回填压到 3 条，并给模型设置每分钟 12、每小时 60、每天 180 次请求的硬熔断。SocialData、Jina、公众号付费采集及其他模型服务为 0。
- `scripts/trial-report.ts`：每轮把新增素材、公共池、精选、模型调用和异常写入 Actions Summary。
- `scripts/push-x-capture.ts`：把本机 Chrome 读取的结构化 X 帖子经鉴权 API 写入同一个数据库。

所有定时任务默认关闭。只有仓库变量 `TRIAL_ENABLED=true` 后才会运行；可设置 `TRIAL_END_AT`，到期后定时任务只写“已结束”，不会采集或调用模型。

## 一次性配置

### 1. Neon

在 Neon 建一个新加坡区 PostgreSQL 项目，复制 **direct connection** 连接串。试运行规模很小，免费额度即可。把连接串放进 GitHub 仓库 `Settings → Secrets and variables → Actions → Secrets`：

- `TRIAL_DATABASE_URL`：Neon direct connection URL。

数据库表会由首次工作流自动创建，不要手工执行 SQL。

### 2. 应用密钥

在仓库目录运行：

```bash
node scripts/trial-secrets.ts
```

它只在终端显示，不写文件。将第一行的值添加为 GitHub Actions Secret `TRIAL_APP_SECRET`。同时妥善保存输出的后台密码和采集 token；删除终端历史不是安全边界，不要截图公开。

### 3. 模型

普通 ChatGPT 订阅不会自动成为 OpenAI API key。当前试运行路径使用 OpenAI 兼容 API：

- Secret `TRIAL_LLM_API_KEY`：模型服务的 API key。
- Variable `TRIAL_LLM_MODEL`：该服务实际支持的模型名。
- Variable `TRIAL_LLM_BASE_URL`：可选；默认 `https://api.openai.com/v1`。
- Variable `TRIAL_LLM_EXTRA_JSON`：可选；服务商额外 JSON 参数。

不要把 key 发到聊天或提交进 Git。后续可以单独开发 ChatGPT OAuth，但它不是 API key 的同义词，也不应作为这轮试运行的前置条件。

### 4. 开关和截止时间

在 Actions Variables 添加：

- `TRIAL_ENABLED=true`
- `TRIAL_END_AT=2026-10-14T00:00:00Z`（示例，建议先跑 5–7 天）
- `TRIAL_SITE_URL` 可不填；只有正式固定域名时才需要。

进入 `Actions → Trial Collection Cycle → Run workflow` 手动跑第一轮。之后 cron 每四小时一次。每轮结果在该 run 的 Summary；任何 secret 缺失都会在发出外部请求前失败。

## 看真实数据

进入 `Actions → Persistent Trial Preview → Run workflow`，选择 15–120 分钟。Summary 会出现临时 HTTPS 地址。这个地址到期即失效，但 Neon 数据不丢；下一次预览仍能看到之前内容。

预览使用临时公网地址，不是生产部署。链接可能被知道地址的人访问，不要放敏感内容，也不要长期公开分享。

## 本机 Chrome 采集 X

Chrome 采集不是无人值守服务：只有本机 Chrome、Codex 和对应任务处于运行状态时才能读取 X。它适合每天或隔天补一次高价值 X 线索；官方源仍由云端定时跑。

流程如下：

1. 启动 `Persistent Trial Preview`，取得本次 HTTPS 地址。
2. 用 Chrome DevTools MCP 搜索指定博主或关键词，读取帖子 URL、正文、作者、时间和 tweet ID。
3. 按 [`x-capture.example.json`](x-capture.example.json) 生成本地 JSON（建议放在已忽略的 `.data/x-captures/`）。
4. 在本地 `.data/trial-client.env` 保存 `TRIAL_APP_SECRET` 和本次 `TRIAL_PREVIEW_URL`，然后执行：

   ```bash
   node --env-file=.data/trial-client.env scripts/push-x-capture.ts .data/x-captures/today.json
   ```

5. 新出现的外部来源默认是 `isolated`，不会直接污染公共页。在后台“信源”确认身份后，将可信技巧博主设为 `editorial`；只用于发现热点、必须回查一手来源的账号设为 `hot_signal`。以后同一 `sourceId` 的帖子沿用该规则。

采集接口最多每批 50 条、每 IP 每分钟 10 批。正文和 X 元数据会完整保存；同一个 tweet ID 或规范化 URL 不重复入库。超过 48 小时的旧帖自动归档为历史，不冒充“今天热点”。

## 试运行验收

跑 5–7 天后重点看四项：

- 每天实际新增且进入公共池的数量，是否足以形成阅读价值。
- 精选中的误判类型：不相关、重复、缺关键条件、来源不可靠。
- 信源失败率和正文缺失率，哪些站需要替换采集规则。
- 模型调用次数及成本记录，是否需要降低轮次或换更便宜的模型。

决定长期运行后，再把同一镜像迁到固定服务器；Neon 可继续使用，也可备份迁移。GitHub runner + 临时 tunnel 只用于验证，不作为稳定生产服务。
