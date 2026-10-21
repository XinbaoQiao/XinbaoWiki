<a id="top"></a>

<p align="center">
  <a href="#english"><img src="https://img.shields.io/badge/English-3366cc?style=for-the-badge" height="28" alt="English" /></a>
  <a href="#simplified-chinese"><img src="https://img.shields.io/badge/简体中文-6b4fbb?style=for-the-badge" height="28" alt="简体中文" /></a>
</p>

<div align="center">
  <img src="public/mywiki-icon.png" width="96" alt="MyWiki" />

  # LLM Wiki Academic Homepage — Template

  **A bilingual, Wikipedia-style personal academic homepage built as an LLM Wiki: interlinked Markdown pages that people can browse and an AI assistant can cite.**

  **一个以 LLM Wiki 方式搭建的双语、维基风格个人学术主页模板：互相链接的 Markdown 页面，既供人浏览，也供 AI 助手引用作答。**
</div>

> This is the `template` branch. It contains **no personal data** — every name, page, image and link is a clearly marked placeholder ("Your Name", "Example University", `you@example.com`). Replace them with your own.
>
> 这是 `template` 分支，**不含任何个人信息**——所有姓名、页面、图片和链接都是明确标注的占位内容（"Your Name"、"示例大学"、`you@example.com`），请替换为你自己的。

---

<a id="english"></a>

## English

### Features

- **Wiki pages from Markdown** — `wiki/*.md` with YAML frontmatter; `[[Wikilinks]]` connect pages into a knowledge graph.
- **Bilingual** — every page `Foo.md` has a Chinese twin `Foo_zh.md`; the language toggle switches between them.
- **Sidebar, homepage directory, title morph** — curated navigation with animated cross-page title transitions.
- **Table of contents, infobox, paper highlight cards**, KaTeX math.
- **Site search** over titles, aliases, summaries and bodies.
- **Theme palette** (blue / gold / green / charcoal …) and the **Browse cube** view.
- **Visitor atlas** (optional) — an aggregated world map of visits, stored in Upstash Redis; shows an empty map when not configured.
- **Page AI** (optional) — a page-grounded assistant with numbered citations, calling any OpenAI-compatible endpoint from the server.
- **OKF export** — `public/okf/**` is an agent-readable bundle generated from the wiki.

### Quick start

```bash
# Node 22 is recommended (see .nvmrc)
npm ci
npm run dev        # http://localhost:3000
npm run build      # production build
```

### Make it yours — what to edit

| What | Where |
| --- | --- |
| Your home page (EN / ZH) | `wiki/Your_Name.md`, `wiki/Your_Name_zh.md` — edit the content and frontmatter (the displayed name comes from `title`/`name`). Keeping the file names is easiest; to rename the slug, search the repo for `Your_Name` and replace it everywhere |
| Other pages | `wiki/*.md` — Research, Publications, Projects, CV, Education, Experience, topic / paper / institution pages. Create new ones with `npm run new:wiki` |
| **Everything owner-specific in one place** | **`lib/site-config.ts`**: your name (homepage wordmark, metadata, chat), subtitle, description, per-palette taglines, research areas, concept pages, institutions, people, selected papers, footer links, chat greeting and quick-start buttons |
| Sidebar & homepage directory | Derived from `lib/site-config.ts` by `lib/site-navigation.ts`. Pages that do not exist are skipped and empty groups are hidden, so deleting an example page never breaks navigation |
| Research areas | Rename `wiki/Research_Area_1.md` … `Research_Area_3.md` (and their `_zh` twins) to your own topics, then update the slugs and labels in `researchAreas`. One, two or five areas all work |
| Site URL, title, description, footer | Set `NEXT_PUBLIC_SITE_URL` (used by metadata, sitemap, robots, RSS feed and the visitor-activity host check); description and footer links live in `lib/site-config.ts` |
| "Edit on GitHub" links | `components/ArticleTabs.tsx`, `app/wiki/[slug]/page.tsx` (`your-username/your-wiki`) |
| Site name "MyWiki" | search the repo for `MyWiki` |
| News / updates & paper cards | `lib/site-updates.ts` (each paper needs a page with a complete `paper_highlight`) |
| Avatar, icons, paper figures | `public/images/`, `public/site-icons/`, `public/mywiki-icon.png`, `public/papers/<paper-id>/` |
| AI assistant greeting & quick questions | `chat` in `lib/site-config.ts`; system prompt in `lib/chat-with-owner.ts` |
| License holder | `LICENSE`, `LICENSING.md` |

Example pages to copy from: `wiki/Example_Concept.md` is a research-concept page (inline and display math, figure, table, block quote, footnotes, `relations`); `wiki/Example_Paper.md` shows the paper-highlight card and resource links; `wiki/Example_University.md` an institution infobox with a logo; `wiki/Your_Name.md` a person infobox with a photo gallery; `wiki/Draft_Example.md` uses `hidden: true`, so it is not published. Delete any example you do not need, together with its `_zh` twin.

After editing wiki pages, regenerate metadata and check links:

```bash
npm run maintain:wiki   # rewrites hashes, wiki/*.json and public/okf/**
npm run lint:wiki && npm run lint:content && npm run lint:okf
```

The content check requires each page to carry a `reviewed_at` timestamp later than its `modified` time — set it when you have reviewed a page. Writing guidelines: `docs/content-template.md`.

### Environment variables (names only)

All are optional; without them the site still builds and the AI / visitor atlas degrade gracefully. See `docs/chat/env.example`, `docs/chat/README.md`, `docs/site-activity/README.md`.

| Variable | Purpose |
| --- | --- |
| `YUNWU_API_KEY`, `YUNWU_API_BASE_URL`, `CHAT_MODEL` | OpenAI-compatible chat endpoint, key and model for the page AI |
| `SITE_OWNER_NAME` | Name the assistant talks about |
| `NEXT_PUBLIC_SITE_OWNER_NAME`, `NEXT_PUBLIC_SITE_OWNER_NAME_ZH` | Name shown in the homepage wordmark, metadata and chat copy (defaults: `Your Name` / `你的名字`; you can also edit `lib/site-config.ts`) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Address for the footer Email link |
| `SITE_CHAT_VOICE_STYLE`, `SITE_CHAT_SIGNATURE_EN`, `SITE_CHAT_SIGNATURE_ZH` | Optional tone note and casual sign-off |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Redis for rate limiting and the visitor atlas |
| `RATE_LIMIT_SALT` | Salt for pseudonymous hashes |
| `SITE_CHAT_ADMIN_TOKEN` | Bearer token for private activity reports |
| `SITE_ACTIVITY_OWNER_PASSWORD_HASH` | Lets the owner exclude their own visits |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL, e.g. `https://your-domain.org` (default `https://example.com`) |
| `NEXT_PUBLIC_BASE_PATH` | Sub-path deployments (e.g. GitHub Pages project sites) |

Never commit `.env*` files or real keys.

### Deploy

- **Vercel (recommended)**: import the repo as a Next.js 15 project, add the variables above in Project Settings, deploy. API routes (page AI, visitor atlas) need a server runtime, so a pure static export disables them.
- Point your own domain at the deployment and set `NEXT_PUBLIC_SITE_URL` to it (Vercel: Project Settings → Environment Variables), then redeploy.
- CI (`.github/workflows/ci.yml`) runs checks and a build on pushes to `main` and on pull requests.

<p align="right"><a href="#top">Back to top</a></p>

---

<a id="simplified-chinese"></a>

## 简体中文

### 功能

- **Markdown 即 Wiki 页面**——`wiki/*.md` 带 YAML frontmatter；`[[Wikilink]]` 把页面连成知识图谱。
- **中英双语**——每个 `Foo.md` 都有中文页 `Foo_zh.md`，语言切换在两者间跳转。
- **侧栏、主页目录、标题转场**——精选导航与跨页标题动画。
- **页内目录、信息框、论文亮点卡片**，支持 KaTeX 公式。
- **站内检索**：标题、别名、摘要与正文。
- **主题配色**（蓝 / 金 / 绿 / 炭灰 …）与 **立体浏览 Cube**。
- **访客地图**（可选）——基于 Upstash Redis 的聚合访问世界地图；未配置时显示空地图。
- **页面 AI 问答**（可选）——基于当前页面检索、带编号引用的助手，由服务端调用任意 OpenAI 兼容接口。
- **OKF 导出**——`public/okf/**` 是从 Wiki 生成的、可供智能体读取的知识包。

### 快速开始

```bash
# 推荐 Node 22（见 .nvmrc）
npm ci
npm run dev        # http://localhost:3000
npm run build      # 生产构建
```

### 改成你自己的主页——需要改哪些文件

| 内容 | 位置 |
| --- | --- |
| 个人主页（中 / 英） | `wiki/Your_Name.md`、`wiki/Your_Name_zh.md`——修改正文与 frontmatter（显示的姓名来自 `title`/`name`）。保留文件名最省事；若要改 slug，全仓库搜索 `Your_Name` 并统一替换 |
| 其他页面 | `wiki/*.md`——研究、论文、项目、简历、教育、经历、主题 / 论文 / 机构页；用 `npm run new:wiki` 新建 |
| **所有个人化内容集中在一处** | **`lib/site-config.ts`**：姓名（主页字标、元数据、聊天）、副标题、站点描述、各配色标语、研究方向、概念页、机构、人物、代表论文、页脚链接、聊天开场白与快捷按钮 |
| 侧栏与主页目录 | 由 `lib/site-navigation.ts` 根据 `lib/site-config.ts` 自动生成；不存在的页面会被跳过，空分组自动隐藏，删掉示例页不会导致导航报错 |
| 研究方向 | 把 `wiki/Research_Area_1.md` … `Research_Area_3.md`（及对应 `_zh` 页）改成你自己的主题，再更新 `researchAreas` 中的 slug 与名称；一个、两个或五个方向都可以 |
| 站点网址、标题、描述、页脚 | 设置环境变量 `NEXT_PUBLIC_SITE_URL`（用于元数据、站点地图、robots、RSS 与访客统计的主机校验）；描述与页脚链接在 `lib/site-config.ts` |
| “在 GitHub 编辑”链接 | `components/ArticleTabs.tsx`、`app/wiki/[slug]/page.tsx`（`your-username/your-wiki`） |
| 站点名 “MyWiki” | 全仓库搜索 `MyWiki` |
| 最新动态与论文卡片 | `lib/site-updates.ts`（每篇论文需要有完整 `paper_highlight` 的页面） |
| 头像、图标、论文配图 | `public/images/`、`public/site-icons/`、`public/mywiki-icon.png`、`public/papers/<paper-id>/` |
| AI 助手开场白与快捷问题 | `lib/site-config.ts` 中的 `chat`；系统提示词在 `lib/chat-with-owner.ts` |
| 版权人 | `LICENSE`、`LICENSING.md` |

可参考的示例页面：`wiki/Example_Concept.md` 是研究概念页（行内与独立公式、插图、表格、引文、脚注、`relations`）；`wiki/Example_Paper.md` 展示论文亮点卡片与资源链接；`wiki/Example_University.md` 展示带标志的机构信息框；`wiki/Your_Name.md` 展示带相册的人物信息框；`wiki/Draft_Example.md` 使用 `hidden: true`，不会发布。不需要的示例连同其 `_zh` 页面一起删除即可。

修改 Wiki 页面后，重新生成元数据并检查链接：

```bash
npm run maintain:wiki   # 重写哈希、wiki/*.json 与 public/okf/**
npm run lint:wiki && npm run lint:content && npm run lint:okf
```

内容检查要求每页的 `reviewed_at` 晚于 `modified`——审阅完页面后再更新它。写作规范见 `docs/content-template.md`。

### 环境变量（仅列名称）

全部可选；不配置也能构建，AI 与访客地图会自动降级。详见 `docs/chat/env.example`、`docs/chat/README.md`、`docs/site-activity/README.md`。

| 变量 | 用途 |
| --- | --- |
| `YUNWU_API_KEY`、`YUNWU_API_BASE_URL`、`CHAT_MODEL` | 页面 AI 使用的 OpenAI 兼容接口、密钥与模型 |
| `SITE_OWNER_NAME` | 助手介绍的主人姓名 |
| `NEXT_PUBLIC_SITE_OWNER_NAME`、`NEXT_PUBLIC_SITE_OWNER_NAME_ZH` | 主页字标、元数据与聊天文案中显示的姓名（默认 `Your Name` / `你的名字`；也可直接改 `lib/site-config.ts`） |
| `NEXT_PUBLIC_CONTACT_EMAIL` | 页脚 Email 链接的地址 |
| `SITE_CHAT_VOICE_STYLE`、`SITE_CHAT_SIGNATURE_EN`、`SITE_CHAT_SIGNATURE_ZH` | 可选语气说明与闲聊落款 |
| `UPSTASH_REDIS_REST_URL`、`UPSTASH_REDIS_REST_TOKEN` | 限流与访客地图使用的 Redis |
| `RATE_LIMIT_SALT` | 假名化哈希的盐 |
| `SITE_CHAT_ADMIN_TOKEN` | 私有访问报表的 Bearer 令牌 |
| `SITE_ACTIVITY_OWNER_PASSWORD_HASH` | 让站长排除自己的访问 |
| `NEXT_PUBLIC_SITE_URL` | 站点正式网址，例如 `https://your-domain.org`（默认 `https://example.com`） |
| `NEXT_PUBLIC_BASE_PATH` | 子路径部署（如 GitHub Pages 项目站） |

不要提交 `.env*` 文件或真实密钥。

### 部署

- **Vercel（推荐）**：以 Next.js 15 项目导入仓库，在 Project Settings 中填入上述变量后部署。页面 AI 与访客地图依赖服务端 API 路由，纯静态导出时会被禁用。
- 将自己的域名指向部署，并把 `NEXT_PUBLIC_SITE_URL` 设为该域名（Vercel：Project Settings → Environment Variables），然后重新部署。
- CI（`.github/workflows/ci.yml`）在推送到 `main` 和 Pull Request 时运行检查与构建。

<p align="right"><a href="#top">返回顶部</a></p>
