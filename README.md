<a id="top"></a>

<p align="center">
  <a href="#english"><img src="https://img.shields.io/badge/English-3366cc?style=for-the-badge" height="28" alt="English" /></a>
  <a href="#simplified-chinese"><img src="https://img.shields.io/badge/简体中文-6b4fbb?style=for-the-badge" height="28" alt="简体中文" /></a>
</p>

<div align="center">
  <img src="public/mywiki-icon.png" width="96" alt="MyWiki" />

  # LLM Wiki Academic Homepage — Template

  **Bilingual, Wikipedia-style personal academic homepage: Markdown pages people can browse, and an AI can cite.**

  **双语、维基风格的个人学术主页模板：互相链接的 Markdown，既给人看，也能给 AI 引用。**
</div>

> This is the `template` branch. **No personal data** — names, pages, images, and links are placeholders (“Your Name”, “Example University”, `you@example.com`). Swap them for yours.
>
> 这是 `template` 分支。**不含个人信息** — 姓名、页面、图片、链接都是占位内容，请换成你自己的。

---

<a id="english"></a>

## English

### What’s in the box

Folded = outline. Open what you need.

<details>
<summary><strong>A. Wiki & reading</strong> — Markdown pages, bilingual twins, TOC, infobox, KaTeX, paper cards</summary>

- `wiki/*.md` with YAML frontmatter; `[[Wikilinks]]` between pages
- Every `Foo.md` has a Chinese twin `Foo_zh.md`
- Sidebar, homepage directory, title morph between pages
- TOC, infobox, paper highlight cards, KaTeX

</details>

<details>
<summary><strong>B. Browse & search</strong> — themes, cube, site search</summary>

- Theme palette (blue / gold / green / charcoal / …)
- Browse cube view
- Search over titles, aliases, summaries, and bodies

</details>

<details>
<summary><strong>C. Optional AI & map</strong> — page AI with citations, visitor atlas</summary>

- Page AI (optional): grounded answers with numbered citations via any OpenAI-compatible endpoint
- Visitor atlas (optional): Upstash Redis; empty map if unset

</details>

<details>
<summary><strong>D. Export & checks</strong> — OKF bundle, content lint</summary>

- `public/okf/**` — agent-readable export from the Wiki
- `npm run maintain:wiki` / `lint:wiki` / `lint:content` / `lint:okf`

</details>

### Quick start

```bash
# Node 22 recommended (see .nvmrc)
npm ci
npm run dev        # http://localhost:3000
npm run build      # production build
```

### Make it yours

<details>
<summary><strong>1. Name & site copy</strong> — <code>lib/site-config.ts</code></summary>

One file for owner-specific data: name (wordmark, metadata, chat), subtitle, description, palette taglines, research areas, concept pages, institutions, people, selected papers, footer links, chat greeting and quick-start buttons.

Sidebar and homepage directory are derived from this config by `lib/site-navigation.ts`. Missing pages are skipped; empty groups hide themselves.

</details>

<details>
<summary><strong>2. Wiki pages</strong> — <code>wiki/*.md</code></summary>

| Page | Notes |
| --- | --- |
| Home | `wiki/Your_Name.md` + `Your_Name_zh.md` — display name from `title` / `name` |
| Topics / papers / CV / … | Other `wiki/*.md`; create with `npm run new:wiki` |
| Research areas | Rename `Research_Area_1`–`3` (+ `_zh`), then update slugs in `researchAreas` |

Examples to copy: `Example_Concept.md` (math, figure, `relations`), `Example_Paper.md` (paper card), `Example_University.md` (institution infobox), `Your_Name.md` (person + gallery), `Draft_Example.md` (`hidden: true`).

After edits:

```bash
npm run maintain:wiki
npm run lint:wiki && npm run lint:content && npm run lint:okf
```

Each page needs `reviewed_at` later than `modified`. Writing guide: `docs/content-template.md`.

</details>

<details>
<summary><strong>3. Assets & branding</strong> — <code>public/</code>, GitHub links, “MyWiki”</summary>

| What | Where |
| --- | --- |
| Avatar, icons, paper figures | `public/images/`, `public/site-icons/`, `public/mywiki-icon.png`, `public/papers/<id>/` |
| “Edit on GitHub” | `components/ArticleTabs.tsx`, `app/wiki/[slug]/page.tsx` (`your-username/your-wiki`) |
| Site name “MyWiki” | search the repo for `MyWiki` |
| News / paper cards | `lib/site-updates.ts` (papers need a complete `paper_highlight`) |
| License holder | `LICENSE`, `LICENSING.md` |

</details>

<details>
<summary><strong>4. Env vars (all optional)</strong> — AI, map, URL</summary>

Without them the site still builds; AI / atlas just stay off. See `docs/chat/env.example`, `docs/chat/README.md`, `docs/site-activity/README.md`.

| Variable | Purpose |
| --- | --- |
| `YUNWU_API_KEY`, `YUNWU_API_BASE_URL`, `CHAT_MODEL` | OpenAI-compatible chat for page AI |
| `SITE_OWNER_NAME` | Name the assistant talks about |
| `NEXT_PUBLIC_SITE_OWNER_NAME`, `NEXT_PUBLIC_SITE_OWNER_NAME_ZH` | Wordmark / metadata / chat labels (or edit `lib/site-config.ts`) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Footer Email link |
| `SITE_CHAT_VOICE_STYLE`, `SITE_CHAT_SIGNATURE_EN`, `SITE_CHAT_SIGNATURE_ZH` | Optional tone / sign-off |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Rate limit + visitor atlas |
| `RATE_LIMIT_SALT` | Salt for pseudonymous hashes |
| `SITE_CHAT_ADMIN_TOKEN` | Bearer for private activity reports |
| `SITE_ACTIVITY_OWNER_PASSWORD_HASH` | Owner visit exclusion |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL (default `https://example.com`) |
| `NEXT_PUBLIC_BASE_PATH` | Sub-path deploys (e.g. GitHub Pages) |

Never commit `.env*` or real keys.

</details>

<details>
<summary><strong>5. Deploy</strong> — Vercel recommended</summary>

- Import as Next.js 15, add env vars, deploy. API routes (AI, atlas) need a server runtime — pure static export turns them off.
- Point your domain and set `NEXT_PUBLIC_SITE_URL`, then redeploy.
- CI (`.github/workflows/ci.yml`) checks and builds on pushes / PRs when you keep it.

</details>

<p align="right"><a href="#top">Back to top</a></p>

---

<a id="simplified-chinese"></a>

## 简体中文

### 模板里有什么

折叠时 = 大纲。需要再展开。

<details>
<summary><strong>A. Wiki 与阅读</strong> — Markdown、双语页、目录、信息框、KaTeX、论文卡</summary>

- `wiki/*.md` + YAML；`[[Wikilink]]` 连页
- 每个 `Foo.md` 有中文页 `Foo_zh.md`
- 侧栏、首页目录、跨页标题动画
- 目录、信息框、论文高亮卡、KaTeX

</details>

<details>
<summary><strong>B. 浏览与搜索</strong> — 主题色、立方体、站内搜索</summary>

- 主题色板（蓝 / 金 / 绿 / 炭灰 …）
- Browse 立方体
- 按标题、别名、摘要、正文搜索

</details>

<details>
<summary><strong>C. 可选 AI 与地图</strong> — 带引用的页内 AI、访客地图</summary>

- 页内 AI（可选）：基于当前页作答，带编号引用；任意 OpenAI 兼容接口
- 访客地图（可选）：Upstash Redis；未配置则空图

</details>

<details>
<summary><strong>D. 导出与检查</strong> — OKF、内容检查</summary>

- `public/okf/**` — 从 Wiki 生成的 agent 可读包
- `npm run maintain:wiki` / `lint:wiki` / `lint:content` / `lint:okf`

</details>

### 快速开始

```bash
# 推荐 Node 22（见 .nvmrc）
npm ci
npm run dev        # http://localhost:3000
npm run build      # 生产构建
```

### 改成你自己的主页

<details>
<summary><strong>1. 姓名与站点文案</strong> — <code>lib/site-config.ts</code></summary>

站长相关数据集中在这一文件：姓名（字标、元数据、聊天）、副标题、描述、各色板标语、研究方向、概念页、机构、人物、精选论文、页脚链接、聊天开场与快捷按钮。

侧栏和首页目录由 `lib/site-navigation.ts` 根据该配置生成。不存在的页面会跳过，空分组会隐藏。

</details>

<details>
<summary><strong>2. Wiki 页面</strong> — <code>wiki/*.md</code></summary>

| 页面 | 说明 |
| --- | --- |
| 主页 | `wiki/Your_Name.md` + `Your_Name_zh.md` — 显示名来自 `title` / `name` |
| 主题 / 论文 / CV … | 其他 `wiki/*.md`；用 `npm run new:wiki` 新建 |
| 研究方向 | 重命名 `Research_Area_1`–`3`（及 `_zh`），再改 `researchAreas` 里的 slug |

可参考：`Example_Concept.md`（公式、图、`relations`）、`Example_Paper.md`（论文卡）、`Example_University.md`（机构信息框）、`Your_Name.md`（人物 + 相册）、`Draft_Example.md`（`hidden: true`）。

改完后：

```bash
npm run maintain:wiki
npm run lint:wiki && npm run lint:content && npm run lint:okf
```

每页的 `reviewed_at` 需晚于 `modified`。写作说明：`docs/content-template.md`。

</details>

<details>
<summary><strong>3. 资源与品牌</strong> — <code>public/</code>、GitHub 链接、“MyWiki”</summary>

| 内容 | 位置 |
| --- | --- |
| 头像、图标、论文配图 | `public/images/`、`public/site-icons/`、`public/mywiki-icon.png`、`public/papers/<id>/` |
| “在 GitHub 编辑” | `components/ArticleTabs.tsx`、`app/wiki/[slug]/page.tsx`（`your-username/your-wiki`） |
| 站名 “MyWiki” | 全库搜索 `MyWiki` |
| 更新 / 论文卡 | `lib/site-updates.ts`（论文需完整 `paper_highlight`） |
| 版权人 | `LICENSE`、`LICENSING.md` |

</details>

<details>
<summary><strong>4. 环境变量（均可选）</strong> — AI、地图、URL</summary>

不配也能构建；AI / 地图会自动关掉。详见 `docs/chat/env.example`、`docs/chat/README.md`、`docs/site-activity/README.md`。

| 变量 | 用途 |
| --- | --- |
| `YUNWU_API_KEY`、`YUNWU_API_BASE_URL`、`CHAT_MODEL` | 页内 AI 的 OpenAI 兼容接口 |
| `SITE_OWNER_NAME` | 助手谈及的名字 |
| `NEXT_PUBLIC_SITE_OWNER_NAME`、`NEXT_PUBLIC_SITE_OWNER_NAME_ZH` | 字标 / 元数据 / 聊天文案（也可改 `lib/site-config.ts`） |
| `NEXT_PUBLIC_CONTACT_EMAIL` | 页脚 Email |
| `SITE_CHAT_VOICE_STYLE`、`SITE_CHAT_SIGNATURE_EN`、`SITE_CHAT_SIGNATURE_ZH` | 可选语气 / 落款 |
| `UPSTASH_REDIS_REST_URL`、`UPSTASH_REDIS_REST_TOKEN` | 限流 + 访客地图 |
| `RATE_LIMIT_SALT` | 匿名哈希盐 |
| `SITE_CHAT_ADMIN_TOKEN` | 私有访问报告 Bearer |
| `SITE_ACTIVITY_OWNER_PASSWORD_HASH` | 站长访问排除 |
| `NEXT_PUBLIC_SITE_URL` | 正式地址（默认 `https://example.com`） |
| `NEXT_PUBLIC_BASE_PATH` | 子路径部署（如 GitHub Pages） |

不要提交 `.env*` 或真实密钥。

</details>

<details>
<summary><strong>5. 部署</strong> — 推荐 Vercel</summary>

- 按 Next.js 15 导入，配置环境变量后部署。AI / 地图需要服务端；纯静态导出时会关掉。
- 绑自己的域名，设好 `NEXT_PUBLIC_SITE_URL`，再重新部署。
- 若保留 CI（`.github/workflows/ci.yml`），推送 / PR 会跑检查与构建。

</details>

<p align="right"><a href="#top">返回顶部</a></p>
