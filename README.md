<a id="top"></a>

<p align="center">
  <a href="#english"><img src="https://img.shields.io/badge/English-3366cc?style=for-the-badge" height="28" alt="Jump to English" /></a>
  <a href="#simplified-chinese"><img src="https://img.shields.io/badge/简体中文-6b4fbb?style=for-the-badge" height="28" alt="跳转到简体中文" /></a>
</p>

<div align="center">
  <img src="public/xinbaopedia-icon.png" width="96" alt="XinbaoWiki" />

  # XinbaoWiki

  **A bilingual academic homepage organized as a Wiki: you can browse it, search it, and ask questions about a page—with citations.**

  **双语学术主页，按 Wiki 来组织：可以浏览、可以搜索，也可以就某一页提问，并看到引用来源。**

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

This README is meant for someone who has not used the project before. Read the headings in order for the overall flow; expand a section when you need that step’s detail.

### Which branch to use

| Branch | What it is |
| --- | --- |
| [`template`](https://github.com/XinbaoQiao/XinbaoWiki/tree/template) | **Public starter.** Placeholder text only (“Your Name”, sample pages, no owner photos). |
| [`main`](https://github.com/XinbaoQiao/XinbaoWiki/tree/main) | **Source of the live site** at [xinbaopedia.top](https://xinbaopedia.top). |

To build your own site, start from **`template`**. Use `main` when you want to study or contribute to the live example.

### How to start

Pick **one** way to get the `template` files, then run the site locally and replace the placeholders. The three paths below differ in how you obtain the files.

<details>
<summary><strong>Path A — Open on GitHub</strong> (read first)</summary>

<p>Open the repository and switch the branch menu to <code>template</code>, or go directly to <a href="https://github.com/XinbaoQiao/XinbaoWiki/tree/template">github.com/XinbaoQiao/XinbaoWiki/tree/template</a>.</p>

<p>You should see placeholder wording such as “Your Name” and “Example University”. If you still see a personal CV, owner photos, or a live domain, you are still looking at <code>main</code>.</p>

</details>

<details>
<summary><strong>Path B — Clone only <code>template</code></strong></summary>

<p>Clone a single branch so your working copy starts from the cleaned starter:</p>

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
<summary><strong>Path C — Fork, then switch to <code>template</code></strong></summary>

<p>Fork the repository on GitHub. In <em>your</em> fork, select branch <strong><code>template</code></strong> (or create a working branch from it), clone that fork, and check the branch out before you edit.</p>

<p>Starting from <code>main</code> also copies personal Wiki pages and media. For a clean starter, use <code>template</code>.</p>

</details>

<details>
<summary><strong>Then — Run locally</strong></summary>

<p>Use Node 22 (see <code>.nvmrc</code>). Install dependencies and start the development server:</p>

```bash
npm ci
npm run dev        # http://localhost:3000
```

<p>Before you deploy, refresh generated Wiki files and run the checks:</p>

```bash
npm run maintain:wiki
npm run check
npm run build
```

</details>

<details>
<summary><strong>Then — Replace the placeholders</strong></summary>

<p>Most personalization sits in a few places. Change your identity and site wording first, then replace sample Wiki pages and images.</p>

| Goal | Where to edit |
| --- | --- |
| Name, short taglines, research areas, chat starters | `lib/site-config.ts` |
| Wiki pages (English + Chinese) | `wiki/*.md` — each `Foo.md` has a twin `Foo_zh.md` |
| Canonical site URL | `NEXT_PUBLIC_SITE_URL` |
| Avatar, icons, figures | `public/` |
| Optional page assistant / visitor map | environment variables — see `docs/chat/README.md` and `docs/site-activity/README.md` |

<p>After you change Wiki pages, run <code>npm run maintain:wiki</code>. A longer checklist is in the README on the <code>template</code> branch itself.</p>

</details>

### Live example

[xinbaopedia.top](https://xinbaopedia.top) is the production site built from `main`. Use it to see how the finished product feels; build your own site from `template`.

### What you get

These are the main things that set the site apart for a visitor. Expand a section for a short description.

<details>
<summary><strong>A. Browse and read</strong> — homepage and Wiki articles</summary>

<p>The homepage centers on a wordmark. Visitors can expand or collapse the surrounding content to move between a compact view and a full reading view on the same page. Several color themes (blue, gold, green, charcoal, plus an automatic option) keep the chrome and accents consistent. Latest updates can show in a compact or a fuller layout.</p>

<p>Wiki articles are ordinary Markdown files under <code>wiki/</code>. On the site they appear with a sidebar, a table of contents, math rendering, and paper highlight cards when a page provides them. Open any <code>/wiki/...</code> route on the live example to see the reading layout.</p>

</details>

<details>
<summary><strong>B. Find your way</strong> — directory, overview view, and bilingual search</summary>

<p>A curated directory groups people, topics, papers, and institutions for structured browsing. An overview “cube” view sits alongside the list layout when a denser map of the same pages is useful.</p>

<p>Site search covers titles, alternative names, summaries, and body text in both English and Chinese. Results always lead back to Wiki pages, so browsing and searching share one set of sources.</p>

</details>

<details>
<summary><strong>C. Ask about the current page</strong> — answers with citations</summary>

<p>When this feature is configured, a visitor can ask questions about the page they are reading. Answers stay with that page’s content and include numbered citations the reader can check. Questions beyond the page continue in ordinary chat.</p>

<p>Setup needs an OpenAI-compatible API endpoint. Notes and environment variables are under <code>docs/chat/</code>. The rest of the site builds and runs on its own; the assistant turns on after those settings are in place.</p>

</details>

<details>
<summary><strong>D. Optional extras</strong> — visitor map, wallpaper, export for agents</summary>

<p>A visitor map appears when Redis credentials (Upstash) are present; with no credentials it shows an empty map. Settings also offer an owner wallpaper and mixed background modes. First-time visitors start with the mixed background to keep the initial load light.</p>

<p>The folder <code>public/okf/</code> is a machine-readable export rebuilt from the Wiki. Edit the Markdown sources, then regenerate this folder as derived output.</p>

</details>

### How pages are organized

Pages are Markdown files, each labeled with a page kind so the site can group them sensibly. In plain terms the library looks like the tree below. (The technical label stored at the top of each file is shown in parentheses where it helps.) Hidden or draft pages may stay out of public navigation.

```text
Wiki home index
├── About the person
│   ├── Biography / person page (PhD student)
│   ├── CV summary
│   ├── Education timeline
│   ├── Research experience
│   └── Technical skills
├── Research
│   ├── Research overview
│   ├── Research topics
│   ├── Research concepts (key ideas on their own pages)
│   └── Model families
├── Papers and projects
│   ├── Publication list
│   ├── Individual paper pages (publication)
│   └── Project overviews
├── Institutions and advisors
│   ├── Universities (Public research university)
│   ├── Research institutes
│   └── Academic advisors
└── Site notes (optional)
    ├── Resource inventory
    ├── Maintenance log
    └── Style notes
```

Each topic lives in one Markdown file. The Chinese twin uses the same filename stem with a `_zh` suffix, and points back to the English page. Inside the prose, links between pages use double-bracket **Wikilinks** (`[[Like This]]`). Stronger typed links (related, uses, cites, and similar) sit in the page header metadata; see [docs/relation-taxonomy.md](docs/relation-taxonomy.md). Writing conventions are in [docs/content-template.md](docs/content-template.md).

### How `template` stays current

Every push to `main` runs [Sync template branch](https://github.com/XinbaoQiao/XinbaoWiki/actions/workflows/sync-template.yml). The workflow cleans `main` (removes personal paths, rewrites owner strings, and overlays sample Wiki pages and images), runs a leak check, then installs and builds the cleaned tree before updating the public `template` branch.

You can also run the workflow by hand from Actions → **Sync template branch** → Run workflow. Confirm success on [tree/template](https://github.com/XinbaoQiao/XinbaoWiki/tree/template); commit messages look like `Sync template from main <sha>`.

<details>
<summary><strong>Repository map</strong></summary>

```text
app/           pages and same-site API routes
components/    Wiki, search, theme, and chat UI
lib/           parsing, search helpers, prompts, navigation
wiki/          bilingual Markdown source
public/okf/    generated export for agents
scripts/       maintenance, checks, release; template cleaner (main only)
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

这份说明面向第一次接触本项目的人。按标题顺序阅读，就能把握整体流程；需要某一步的细节时，再展开对应小节。

### 用哪个分支

| 分支 | 是什么 |
| --- | --- |
| [`template`](https://github.com/XinbaoQiao/XinbaoWiki/tree/template) | **公开起步包。** 只有占位内容（「Your Name」、示例页面，无站主照片）。 |
| [`main`](https://github.com/XinbaoQiao/XinbaoWiki/tree/main) | **正式站源码**，对应 [xinbaopedia.top](https://xinbaopedia.top)。 |

搭建自己的站点，请从 **`template`** 开始。研究或贡献正式站示例时，再以 `main` 为工作底稿。

### 如何开始

用下面 **三种方式之一** 取得 `template` 文件，再在本地运行并替换占位内容。三条路径分别对应不同的取文件方式。

<details>
<summary><strong>路径 A — 在 GitHub 上打开</strong>（先阅读）</summary>

<p>打开本仓库，在分支菜单中选择 <code>template</code>；也可直接访问 <a href="https://github.com/XinbaoQiao/XinbaoWiki/tree/template">github.com/XinbaoQiao/XinbaoWiki/tree/template</a>。</p>

<p>页面上应出现「Your Name」「Example University」一类占位文案。若仍是个人简历、站主照片或真实域名，说明当前仍在 <code>main</code>。</p>

</details>

<details>
<summary><strong>路径 B — 只克隆 <code>template</code></strong></summary>

<p>建议只克隆该分支，使本地工作区从清理后的起步包开始：</p>

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
<summary><strong>路径 C — 先 Fork，再切到 <code>template</code></strong></summary>

<p>在 GitHub 上 Fork 本仓库。进入<strong>你的</strong> fork 后，选择分支 <strong><code>template</code></strong>（或基于它再建工作分支），克隆该 fork，并确认已切换到该分支后再改内容。</p>

<p>从 <code>main</code> 起步会一并带入个人 Wiki 与媒体。需要干净起步包时，请使用 <code>template</code>。</p>

</details>

<details>
<summary><strong>然后 — 在本地运行</strong></summary>

<p>请使用 Node 22（见 <code>.nvmrc</code>）。安装依赖后启动开发服务器：</p>

```bash
npm ci
npm run dev        # http://localhost:3000
```

<p>部署前请刷新由 Wiki 生成的文件，并完成检查：</p>

```bash
npm run maintain:wiki
npm run check
npm run build
```

</details>

<details>
<summary><strong>然后 — 替换占位内容</strong></summary>

<p>个性化主要集中在少数位置：先改身份与站点文案，再替换示例 Wiki 页面与图片。</p>

| 目标 | 修改处 |
| --- | --- |
| 姓名、短标语、研究领域、快捷提问 | `lib/site-config.ts` |
| Wiki 页面（中英文） | `wiki/*.md` — 每个 `Foo.md` 对应 `Foo_zh.md` |
| 站点规范 URL | `NEXT_PUBLIC_SITE_URL` |
| 头像、图标、插图 | `public/` |
| 可选页内助手 / 访客地图 | 环境变量 — 见 `docs/chat/README.md`、`docs/site-activity/README.md` |

<p>修改 Wiki 后请运行 <code>npm run maintain:wiki</code>。更完整的清单见 <code>template</code> 分支上的 README。</p>

</details>

### 在线示例

[xinbaopedia.top](https://xinbaopedia.top) 是由 `main` 构建的正式站。用它感受成品效果；搭建自己的站点请基于 `template`。

### 你会得到什么

下面是访客能直接感受到的主要特点。需要细节时再展开。

<details>
<summary><strong>A. 浏览与阅读</strong> — 首页与 Wiki 正文</summary>

<p>首页以字标为中心。访客可以展开或收起周围内容，在同一页上于紧凑视图与完整阅读视图之间切换。多种配色主题（蓝、金、绿、炭灰，以及自动模式）会统一作用于站点框架与强调色。最新动态支持紧凑或更完整的展示。</p>

<p>Wiki 正文是 <code>wiki/</code> 下的普通 Markdown 文件。在站点上会带有侧栏、目录、数学公式渲染，以及在页面提供时出现的论文卡片。可在正式站任意打开 <code>/wiki/...</code> 页面查看阅读布局。</p>

</details>

<details>
<summary><strong>B. 找到内容</strong> — 目录、总览视图与双语搜索</summary>

<p>结构化目录按人物、主题、论文与机构分组，便于按类别浏览。总览用的「立方体」视图与列表布局并列，适合需要更密的一览时使用。</p>

<p>站内搜索覆盖标题、别名、摘要与正文，并同时支持中英文。结果始终回到 Wiki 页面，因此浏览与搜索共用同一套内容来源。</p>

</details>

<details>
<summary><strong>C. 就当前页提问</strong> — 带引用的回答</summary>

<p>配置完成后，访客可以就正在阅读的页面提问。回答依据该页内容，并给出可核对的编号引用。超出页面范围的问题进入普通对话。</p>

<p>启用该功能需要 OpenAI 兼容的接口。说明与环境变量见 <code>docs/chat/</code>。站点其余部分可独立构建与运行；配置完成后即可使用助手。</p>

</details>

<details>
<summary><strong>D. 可选附加功能</strong> — 访客地图、壁纸、供工具读取的导出</summary>

<p>提供 Redis（Upstash）凭证时会显示访客地图；未配置时显示空图。设置中还可切换站主壁纸与混合背景；首次访客默认使用混合背景，以减轻初次加载。</p>

<p><code>public/okf/</code> 是由 Wiki 重新生成、便于程序读取的导出目录。修改 Markdown 源文件后重新生成即可，该目录为派生结果。</p>

</details>

### 页面如何组织

页面都是 Markdown 文件，并带有页面种类标记，方便站点分组展示。用日常说法，内容库大致如下。（必要时在括号里注明文件顶部保存的技术类型名。）隐藏或草稿页可以不进入公开导航。

```text
Wiki 首页索引
├── 关于本人
│   ├── 人物 / 传记页（博士生）
│   ├── CV 摘要
│   ├── 教育时间线
│   ├── 研究经历
│   └── 技术技能
├── 研究
│   ├── 研究概览
│   ├── 研究专题
│   ├── 研究概念（单独成页的关键想法）
│   └── 模型族
├── 论文与项目
│   ├── 论文列表
│   ├── 单篇论文页（publication）
│   └── 项目概览
├── 机构与导师
│   ├── 大学（公立研究型大学）
│   ├── 研究院
│   └── 学术导师
└── 站点说明（可选）
    ├── 资源记录
    ├── 维护日志
    └── 文风说明
```

每个主题对应一个 Markdown 文件；中文双页使用相同词干并加 `_zh` 后缀，并指向对应的英文页。正文里用双方括号的 **Wikilink**（如 `[[这样写]]`）互链。更强的类型化链接（相关、使用、引用等）写在页面开头的元数据里，详见 [docs/relation-taxonomy.md](docs/relation-taxonomy.md)。写作约定见 [docs/content-template.md](docs/content-template.md)。

### `template` 如何保持更新

每次向 `main` 推送都会触发 [Sync template branch](https://github.com/XinbaoQiao/XinbaoWiki/actions/workflows/sync-template.yml)。工作流会清理 `main`（删除个人路径、改写站主字符串，并覆盖示例 Wiki 与图片），执行泄漏检查，再在清理后的目录中安装依赖并构建，最后更新公开的 `template` 分支。

也可在 Actions → **Sync template branch** → Run workflow 手动运行。成功后请到 [tree/template](https://github.com/XinbaoQiao/XinbaoWiki/tree/template) 确认，提交信息形如 `Sync template from main <sha>`。

<details>
<summary><strong>仓库地图</strong></summary>

```text
app/           页面与同站 API
components/    Wiki、搜索、主题与对话界面
lib/           解析、搜索辅助、提示词与导航
wiki/          双语 Markdown 源
public/okf/    生成的、供工具读取的导出
scripts/       维护、检查、发布；模板清理脚本（仅 main）
docs/          内容、对话与部署说明
```

</details>

<details>
<summary><strong>许可</strong></summary>

<p>软件以 <a href="LICENSE">MIT</a> 许可发布。可授权的原创 Wiki / 文档文本以 <a href="LICENSES/CC-BY-4.0.txt">CC BY 4.0</a> 提供。个人媒体与第三方资源不在该授权范围内，边界说明见 <a href="LICENSING.md">LICENSING.md</a>。</p>

</details>

<p align="right"><a href="#top">回到顶部 ↑</a></p>
