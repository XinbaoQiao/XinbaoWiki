<a id="top"></a>

<p align="center">
  <a href="#english"><img src="https://img.shields.io/badge/English-3366cc?style=for-the-badge" height="28" alt="Jump to English" /></a>
  <a href="#simplified-chinese"><img src="https://img.shields.io/badge/简体中文-6b4fbb?style=for-the-badge" height="28" alt="跳转到简体中文" /></a>
</p>

<div align="center">
  <img src="public/xinbaopedia-icon.png" width="96" alt="XinbaoWiki" />

  # XinbaoWiki

  **A bilingual academic homepage you can browse like a Wiki and ask like an LLM — with citations.**

  **一个可浏览、可搜索、可带引用追问的双语学术主页 / LLM Wiki 底座。**

  <p>
    <a href="https://github.com/XinbaoQiao/XinbaoWiki/tree/template"><img src="https://img.shields.io/badge/START-Template%20branch-1d1d1f?style=for-the-badge" height="31" alt="Open the template branch" /></a>
    <a href="https://xinbaopedia.top"><img src="https://img.shields.io/badge/EXAMPLE-Live%20site-0071e3?style=for-the-badge" height="31" alt="Open live example" /></a>
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

### Two branches, two jobs

| Branch | What it is | Who it is for |
| --- | --- | --- |
| [`template`](https://github.com/XinbaoQiao/XinbaoWiki/tree/template) | A **de-personalized** starter: placeholder names, sample Wiki pages, no owner media | Anyone who wants to build their own site |
| [`main`](https://github.com/XinbaoQiao/XinbaoWiki/tree/main) | The live product source for [xinbaopedia.top](https://xinbaopedia.top) | Site owner / maintainers |

**If you want to make your own homepage, use `template` — not `main`.**  
`main` keeps personal content. `template` is regenerated from `main` on every push (names, photos, and private strings are stripped first).

### Use the template (tutorial)

#### 1. Open the branch on GitHub

- Branch page: [github.com/XinbaoQiao/XinbaoWiki/tree/template](https://github.com/XinbaoQiao/XinbaoWiki/tree/template)
- Or on the repo homepage: branch dropdown → choose **`template`**

You should see placeholder copy such as “Your Name” / “Example University”, not a personal CV.

#### 2. Clone only the template

```bash
git clone -b template --single-branch https://github.com/XinbaoQiao/XinbaoWiki.git my-wiki
cd my-wiki
```

Already cloned the whole repo?

```bash
git fetch origin template
git checkout template
```

#### 3. Or fork, then switch

1. Click **Fork** on GitHub.
2. In your fork, open the branch dropdown and select **`template`** (or create a working branch from it).
3. Clone **your** fork and check out that branch.

Starting from `main` would copy personal Wiki pages and media. Prefer `template`.

#### 4. Run it locally

```bash
# Node 22 recommended (see .nvmrc)
npm ci
npm run dev        # http://localhost:3000
```

Production check:

```bash
npm run maintain:wiki
npm run check
npm run build
```

#### 5. Replace the placeholders

| Goal | Where to edit |
| --- | --- |
| Name, taglines, research areas, chat greetings | `lib/site-config.ts` |
| Wiki pages (EN + ZH) | `wiki/*.md` — each `Foo.md` has a twin `Foo_zh.md` |
| Site URL | `NEXT_PUBLIC_SITE_URL` |
| Avatar / icons / figures | `public/` (sample assets only on `template`) |
| Optional page AI / visitor map | env vars — see `docs/chat/README.md`, `docs/site-activity/README.md` |

After Wiki edits:

```bash
npm run maintain:wiki
```

The longer “make it yours” checklist lives in the README **on the `template` branch** itself.

### What the template gives you

- Bilingual Wiki from Markdown + YAML (`[[Wikilinks]]`, search, themes, paper cards)
- Optional page AI with numbered citations (OpenAI-compatible endpoint)
- Optional visitor atlas (Upstash Redis)
- Content checks, retrieval evals, and release scripts you can keep or trim

### How `template` stays up to date

Every push to `main` runs [Sync template branch](https://github.com/XinbaoQiao/XinbaoWiki/actions/workflows/sync-template.yml):

1. Sanitize `main` (drop personal paths, rewrite owner strings, overlay sample Wiki / images)
2. Leak-check the result
3. `npm ci` → `check:node22` → `build` inside the sanitized tree
4. Update the public `template` branch

Manual re-run: Actions → **Sync template branch** → Run workflow.  
Confirm: [tree/template](https://github.com/XinbaoQiao/XinbaoWiki/tree/template) (commit message looks like `Sync template from main <sha>`).

### Live example

[xinbaopedia.top](https://xinbaopedia.top) is one deployment of this stack (from `main`). Use it to see the product; use `template` to build yours.

<details>
<summary><strong>Repository map</strong></summary>

```text
app/                 pages + same-site API
components/          Wiki, search, theme, chat UI
lib/                 parsing, retrieval, prompts, site config
wiki/                canonical bilingual Markdown
public/okf/          generated agent-readable bundle
scripts/             maintenance, eval, release, template sanitizer (main only)
docs/                content, chat, deployment notes
```

</details>

<details>
<summary><strong>Licensing</strong></summary>

Software: [MIT](LICENSE). Original Wiki/docs text that is licensable: [CC BY 4.0](LICENSES/CC-BY-4.0.txt). Personal media and third-party assets are excluded from those blanket grants — see [LICENSING.md](LICENSING.md).

</details>

<p align="right"><a href="#top">Back to top ↑</a></p>

---

<a id="simplified-chinese"></a>

## 简体中文

### 两个分支，两件事

| 分支 | 是什么 | 给谁用 |
| --- | --- | --- |
| [`template`](https://github.com/XinbaoQiao/XinbaoWiki/tree/template) | **去个性化**起步包：占位姓名、示例 Wiki、不含站长媒体 | 想搭自己站点的人 |
| [`main`](https://github.com/XinbaoQiao/XinbaoWiki/tree/main) | [xinbaopedia.top](https://xinbaopedia.top) 的线上源码 | 站长 / 维护者 |

**要做自己的主页，请用 `template`，不要直接用 `main`。**  
`main` 含个人内容；每次推送到 `main` 都会自动生成新的 `template`（先去掉姓名、照片和私有字符串）。

### 使用模板（教程）

#### 1. 在 GitHub 打开模板分支

- 分支页：[github.com/XinbaoQiao/XinbaoWiki/tree/template](https://github.com/XinbaoQiao/XinbaoWiki/tree/template)
- 或在仓库首页：分支下拉框 → 选 **`template`**

你应看到 “Your Name” / “Example University” 一类占位内容，而不是个人简历。

#### 2. 只克隆模板分支

```bash
git clone -b template --single-branch https://github.com/XinbaoQiao/XinbaoWiki.git my-wiki
cd my-wiki
```

如果已经克隆了整个仓库：

```bash
git fetch origin template
git checkout template
```

#### 3. 或者先 Fork，再切换分支

1. 在 GitHub 点 **Fork**。
2. 在你的 fork 里打开分支下拉框，选择 **`template`**（或从它拉出工作分支）。
3. 克隆**你的** fork，并 checkout 该分支。

从 `main` 起步会带上个人 Wiki 与媒体，请优先用 `template`。

#### 4. 本地运行

```bash
# 推荐 Node 22（见 .nvmrc）
npm ci
npm run dev        # http://localhost:3000
```

发布前检查：

```bash
npm run maintain:wiki
npm run check
npm run build
```

#### 5. 换成你自己的内容

| 目标 | 改哪里 |
| --- | --- |
| 姓名、标语、研究方向、聊天开场 | `lib/site-config.ts` |
| Wiki 页面（中英） | `wiki/*.md` — 每个 `Foo.md` 有对应 `Foo_zh.md` |
| 站点 URL | `NEXT_PUBLIC_SITE_URL` |
| 头像 / 图标 / 配图 | `public/`（`template` 上只有示例资源） |
| 可选页内 AI / 访客地图 | 环境变量 — 见 `docs/chat/README.md`、`docs/site-activity/README.md` |

改完 Wiki 后执行：

```bash
npm run maintain:wiki
```

更完整的「改成自己的站点」清单，见 **`template` 分支上的 README**。

### 模板里有什么

- 双语 Markdown Wiki（`[[Wikilink]]`、搜索、主题、论文卡）
- 可选页内 AI（带编号引用，OpenAI 兼容接口）
- 可选访客地图（Upstash Redis）
- 内容检查、检索评测与发布脚本（可保留也可精简）

### `template` 如何保持更新

每次推送到 `main` 都会跑 [Sync template branch](https://github.com/XinbaoQiao/XinbaoWiki/actions/workflows/sync-template.yml)：

1. 清洗 `main`（删除个人路径、改写站长文案、覆盖示例 Wiki / 图片）
2. 泄漏检查
3. 在清洗结果里执行 `npm ci` → `check:node22` → `build`
4. 更新公开的 `template` 分支

手动重跑：Actions → **Sync template branch** → Run workflow。  
确认：[tree/template](https://github.com/XinbaoQiao/XinbaoWiki/tree/template)（提交说明形如 `Sync template from main <sha>`）。

### 线上示例

[xinbaopedia.top](https://xinbaopedia.top) 是本仓库 `main` 的一次部署。用来看效果；搭自己的站请用 `template`。

<details>
<summary><strong>仓库结构</strong></summary>

```text
app/                 页面与同站 API
components/          Wiki、搜索、主题、聊天 UI
lib/                 解析、检索、提示词、站点配置
wiki/                规范双语 Markdown
public/okf/          生成的 agent-readable 知识包
scripts/             维护、评测、发布、模板清洗（仅 main）
docs/                内容、聊天、部署说明
```

</details>

<details>
<summary><strong>许可</strong></summary>

软件：[MIT](LICENSE)。可授权的原创 Wiki / 文档文字：[CC BY 4.0](LICENSES/CC-BY-4.0.txt)。个人媒体与第三方素材不在上述统一授权内 — 见 [LICENSING.md](LICENSING.md)。

</details>

<p align="right"><a href="#top">返回顶部 ↑</a></p>
