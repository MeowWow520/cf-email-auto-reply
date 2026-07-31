# cf-email-auto-reply

使用 Cloudflare Email Routing + Workers 实现的邮件自动回复服务：发送到 `my@example.com` 的邮件会自动收到多部分（纯文本 + HTML）回复。

## 架构

```
发件人 ──→ my@example.com
             │  Cloudflare Email Routing 路由规则
             ▼
        Worker (email 事件)
             │  message.reply(纯文本 + HTML)
             ▼
        原发件人收到自动回复
```

## 防循环保护

对以下邮件不会回复，避免形成回复死循环：

- `Auto-Submitted` 非空且不是 `no`（自动回复/自动转发）
- `Precedence: bulk / junk / list`（群发、退订邮件）
- 存在 `List-Unsubscribe`（邮件列表）
- `X-Auto-Response-Suppress` 含 `all`
- `From` 为空（退信 bounce）

## 项目结构

```
src/index.ts         # email 入口：校验收件人 → 防循环判断 → 回复
src/shouldReply.ts   # 防循环判断纯函数（有单测覆盖）
src/reply.ts         # 模板渲染（纯文本 + HTML，{{subject}}/{{from}} 占位符）
test/shouldReply.test.ts
wrangler.toml        # Worker 配置与环境变量
REPLY/REPLY_HTML.html  # HTML 回复模板（浏览器预览用，编辑后需同步）
REPLY/REPLY_HTML.txt   # 打包进 Worker 的 HTML 模板副本（由脚本同步）
REPLY/REPLY_TEXT.txt   # 纯文本模板草稿（实际配置在 wrangler.toml）
REPLY/avatar.jpg       # 头像（经 jsDelivr CDN 引用）
```

## 本地开发

```bash
npm install
npm run typecheck   # 类型检查
npm test            # 单元测试
npm run sync:template   # 编辑 REPLY_HTML.html 后同步到打包版 .txt
```

> 注意：`wrangler dev` 无法在本地模拟 email 事件，端到端只能线上验证。

## 部署

```bash
npm run deploy          # 先同步模板再 npx wrangler deploy
```

部署后配置 Email Routing：

1. Cloudflare Dashboard → 你的域名 → **Email Routing** → 开启（会自动配置 MX / SPF 记录）
2. **Routing rules** → 添加规则：`my@example.com` → 路由到 Worker `email-auto-reply`
3. 用 `npm run tail` 查看日志，发送真实邮件验证

## 配置

在 `wrangler.toml` 的 `[vars]` 或 dashboard secrets 中配置：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `REPLY_ADDRESS` | `my@example.com` | 仅对该收件地址的邮件自动回复，留空则回复所有来信 |
| `REPLY_FROM_NAME` | `Auto Reply` | 回复邮件的发件人显示名 |
| `REPLY_SUBJECT` | `Re: {{subject}}` | 回复邮件主题模板，`{{subject}}` 替换为原主题；原邮件无主题时固定为 `Auto-reply` |
| `REPLY_TEXT` | 内置模板 | 纯文本模板，支持 `{{subject}}` / `{{from}}` 占位符 |

> HTML 模板不通过变量配置（Cloudflare 单个变量上限 5.1 KB），改为**随代码打包**：
> 编辑 `REPLY/REPLY_HTML.html` → 运行 `npm run sync:template` → 部署。
> `src/index.ts` 通过 `import htmlTemplate from '../REPLY/REPLY_HTML.txt'` 引入。
