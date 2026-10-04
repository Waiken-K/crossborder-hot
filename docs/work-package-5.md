# 工作包 5：临时云端预览

工作包 5 把当前版本放到 GitHub 托管的云端 runner 构建和运行，并通过临时 HTTPS 地址提供预览。它解决的是“先看效果”，不是正式生产部署。

## 交付内容

- `.github/workflows/preview.yml`：按需启动完整的 PostgreSQL、API、worker 和 web 容器。
- `scripts/seed-preview.ts`：只在 `PREVIEW_FIXTURES=true` 时写入六条明确标记为“预览样例”的合成卡片。
- 临时公网地址登记为 GitHub 的 `temporary-preview` Deployment，默认保留 90 分钟。
- 流水线先检查本地健康接口和站点 smoke test，再开放公网地址；运行期间持续检查 `/api/health` 和 `/guides`。

## 数据和安全边界

- 预览关闭 `COLLECT_ENABLED` 和 `MODEL_CALLS_ENABLED`，不会抓取信源，也不会调用付费模型。
- 样例不代表 Wise、ITIN、CRS 或 eSIM 的当前规则，卡片里保留了这个提示。
- 管理员密码由 runner 临时随机生成，不打印、不对外提供；数据库和 Docker 卷在任务结束时删除。
- 临时地址公开可访问，不能用于放真实用户数据、密钥或未公开内容。
- tunnel 客户端固定版本并校验 SHA-256，GitHub Actions 也固定到完整提交 SHA。

## 启动与停止

在仓库的 **Actions → Temporary Preview → Run workflow** 里启动，可设置 15–120 分钟，默认 90 分钟。新的运行会取消旧预览，同一时间只保留一个地址。

地址出现后可在运行摘要或仓库的 Deployments 区域打开。到期、手动取消或者健康检查失败后，地址都会失效并清理临时数据。

首次交付的提交消息带 `[preview]`，因此推送后会自动启动一次；普通后续提交不会自动暴露公网预览。

## 正式部署不是这个方案

正式站点需要持久 PostgreSQL、备份、固定域名和长期运行的容器平台。临时预览确认产品方向后，再选择一台至少 2 核 4 GB 的 VPS，或者支持 Docker 与持久卷的托管平台，并按 `docs/deploy.md` 配置 HTTPS、备份和密钥。
