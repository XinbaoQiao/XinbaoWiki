<a id="top"></a>

<p align="center">
  <a href="#english"><img src="https://img.shields.io/badge/English-3366cc?style=for-the-badge" height="28" alt="English" /></a>
  <a href="#simplified-chinese"><img src="https://img.shields.io/badge/简体中文-6b4fbb?style=for-the-badge" height="28" alt="简体中文" /></a>
</p>

<div align="center">
  <img src="public/mywiki-icon.png" width="96" alt="MyWiki" />

  # LLM Wiki Academic Homepage — Template

  **A bilingual, Wikipedia-style personal academic homepage: Markdown pages people can browse, and an AI that can cite them.**

  **双语、百科式的个人学术主页：用 Markdown 写页面，人也好读，也可让 AI 引用。**
</div>

> This is the `template` branch. **No personal data** — names, pages, images, and links are placeholders (“Your Name”, “Example University”, `you@example.com`). Replace them with your own.
>
> 这是 `template` 分支。**不含个人数据** — 姓名、页面、图片、链接都是占位内容，请改成你自己的。

---

<a id="english"></a>

## English

### What’s in the box

Folded summaries form the outline. Expand a section for the full description.

<details>
<summary><strong>A. Wiki &amp; reading</strong> — Markdown pages, bilingual twins, TOC, infobox, KaTeX, paper cards</summary>

<p>Site content lives in <code>wiki/*.md</code> with YAML frontmatter. Pages link to one another through <code>[[Wikilinks]]</code>. Every English page <code>Foo.md</code> has a Chinese twin <code>Foo_zh.md</code>.</p>

<p>The reading surface includes a sidebar, a homepage directory, title morphing between pages, a table of contents, an optional infobox, paper highlight cards, and KaTeX mathematics. Together these pieces make long-form academic notes readable without leaving the Wiki model.</p>

</details>

<details>
<summary><strong>B. Browse &amp; search</strong> — themes, cube view, site search</summary>

<p>Theme palettes (blue, gold, green, charcoal, and automatic) recolor the chrome consistently. A browse cube view complements the list layout when a denser overview helps.</p>

<p>Site search indexes titles, aliases, summaries, and body text so visitors can find pages without memorizing the directory structure.</p>

</details>

<details>
<summary><strong>C. Optional AI &amp; map</strong> — page AI with citations, visitor atlas</summary>

<p>Page AI is optional. When an OpenAI-compatible endpoint is configured, answers are grounded in the current Wiki page and return numbered citations a reader can check. Without credentials, the rest of the site still builds; only the assistant stays off.</p>

<p>Visitor atlas is likewise optional and uses Upstash Redis. If those variables are unset, the map remains empty rather than failing the build.</p>

</details>

<details>
<summary><strong>D. Export &amp; checks</strong> — OKF bundle, content lint</summary>

<p><code>public/okf/**</code> is an agent-readable export regenerated from the Wiki. After you edit Markdown sources, run maintenance and lint so the export and frontmatter stay consistent:</p>

```bash
npm run maintain:wiki
npm run lint:wiki && npm run lint:content && npm run lint:okf
```

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
<summary><strong>1. Name &amp; site copy</strong> — <code>lib/site-config.ts</code></summary>

<p>Owner-specific strings live in one configuration file: display name (wordmark, metadata, chat), subtitle, description, palette taglines, research areas, concept pages, institutions, people, selected papers, footer links, chat greeting, and quick-start buttons.</p>

<p>The sidebar and homepage directory are derived from this config by <code>lib/site-navigation.ts</code>. Missing pages are skipped; empty groups hide themselves so incomplete setups do not leave broken navigation.</p>

</details>

<details>
<summary><strong>2. Wiki pages</strong> — <code>wiki/*.md</code></summary>

| Page | Notes |
| --- | --- |
| Home | `wiki/Your_Name.md` + `Your_Name_zh.md` — display name from `title` / `name` |
| Topics / papers / CV / … | Other `wiki/*.md`; create with `npm run new:wiki` |
| Research areas | Rename `Research_Area_1`–`3` (and `_zh`), then update slugs in `researchAreas` |

<p>Useful examples to copy: <code>Example_Concept.md</code> (math, figure, <code>relations</code>), <code>Example_Paper.md</code> (paper card), <code>Example_University.md</code> (institution infobox), <code>Your_Name.md</code> (person + gallery), and <code>Draft_Example.md</code> (<code>hidden: true</code>).</p>

<p>After edits:</p>

```bash
npm run maintain:wiki
npm run lint:wiki && npm run lint:content && npm run lint:okf
```

<p>Each page needs <code>reviewed_at</code> later than <code>modified</code>. Writing guide: <code>docs/content-template.md</code>.</p>

</details>

<details>
<summary><strong>3. Assets &amp; branding</strong> — <code>public/</code>, GitHub links, “MyWiki”</summary>

| What | Where |
| --- | --- |
| Avatar, icons, paper figures | `public/images/`, `public/site-icons/`, `public/mywiki-icon.png`, `public/papers/<id>/` |
| “Edit on GitHub” | `components/ArticleTabs.tsx`, `app/wiki/[slug]/page.tsx` (`your-username/your-wiki`) |
| Site name “MyWiki” | search the repo for `MyWiki` |
| News / paper cards | `lib/site-updates.ts` (papers need a complete `paper_highlight`) |
| License holder | `LICENSE`, `LICENSING.md` |

</details>

<details>
<summary><strong>4. Environment variables (all optional)</strong> — AI, map, URL</summary>

<p>Without these variables the site still builds; AI and atlas simply stay off. See <code>docs/chat/env.example</code>, <code>docs/chat/README.md</code>, and <code>docs/site-activity/README.md</code>.</p>

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

<p>Never commit <code>.env*</code> files or real keys.</p>

</details>

<details>
<summary><strong>5. Deploy</strong> — Vercel recommended</summary>

<p>Import the project as Next.js 15, add environment variables, and deploy. API routes (AI, atlas) need a server runtime; a pure static export turns those features off.</p>

<p>Point your domain at the deployment, set <code>NEXT_PUBLIC_SITE_URL</code>, and redeploy. CI (<code>.github/workflows/ci.yml</code>) checks and builds on pushes and pull requests when you keep it enabled.</p>

</details>

<p align="right"><a href="#top">Back to top</a></p>

---

<a id="simplified-chinese"></a>

## 简体中文

### 箱子里有什么

折叠时看大纲；展开后是完整说明。

<details>
<summary><strong>A. Wiki 与阅读</strong> — Markdown、双语双页、目录、信息框、KaTeX、论文卡片</summary>

<p>站点内容写在 <code>wiki/*.md</code> 中，并带有 YAML frontmatter。页面之间通过 <code>[[Wikilinks]]</code> 互链。每个英文页 <code>Foo.md</code> 都有中文双页 <code>Foo_zh.md</code>。</p>

<p>阅读界面包含侧栏、首页目录、页面间标题过渡、正文目录、可选信息框、论文高亮卡片，以及 KaTeX 公式。这些能力合在一起，使长篇学术笔记仍可按 Wiki 方式阅读，而不必改成博客结构。</p>

</details>

<details>
<summary><strong>B. 浏览与检索</strong> — 主题配色、立方体视图、站内检索</summary>

<p>主题配色（蓝、金、绿、炭灰，以及自动模式）会统一作用于站点框架。立方体视图在需要更密总览时，与列表布局互补。</p>

<p>站内检索覆盖标题、别名、摘要与正文，使访客不必记住目录结构也能找到页面。</p>

</details>

<details>
<summary><strong>C. 可选 AI 与地图</strong> — 带引用的页内 AI、访客地图</summary>

<p>页内 AI 为可选项。配置 OpenAI 兼容接口后，回答会尽量依据当前 Wiki 页面，并给出可核对的编号引用。未配置时，站点其余部分仍可构建，仅助手不可用。</p>

<p>访客地图同样可选，依赖 Upstash Redis。未设置相关变量时地图保持为空，而不会导致构建失败。</p>

</details>

<details>
<summary><strong>D. 导出与检查</strong> — OKF 包、内容检查</summary>

<p><code>public/okf/**</code> 是由 Wiki 重新生成的、便于 agent 阅读的导出包。修改 Markdown 源文件后，请运行维护与检查，使导出与 frontmatter 保持一致：</p>

```bash
npm run maintain:wiki
npm run lint:wiki && npm run lint:content && npm run lint:okf
```

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

<p>与站主相关的字符串集中在这一份配置里：显示名（字标、元数据、对话）、副标题、描述、配色标语、研究领域、概念页、机构、人物、精选论文、页脚链接，以及对话问候语与快捷提问按钮。</p>

<p>侧栏与首页目录由 <code>lib/site-navigation.ts</code> 根据该配置推导。缺失页面会被跳过；空分组会自行隐藏，因此半成品配置不会留下断裂导航。</p>

</details>

<details>
<summary><strong>2. Wiki 页面</strong> — <code>wiki/*.md</code></summary>

| 页面 | 说明 |
| --- | --- |
| 主页 | `wiki/Your_Name.md` + `Your_Name_zh.md` — 显示名来自 `title` / `name` |
| 主题 / 论文 / CV / … | 其他 `wiki/*.md`；可用 `npm run new:wiki` 创建 |
| 研究领域 | 重命名 `Research_Area_1`–`3`（及 `_zh`），并更新 `researchAreas` 中的 slug |

<p>可参考的示例：<code>Example_Concept.md</code>（公式、插图、<code>relations</code>）、<code>Example_Paper.md</code>（论文卡片）、<code>Example_University.md</code>（机构信息框）、<code>Your_Name.md</code>（人物 + 图集），以及 <code>Draft_Example.md</code>（<code>hidden: true</code>）。</p>

<p>修改后请运行：</p>

```bash
npm run maintain:wiki
npm run lint:wiki && npm run lint:content && npm run lint:okf
```

<p>每个页面的 <code>reviewed_at</code> 应晚于 <code>modified</code>。写作约定见 <code>docs/content-template.md</code>。</p>

</details>

<details>
<summary><strong>3. 资源与品牌</strong> — <code>public/</code>、GitHub 链接、「MyWiki」</summary>

| 内容 | 位置 |
| --- | --- |
| 头像、图标、论文插图 | `public/images/`、`public/site-icons/`、`public/mywiki-icon.png`、`public/papers/<id>/` |
| 「在 GitHub 上编辑」 | `components/ArticleTabs.tsx`、`app/wiki/[slug]/page.tsx`（改为 `your-username/your-wiki`） |
| 站点名「MyWiki」 | 在仓库中搜索 `MyWiki` |
| 动态 / 论文卡片 | `lib/site-updates.ts`（论文需完整的 `paper_highlight`） |
| 许可权利人 | `LICENSE`、`LICENSING.md` |

</details>

<details>
<summary><strong>4. 环境变量（全部可选）</strong> — AI、地图、URL</summary>

<p>不配置这些变量时站点仍可构建；AI 与访客地图只会保持关闭。详见 <code>docs/chat/env.example</code>、<code>docs/chat/README.md</code>、<code>docs/site-activity/README.md</code>。</p>

| 变量 | 用途 |
| --- | --- |
| `YUNWU_API_KEY`、`YUNWU_API_BASE_URL`、`CHAT_MODEL` | 页内 AI 的 OpenAI 兼容接口 |
| `SITE_OWNER_NAME` | 助手谈论的姓名 |
| `NEXT_PUBLIC_SITE_OWNER_NAME`、`NEXT_PUBLIC_SITE_OWNER_NAME_ZH` | 字标 / 元数据 / 对话文案（也可改 `lib/site-config.ts`） |
| `NEXT_PUBLIC_CONTACT_EMAIL` | 页脚 Email |
| `SITE_CHAT_VOICE_STYLE`、`SITE_CHAT_SIGNATURE_EN`、`SITE_CHAT_SIGNATURE_ZH` | 可选语气 / 落款 |
| `UPSTASH_REDIS_REST_URL`、`UPSTASH_REDIS_REST_TOKEN` | 限流 + 访客地图 |
| `RATE_LIMIT_SALT` | 伪匿名哈希盐 |
| `SITE_CHAT_ADMIN_TOKEN` | 私有活动报告 Bearer |
| `SITE_ACTIVITY_OWNER_PASSWORD_HASH` | 排除站主访问 |
| `NEXT_PUBLIC_SITE_URL` | 规范站点 URL（默认 `https://example.com`） |
| `NEXT_PUBLIC_BASE_PATH` | 子路径部署（例如 GitHub Pages） |

<p>切勿提交 <code>.env*</code> 或真实密钥。</p>

</details>

<details>
<summary><strong>5. 部署</strong> — 推荐 Vercel</summary>

<p>按 Next.js 15 导入项目，配置环境变量后部署。AI / 地图等 API 路由需要服务端运行时；纯静态导出会使这些功能关闭。</p>

<p>绑定你的域名，设置 <code>NEXT_PUBLIC_SITE_URL</code>，然后重新部署。保留 CI（<code>.github/workflows/ci.yml</code>）时，推送 / PR 会跑检查与构建。</p>

</details>

<p align="right"><a href="#top">回到顶部</a></p>
