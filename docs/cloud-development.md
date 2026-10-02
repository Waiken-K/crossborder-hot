# 云端开发与持续集成

这份配置用于把安装、类型检查、测试和 Docker 构建放到云端执行，开发电脑只负责查看结果。生产环境不运行在 Codex Cloud 中。

## 固定工具链

- Node.js `24.17.0`（`.nvmrc`、GitHub Actions 和 Docker 使用同一版本）
- npm `11.13.x`（`packageManager` 和 `engines` 约束）
- PostgreSQL `17`
- 安装依赖统一执行 `npm ci --no-audit --no-fund`

更新 Node.js 时，应在同一个改动中同步 `.nvmrc`、`package.json`、`Dockerfile` 和 `.github/workflows/check.yml`，并重新执行完整检查。

## Codex Cloud 环境

1. 先把本仓库推送到自己的 GitHub 仓库。
2. 在 Codex 中选择 `Work in > Cloud > Create environment`，连接该仓库。
3. 安装阶段使用：

   ```bash
   npm ci --no-audit --no-fund
   ```

4. 为需要数据库的任务增加 PostgreSQL 17 服务，并创建名称以 `_test` 或 `_ci` 结尾的空数据库。
5. 保存下面的非敏感环境变量；密钥放进 Cloud Environment 的 Secret，不写入仓库：

   ```dotenv
   DATABASE_URL=postgres://postgres:ci@127.0.0.1:5432/aihot_ci
   SITE_URL=http://127.0.0.1:3000
   API_BASE_URL=http://127.0.0.1:3001
   SESSION_SECRET=cloud-test-session-secret-0123456789
   IMG_PROXY_SIGN_SECRET=cloud-test-image-secret-0123456789
   COLLECT_ENABLED=false
   MODEL_CALLS_ENABLED=false
   FEISHU_CONTENT_PUSH_ENABLED=false
   FEISHU_INTERNAL_ENABLED=false
   INDEXNOW_SUBMIT_ENABLED=false
   ```

6. 发布环境前执行：

   ```bash
   npm run check:static
   npm run check:database
   ```

云端任务不会继承本机文件、Chrome 登录态、VPN 或本机 Secret。需要读取 X 登录页面的工作仍在本机 Chrome 中完成，采集程序使用单独的数据接口和最小权限密钥。

## 环境变量模板

- `config/env/development.env.example`：本机或 Cloud 开发；所有外部调用关闭。
- `config/env/test.env.example`：自动测试；数据库名必须以 `_test` 结尾。
- `config/env/production.env.example`：生产骨架；完成信源、预算和密钥审核后再打开采集及模型调用。
- `.env.example`：完整配置字典，包含所有可选能力。

复制模板后再填写 Secret，不要直接修改或提交模板里的占位值：

```bash
cp config/env/development.env.example .env
```

也可以运行 `node scripts/init-env.ts`，从完整模板生成随机的管理员密码和签名密钥。

## GitHub Actions 验收

`.github/workflows/check.yml` 在 push、Pull Request 和手动触发时运行两个任务：

- `check`：安装、静态检查、PostgreSQL 迁移、种子、后端测试和站点 smoke test。
- `docker`：从空环境构建镜像、启动完整 Compose 栈并做容器内 smoke test；主分支通过后，把同一个已测试镜像发布到 GitHub Container Registry，分别标记为提交 SHA 和 `main`。

CI 和开发环境默认关闭采集、模型、飞书与 IndexNow，测试不会调用外部付费服务。

## 本地最小检查

电脑上没有 Docker 或 PostgreSQL 时只运行：

```bash
npm ci --no-audit --no-fund
npm run check:static
```

完整数据库和 Docker 验收交给 Codex Cloud 或 GitHub Actions。生产服务器在 `.env` 中把 `APP_IMAGE` 指向已发布的 GHCR 镜像，只拉取通过验收的镜像，不在服务器上编译前端。
