<div align="center">
  <img src="public/xinbaopedia-icon.png" width="132" alt="Xinbaopedia" />

  # Xinbaopedia

  ## Your academic story should be discovered — not just displayed.

  **Turn a static academic homepage into a product people can explore, question, and trust.**

  把散落的履历、论文、项目与研究关系，变成一套可搜索、可追问、可验证、可复用的双语知识产品。

  <p>
    <a href="https://xinbaopedia.top"><img src="https://img.shields.io/badge/Explore-Live%20Product-3366cc?style=for-the-badge" height="30" alt="Explore the live product" /></a>
    <a href="https://xinbaopedia.top/wiki/Xinbao_Qiao/"><img src="https://img.shields.io/badge/Browse-The%20Wiki-2a7f62?style=for-the-badge" height="30" alt="Browse the Wiki" /></a>
    <a href="https://xinbaopedia.top/okf/index.md"><img src="https://img.shields.io/badge/Open-Agent%20Knowledge-6b4fbb?style=for-the-badge" height="30" alt="Open the agent-readable knowledge bundle" /></a>
    <a href="https://github.com/XinbaoQiao/XinbaoWiki/fork"><img src="https://img.shields.io/badge/Fork-Build%20Yours-f08c46?style=for-the-badge" height="30" alt="Fork Xinbaopedia" /></a>
  </p>

  <p>
    <a href="https://github.com/XinbaoQiao/XinbaoWiki/actions/workflows/ci.yml"><img src="https://github.com/XinbaoQiao/XinbaoWiki/actions/workflows/ci.yml/badge.svg" alt="CI status" /></a>
    <a href="https://github.com/XinbaoQiao/XinbaoWiki/actions/workflows/maintenance.yml"><img src="https://github.com/XinbaoQiao/XinbaoWiki/actions/workflows/maintenance.yml/badge.svg" alt="Weekly wiki maintenance status" /></a>
    <a href="LICENSING.md"><img src="https://img.shields.io/badge/License-MIT%20%2B%20CC%20BY%204.0-6b4fbb" alt="MIT and CC BY 4.0 licensing" /></a>
  </p>
</div>

---

## A homepage should open doors, not end the journey

普通个人主页回答“这个人是谁”。Xinbaopedia 继续回答：

- 这些论文、项目、机构和研究问题是怎么连接起来的？
- 我能不能直接搜索一个概念，而不是翻完整份 CV？
- AI 的回答依据来自哪里，能不能点回原始 Wiki 页面核对？
- 我能不能把这套系统换成自己的内容，用一套可复现流程维护并持续发布？

**Xinbaopedia 把个人主页从展示页变成了探索入口。** 访客得到的是一张可以阅读、搜索和对话的学术知识地图；构建者得到的是一套可以 fork、替换内容并部署的产品蓝图。

<table>
  <tr>
    <td width="25%" align="center"><strong>🧭 Browse</strong><br/><sub>沿人物、论文、项目、机构与概念继续探索</sub></td>
    <td width="25%" align="center"><strong>⌕ Search</strong><br/><sub>用中英文标题、别名或自然表达直达内容</sub></td>
    <td width="25%" align="center"><strong>✦ Ask</strong><br/><sub>有证据就引用回答，没有 Wiki 证据也能正常对话</sub></td>
    <td width="25%" align="center"><strong>↗ Fork</strong><br/><sub>替换知识、品牌和媒体，构建自己的学术产品</sub></td>
  </tr>
</table>

<br/>

<table>
  <tr>
    <td width="25%" align="center"><strong>2</strong><br/><sub>languages, one knowledge graph</sub></td>
    <td width="25%" align="center"><strong>84</strong><br/><sub>public agent-readable concepts</sub></td>
    <td width="25%" align="center"><strong>64</strong><br/><sub>bilingual retrieval test cases</sub></td>
    <td width="25%" align="center"><strong>3</strong><br/><sub>grounded, conversational, protected modes</sub></td>
  </tr>
</table>

## What it feels like to use

| You want to… | Xinbaopedia does… | You get… |
| --- | --- | --- |
| 快速了解一个人的研究 | 把人物、经历、论文与研究主题组织成双语 Wiki | 一条可以继续点下去的阅读路径，而不是履历终点 |
| 找到某个模糊概念 | 对标题、别名、摘要和正文进行语言感知的加权搜索 | 更接近“我想找什么”的结果 |
| 在论文页问“这项工作做了什么？” | 把当前页作为受约束上下文，检索相关公开证据 | 带有效 Wiki 引用、可以回查的回答 |
| 问一个 Wiki 没覆盖的普通问题 | 转入普通对话，而不是重复固定拒答 | 自然回答，同时不伪造 Wiki 来源 |
| 复用这套主页 | 从 Git-native 内容、维护器、评测到部署门禁全部开放 | 一套可持续维护的个人知识产品模板 |

> **The product promise:** browse like a Wiki, discover like a search engine, ask like an LLM, verify like a researcher.

一切从一份可信、可编辑的知识源开始：只需维护 <code>wiki/*.md</code>，Xinbaopedia 就会把它变成可阅读的页面、可探索的关系、可检索的上下文和可供 agent 使用的知识包。内容写一次，阅读、搜索、问答和持续发布自然连成一个产品。

## Why it feels different

### A profile becomes a map

履历不再止于一条平铺的时间线。WikiLinks 把研究主题、论文、合作关系、机构与方法连在一起，每一次点击都可能打开下一条值得探索的路径。

### AI has to show its work

当答案依赖 Wiki，AI 必须给出真实、有效、可以点回原文核对的引用。系统只展示模型实际使用过的页面；引用缺失或越界时，答案不会被包装成“有依据”的结论。

### The conversation keeps flowing

Wiki 没有覆盖某个问题，并不意味着对话必须停在一句拒答上。普通知识与自然交流会继续正常回答；只有隐藏内容、私密信息和敏感请求会被明确阻断。

### It stays alive after launch

发布不是终点。双语配对、链接完整性、来源、新鲜度、检索评测、真实模型检查和生产环境验证共同守住长期质量，让知识库可以持续生长，而不是上线后慢慢失真。

## Make it yours

你不需要照搬乔鑫宝的内容。把 Xinbaopedia 当成一套可替换知识的产品骨架：

1. **Fork the product** — 保留前端、检索、维护和发布门禁。
2. **Replace the knowledge** — 修改 <code>wiki/*.md</code>、公开媒体与站点 metadata。
3. **Compile and ship** — 重新生成知识产物，检查内容与检索，再部署自己的站点。

~~~bash
npm ci
npm run maintain:wiki
npm run check
npm run build
~~~

核心目录：

~~~text
app/                     product pages, metadata and same-site API
components/              Wiki, search, theme and chat experiences
lib/                     parsing, retrieval, prompts and response policy
wiki/                    canonical bilingual knowledge
public/okf/              generated agent-readable knowledge bundle
evals/                   reviewed bilingual retrieval cases
scripts/                 maintenance, evaluation and release gates
docs/                    standards, deployment and chat operations
~~~

[**Fork Xinbaopedia →**](https://github.com/XinbaoQiao/XinbaoWiki/fork) · [**Read the contribution guide →**](CONTRIBUTING.md) · [**Open the live product →**](https://xinbaopedia.top)

## Trust is a product feature

- **Evidence boundary:** grounded answers require validated citations; conversational replies cannot invent numbered Wiki sources.
- **Privacy boundary:** Xinbaopedia 自有 Redis 与日志不保存原始问题、聊天历史、原始 IP、系统提示、私有语气配置或 API key。当前消息仍会发送给配置的模型服务，上游处理遵循该服务的政策。
- **Knowledge boundary:** 隐藏页不会进入公开路由、OKF 或 LLM 检索语料。
- **Release boundary:** 每次 production promotion 之前都要通过 immutable preview 上的内容、检索、grounded、page-context、conversation 与 sensitive-request canary。

<details>
<summary><strong>Under the hood — actual frontend and LLM + Wiki backend</strong></summary>

### Frontend

| Layer | Actual implementation | Product role |
| --- | --- | --- |
| Web framework | [Next.js 15.5.20 App Router](https://nextjs.org/docs/15/app) | 静态生成、metadata、sitemap、robots 与同站 API |
| UI | [React 19.2.7](https://react.dev/) + TypeScript | 搜索、双语切换、主题系统、文章组件与 AI 面板 |
| Wiki rendering | react-markdown + remark-gfm + remark-math + rehype-katex + KaTeX | GFM、公式、表格、外链、WikiLinks 与缺失页提示 |
| Visual system | Repository-native CSS variables | Wikipedia-inspired 布局、响应式设计、手动主题与本地时间 Auto |
| Search | Static <code>/search-index.json</code> + client-side weighting | 中英文分流，对标题、别名、摘要和正文排序 |

### LLM + Wiki backend

| Layer | Actual implementation | Product role |
| --- | --- | --- |
| API runtime | Next.js Node Route Handlers on Vercel | 浏览器只访问同站 API；模型密钥与服务端提示不进入前端 bundle |
| Knowledge source | Git-native Markdown + YAML frontmatter | 保存可读、可 diff、可审查的规范知识 |
| Retrieval | Custom bilingual heading-level lexical retrieval | 稳定 <code>slug#section</code> ID、内容哈希、语言过滤、当前页加权与轻量图扩展 |
| LLM gateway | Server-side OpenAI-compatible Chat Completions | 当前生产配置经 Yunwu 调用 <code>deepseek-v4-flash</code>；不依赖 OpenAI SDK |
| Response policy | Grounded / conversational / protected router | 有证据则引用回答，无 Wiki 证据则正常对话，敏感请求确定性阻断 |
| Citation guard | Number validation, source compaction, one bounded retry | 无效引用不能进入 UI；只返回实际引用页面 |
| State | Upstash Redis JS | 每日配额、冷却、重试预算与数据最小化的假名化运行元数据 |
| Knowledge export | OKF v0.1 Draft + Xinbaopedia Profile | 生成供人类与 agent 读取的 <code>public/okf/</code> 知识包 |

这个后端不是 LangChain、LlamaIndex、Microsoft GraphRAG 或向量数据库的包装。检索、路由、引用验证、评测与维护过程都在仓库中显式实现。

</details>

<details>
<summary><strong>Standards, inspirations and comparison references</strong></summary>

| Source | Role in Xinbaopedia | Boundary |
| --- | --- | --- |
| [Next.js App Router](https://nextjs.org/docs/15/app) + [React](https://react.dev/) | Web frontend and same-site backend | **Actually used** |
| [GitHub Flavored Markdown](https://github.github.com/gfm/) | Markdown syntax foundation | **Actually used** |
| [Open Knowledge Format v0.1 Draft](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) | Portable Markdown + YAML knowledge bundle | **Specification basis**; bilingual/retrieval/review fields are project extensions |
| [Google Cloud OKF introduction](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing) | Git-managed, human/agent-readable knowledge motivation | **Design basis** |
| [Andrej Karpathy: LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) | Durable Wiki memory, schema, ingest, query and lint | **Conceptual inspiration**; not a standard or reference implementation |
| [MediaWiki architecture](https://www.mediawiki.org/wiki/Manual:MediaWiki_architecture) | Pages, links, revisions and deferred maintenance | **Comparison reference**; MediaWiki is not running here |
| [Microsoft GraphRAG](https://github.com/microsoft/graphrag) | Entity/relationship and global graph workflows | **Comparison reference**; its indexing/community pipeline is not implemented |
| [LlamaIndex ingestion pipeline](https://developers.llamaindex.ai/python/framework/module_guides/loading/ingestion_pipeline/) | Stable IDs, hashes and incremental ingestion | **Comparison reference**; not a dependency |
| [Ragas metrics](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/) | Retrieval/context/faithfulness vocabulary | **Evaluation reference**; no Ragas compatibility claim |
| [OWASP Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/) | Prompt injection, disclosure, output and resource review | **Security reference**; no certification claim |
| [OpenTelemetry GenAI conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) | Provider, model, latency, tokens and outcome vocabulary | **Observability reference**; not an OTel implementation |

完整 claim boundaries 见 [Standards and conformance](docs/standards-and-conformance.md)。

</details>

<details>
<summary><strong>Continuous maintenance and release gates</strong></summary>

- <code>npm run check</code> 验证 TypeScript、WikiLinks、内容新鲜度、OKF、Wiki 行为、检索 golden set 与发布脚本。
- GitHub Actions 在 push/PR 上执行依赖审计、完整检查和构建。
- 每周维护任务复核来源、外链、review due 状态与双语检索。
- 生产发布先验证 immutable preview，再 promotion，并对 canonical domain 执行真实 canary。

深入阅读：

- [Continuous wiki maintenance](docs/continuous-maintenance.md)
- [Relation taxonomy](docs/relation-taxonomy.md)
- [Deployment troubleshooting](docs/deployment-troubleshooting.md)
- [Chat backend and deployment](docs/chat/README.md)

</details>

## Licensing, contribution and security

Xinbaopedia 把可复用产品代码、开放内容与受保护素材明确分开：

- 软件代码与项目配置采用 [MIT License](LICENSE)。
- 原创 Wiki 与文档文字在权利人可授权的范围内采用 [CC BY 4.0](LICENSES/CC-BY-4.0.txt)。
- 个人照片、CV、论文图、机构标志、字体与其他第三方素材不包含在上述授权中。完整路径和逐文件状态见 [Licensing](LICENSING.md)、[Third-party notices](THIRD_PARTY_NOTICES.md) 与 [Asset provenance register](ASSET_PROVENANCE.md)。

提交内容纠错、功能或代码改进前，请阅读 [Contributing](CONTRIBUTING.md) 与 [Code of Conduct](CODE_OF_CONDUCT.md)。安全或隐私问题请不要公开开 Issue，请按 [Security policy](SECURITY.md) 私下报告。

<div align="center">

### Stop publishing pages. Start shipping knowledge.

[**Explore Xinbaopedia →**](https://xinbaopedia.top)

<sub>Wikipedia-inspired, independently built, and not affiliated with the Wikimedia Foundation.</sub>

</div>
