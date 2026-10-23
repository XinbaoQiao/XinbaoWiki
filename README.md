<a id="top"></a>

<p align="center">
  <a href="#english"><img src="https://img.shields.io/badge/English-3366cc?style=for-the-badge" height="28" alt="Jump to English" /></a>
  <a href="#simplified-chinese"><img src="https://img.shields.io/badge/简体中文-6b4fbb?style=for-the-badge" height="28" alt="跳转到简体中文" /></a>
</p>

<div align="center">
  <img src="public/xinbaopedia-icon.png" width="96" alt="XinbaoWiki" />

  # XinbaoWiki

  **A bilingual academic homepage organized as a Wiki: browseable, searchable, and askable—with citations.**

  **双语学术主页，按 Wiki 组织：可浏览、可检索，也可带着引用来提问。**

  <p>
    <a href="https://github.com/XinbaoQiao/XinbaoWiki/tree/template"><img src="https://img.shields.io/badge/START_HERE-template%20branch-1d1d1f?style=for-the-badge" height="31" alt="Open the template branch" /></a>
    <a href="https://xinbaopedia.top"><img src="https://img.shields.io/badge/EXAMPLE-live%20site-0071e3?style=for-the-badge" height="31" alt="Open live example" /></a>
  </p>

  <p>
    <a href="https://github.com/XinbaoQiao/XinbaoWiki/actions/workflows/ci.yml"><img src="https://github.com/XinbaoQiao/XinbaoWiki/actions/workflows/ci.yml/badge.svg" alt="CI status" /></a>
    <a href="https://github.com/XinbaoQiao/XinbaoWiki/actions/workflows/sync-template.yml"><img src="https://github.com/XinbaoQiao/XinbaoWiki/actions/workflows/sync-template.yml/badge.svg" alt="Sync template branch" /></a>
    <a href="LICENSING.md"><img src="https://img.shields.io/badge/License-MIT%20%2B%20CC%20BY%204.0-6b4fbb" alt="Licensing" /></a>
  </p>
</div>

---

<a id="english"></a>

## English

### Branches

| Branch | Role |
| --- | --- |
| [`template`](https://github.com/XinbaoQiao/XinbaoWiki/tree/template) | **Public starter.** Placeholders only (“Your Name”, sample pages, no owner photos). |
| [`main`](https://github.com/XinbaoQiao/XinbaoWiki/tree/main) | **Live site source** for [xinbaopedia.top](https://xinbaopedia.top). |

If you want your own site, start from **`template`**, not from `main`.

### How to use the template

<details>
<summary><strong>1. Open the <code>template</code> branch</strong></summary>

<p>On GitHub, open the repository, open the branch dropdown, and select <code>template</code>. You can also go directly to <a href="https://github.com/XinbaoQiao/XinbaoWiki/tree/template">github.com/XinbaoQiao/XinbaoWiki/tree/template</a>.</p>

<p>You should see placeholder copy such as “Your Name” and “Example University”. If you instead see a personal CV, photos, or a live domain, you are still on <code>main</code>.</p>

</details>

<details>
<summary><strong>2. Clone only <code>template</code></strong></summary>

<p>Clone a single branch so your working tree starts from the sanitized starter:</p>

```bash
git clone -b template --single-branch https://github.com/XinbaoQiao/XinbaoWiki.git my-wiki
cd my-wiki
```

<p>If you already cloned the full repository:</p>

```bash
git fetch origin template
git checkout template
```

</details>

<details>
<summary><strong>3. Fork, then switch to <code>template</code></strong></summary>

<p>Fork the repository on GitHub. In your fork, select branch <strong><code>template</code></strong> (or create a working branch from it). Clone <em>your</em> fork and check that branch out before you edit content.</p>

<p>Starting from <code>main</code> will copy personal Wiki pages and media into your project. Prefer <code>template</code> unless you deliberately want that material.</p>

</details>

<details>
<summary><strong>4. Run locally</strong></summary>

<p>Use Node 22 (see <code>.nvmrc</code>). Install dependencies, then start the development server:</p>

```bash
npm ci
npm run dev        # http://localhost:3000
```

<p>Before you deploy, regenerate derived Wiki artifacts and run the checks:</p>

```bash
npm run maintain:wiki
npm run check
npm run build
```

</details>

<details>
<summary><strong>5. Replace placeholders</strong></summary>

<p>Most personalization lives in a small set of files. Change identity and navigation first, then replace sample Wiki pages and public assets.</p>

| Goal | Edit |
| --- | --- |
| Name, taglines, research areas, chat starters | `lib/site-config.ts` |
| Wiki pages (English + Chinese) | `wiki/*.md` — each `Foo.md` has a twin `Foo_zh.md` |
| Canonical site URL | `NEXT_PUBLIC_SITE_URL` |
| Avatar, icons, figures | `public/` |
| Optional page AI / visitor map | env vars — see `docs/chat/README.md` and `docs/site-activity/README.md` |

<p>After Wiki edits, run <code>npm run maintain:wiki</code>. The longer checklist lives in the README on the <code>template</code> branch itself.</p>

</details>

### Live example

[xinbaopedia.top](https://xinbaopedia.top) is the production site built from `main`. Use it to understand the product; build your own site from `template`.

### What’s inside

Folded summaries below form the outline. Expand a section for a full description of that part of the system.

<details>
<summary><strong>A. Home &amp; reading</strong> — wordmark, themes, updates, Wiki article layout</summary>

<p>The homepage centers on a wordmark that expands and collapses the surrounding content, so a visitor can move between a compact view and a full reading surface without leaving the page. Theme palettes (blue, gold, green, charcoal, and an automatic option) recolor chrome and accents consistently across the site.</p>

<p>Latest updates appear in compact or full form. Wiki articles are rendered from <code>wiki/*.md</code> with a sidebar, table of contents, KaTeX mathematics, and paper highlight cards where frontmatter provides them. Open any <code>/wiki/...</code> route on the live example to see the reading layout in context.</p>

</details>

<details>
<summary><strong>B. Browse &amp; search</strong> — directory, cube view, bilingual retrieval</summary>

<p>A curated directory groups people, topics, papers, and institutions so the site can be explored without relying only on free-text search. A browse “cube” view complements the list layout when a visitor wants a denser overview of the same graph.</p>

<p>Site search covers titles, aliases, summaries, and body text in both English and Chinese. Results stay tied to Wiki pages, so navigation and retrieval share one content model rather than a separate CMS index.</p>

</details>

<details>
<summary><strong>C. Ask with citations</strong> — optional page AI</summary>

<p>When configured, page AI answers questions against the current Wiki page and returns numbered citations a reader can verify. Questions that fall outside the page fall back to ordinary chat rather than inventing unsupported claims.</p>

<p>The feature expects an OpenAI-compatible endpoint. Setup notes, environment variables, and operational details are documented under <code>docs/chat/</code>. Without those variables, the rest of the site continues to build and run; only the assistant stays unavailable.</p>

</details>

<details>
<summary><strong>D. Optional extras</strong> — visitor atlas, wallpaper, OKF export</summary>

<p>Visitor atlas uses Upstash Redis when credentials are present and shows an empty map otherwise. Owner wallpaper and mixed palette modes are available in settings; first-time visitors default to the mixed background so the site does not preload a heavy image.</p>

<p><code>public/okf/**</code> is an agent-readable export regenerated from the Wiki. Treat it as a derived bundle: edit Markdown sources, then regenerate, rather than hand-editing the export.</p>

</details>

<details>
<summary><strong>E. Content model</strong> — page types, twins, and relations</summary>

<p>Content is organized as a small taxonomy rather than a flat blog. A typical hierarchy looks like this:</p>

```text
Person / Home
├── Research topics
├── Papers & projects
├── Institutions & people
└── Notes / drafts (may be hidden)
```

<p>Each idea lives in one Markdown file. The Chinese twin uses the same stem with a <code>_zh</code> suffix. In-body links use <code>[[Wikilinks]]</code>. Stronger typed links live in frontmatter <code>relations</code> (<code>related</code>, <code>uses</code>, <code>depends-on</code>, <code>cites</code>, and related keys); see <a href="docs/relation-taxonomy.md">docs/relation-taxonomy.md</a>. Writing conventions are summarized in <a href="docs/content-template.md">docs/content-template.md</a>.</p>

</details>

### How `template` stays current

Every push to `main` runs [Sync template branch](https://github.com/XinbaoQiao/XinbaoWiki/actions/workflows/sync-template.yml). The workflow sanitizes `main` (removing personal paths, rewriting owner strings, and overlaying sample Wiki pages and images), runs a leak check, then installs and builds the sanitized tree before updating the public `template` branch.

You can also run the workflow manually from Actions → **Sync template branch** → Run workflow. Confirm success on [tree/template](https://github.com/XinbaoQiao/XinbaoWiki/tree/template); commit messages look like `Sync template from main <sha>`.

<details>
<summary><strong>Repository map</strong></summary>

```text
app/           pages and same-site API routes
components/    Wiki, search, theme, and chat UI
lib/           parsing, retrieval, prompts, navigation
wiki/          bilingual Markdown source
public/okf/    generated agent-readable bundle
scripts/       maintenance, eval, release; template sanitizer (main only)
docs/          content, chat, and deployment notes
```

</details>

<details>
<summary><strong>Licensing</strong></summary>

<p>Software is released under the <a href="LICENSE">MIT License</a>. Licensable original Wiki and documentation text is offered under <a href="LICENSES/CC-BY-4.0.txt">CC BY 4.0</a>. Personal media and third-party assets are excluded from that grant; see <a href="LICENSING.md">LICENSING.md</a> for the precise boundary.</p>

</details>

<p align="right"><a href="#top">Back to top ↑</a></p>

---

<a id="simplified-chinese"></a>

## 简体中文

### 分支

| 分支 | 作用 |
| --- | --- |
| [`template`](https://github.com/XinbaoQiao/XinbaoWiki/tree/template) | **公开起步包。** 仅含占位内容（「Your Name」、示例页面，无站主照片）。 |
| [`main`](https://github.com/XinbaoQiao/XinbaoWiki/tree/main) | **正式站源码**，对应 [xinbaopedia.top](https://xinbaopedia.top)。 |

若要搭建自己的站点，请从 **`template`** 开始，不要直接以 `main` 为底稿。

### 使用模板

<details>
<summary><strong>1. 打开 <code>template</code> 分支</strong></summary>

<p>在 GitHub 打开本仓库，点开分支下拉菜单并选择 <code>template</code>；也可直接访问 <a href="https://github.com/XinbaoQiao/XinbaoWiki/tree/template">github.com/XinbaoQiao/XinbaoWiki/tree/template</a>。</p>

<p>页面上应出现「Your Name」「Example University」一类占位文案。若仍是个人简历、照片或真实域名，说明当前仍在 <code>main</code>。</p>

</details>

<details>
<summary><strong>2. 只克隆 <code>template</code></strong></summary>

<p>建议只克隆该分支，使工作区从去个性化后的起步包开始：</p>

```bash
git clone -b template --single-branch https://github.com/XinbaoQiao/XinbaoWiki.git my-wiki
cd my-wiki
```

<p>若已经克隆过完整仓库：</p>

```bash
git fetch origin template
git checkout template
```

</details>

<details>
<summary><strong>3. 先 Fork，再切到 <code>template</code></strong></summary>

<p>在 GitHub 上 Fork 本仓库。进入你的 fork 后，选择分支 <strong><code>template</code></strong>（或基于它再建工作分支）。克隆<strong>你的</strong> fork，并确认已 checkout 到该分支后再改内容。</p>

<p>从 <code>main</code> 起步会把个人 Wiki 与媒体一并带入项目。除非你有意保留这些材料，否则请优先使用 <code>template</code>。</p>

</details>

<details>
<summary><strong>4. 本地运行</strong></summary>

<p>请使用 Node 22（见 <code>.nvmrc</code>）。安装依赖后启动开发服务器：</p>

```bash
npm ci
npm run dev        # http://localhost:3000
```

<p>部署前请重新生成 Wiki 派生文件并完成检查：</p>

```bash
npm run maintain:wiki
npm run check
npm run build
```

</details>

<details>
<summary><strong>5. 替换占位内容</strong></summary>

<p>个性化主要集中在少数文件：先改身份与导航，再替换示例 Wiki 页面与静态资源。</p>

| 目标 | 修改处 |
| --- | --- |
| 姓名、标语、研究领域、快捷提问 | `lib/site-config.ts` |
| Wiki 页面（中英文） | `wiki/*.md` — 每个 `Foo.md` 对应 `Foo_zh.md` |
| 站点规范 URL | `NEXT_PUBLIC_SITE_URL` |
| 头像、图标、插图 | `public/` |
| 可选页内 AI / 访客地图 | 环境变量 — 见 `docs/chat/README.md`、`docs/site-activity/README.md` |

<p>修改 Wiki 后请运行 <code>npm run maintain:wiki</code>。更完整的清单见 <code>template</code> 分支上的 README。</p>

</details>

### 在线示例

[xinbaopedia.top](https://xinbaopedia.top) 是由 `main` 构建的正式站。用它了解产品形态；搭建自己的站点请基于 `template`。

### 内容结构

折叠时只看大纲；展开后是对应模块的完整说明。

<details>
<summary><strong>A. 首页与阅读</strong> — 字标、主题、动态、Wiki 正文布局</summary>

<p>首页以字标为中心，可展开或收起周围内容，使访客在紧凑视图与完整阅读面之间切换而无需离开页面。主题配色（蓝、金、绿、炭灰，以及自动模式）会统一作用于站点框架与强调色。</p>

<p>最新动态支持紧凑或完整展示。Wiki 正文由 <code>wiki/*.md</code> 渲染，并带有侧栏、目录、KaTeX 公式，以及在 frontmatter 提供时出现的论文卡片。可在正式站任意打开 <code>/wiki/...</code> 页面查看阅读布局。</p>

</details>

<details>
<summary><strong>B. 浏览与检索</strong> — 目录、立方体视图、双语检索</summary>

<p>结构化目录按人物、主题、论文与机构分组，使站点不必只依赖自由文本搜索即可浏览。立方体视图在需要更密的总览时，与列表布局互补。</p>

<p>站内检索覆盖标题、别名、摘要与正文，并同时支持中英文。结果始终落回 Wiki 页面，因此导航与检索共用同一套内容模型，而不是另起一套 CMS 索引。</p>

</details>

<details>
<summary><strong>C. 带引用的提问</strong> — 可选页内 AI</summary>

<p>配置完成后，页内 AI 会尽量依据当前 Wiki 页面作答，并给出可核对的编号引用。超出页面范围的问题会回退到普通对话，而不是编造无依据的结论。</p>

<p>该功能需要 OpenAI 兼容接口。环境变量与运维说明见 <code>docs/chat/</code>。未配置时，站点其余部分仍可构建与运行，仅助手不可用。</p>

</details>

<details>
<summary><strong>D. 可选扩展</strong> — 访客地图、壁纸、OKF 导出</summary>

<p>访客地图在提供 Upstash Redis 凭证时启用，否则显示空图。设置中可切换站主壁纸与混合配色；首次访客默认使用混合背景，以避免预加载过大的图片。</p>

<p><code>public/okf/**</code> 是由 Wiki 重新生成的、便于 agent 阅读的导出包。请把它视为派生结果：修改 Markdown 源文件后再生成，而不要直接手改导出内容。</p>

</details>

<details>
<summary><strong>E. 内容模型</strong> — 页面类型、中英双页与关系</summary>

<p>内容按小型分类体系组织，而不是扁平博客。常见层级如下：</p>

```text
人物 / 主页
├── 研究主题
├── 论文与项目
├── 机构与人物
└── 笔记 / 草稿（可隐藏）
```

<p>每个主题对应一个 Markdown 文件；中文双页使用相同词干并加 <code>_zh</code> 后缀。正文内链使用 <code>[[Wikilinks]]</code>。更强的类型化链接写在 frontmatter 的 <code>relations</code> 中（如 <code>related</code>、<code>uses</code>、<code>depends-on</code>、<code>cites</code> 等），详见 <a href="docs/relation-taxonomy.md">docs/relation-taxonomy.md</a>。写作约定见 <a href="docs/content-template.md">docs/content-template.md</a>。</p>

</details>

### `template` 如何保持更新

每次向 `main` 推送都会触发 [Sync template branch](https://github.com/XinbaoQiao/XinbaoWiki/actions/workflows/sync-template.yml)。工作流会净化 `main`（删除个人路径、改写站主字符串，并覆盖示例 Wiki 与图片），执行泄漏检查，再在净化后的目录中安装依赖并构建，最后更新公开的 `template` 分支。

也可在 Actions → **Sync template branch** → Run workflow 手动运行。成功后请到 [tree/template](https://github.com/XinbaoQiao/XinbaoWiki/tree/template) 确认，提交信息形如 `Sync template from main <sha>`。

<details>
<summary><strong>仓库地图</strong></summary>

```text
app/           页面与同站 API
components/    Wiki、检索、主题与对话界面
lib/           解析、检索、提示词与导航
wiki/          双语 Markdown 源
public/okf/    生成的 agent 可读导出
scripts/       维护、评测、发布；模板净化脚本（仅 main）
docs/          内容、对话与部署说明
```

</details>

<details>
<summary><strong>许可</strong></summary>

<p>软件以 <a href="LICENSE">MIT</a> 许可发布。可授权的原创 Wiki / 文档文本以 <a href="LICENSES/CC-BY-4.0.txt">CC BY 4.0</a> 提供。个人媒体与第三方资源不在该授权范围内，边界说明见 <a href="LICENSING.md">LICENSING.md</a>。</p>

</details>

<p align="right"><a href="#top">回到顶部 ↑</a></p>
