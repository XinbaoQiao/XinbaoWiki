<div align="center">
  <img src="public/xinbaopedia-icon.png" width="132" alt="Xinbaopedia" />

  # Xinbaopedia

  **Turn an academic homepage into a queryable, cited knowledge system.**

  *Browse it like a Wiki. Search it like an index. Ask it like an LLM.*

  <p>
    <a href="https://xinbaopedia.top"><img src="https://img.shields.io/badge/Open-Live%20Site-3366cc?style=for-the-badge" height="28" alt="Open Xinbaopedia" /></a>
    <a href="https://nextjs.org/docs/15/app"><img src="https://img.shields.io/badge/Next.js-15.5.20-000000?style=for-the-badge&logo=nextdotjs" height="28" alt="Next.js 15.5.20" /></a>
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19.2.7-20232a?style=for-the-badge&logo=react" height="28" alt="React 19.2.7" /></a>
    <a href="https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md"><img src="https://img.shields.io/badge/OKF-v0.1%20Draft-2a7f62?style=for-the-badge" height="28" alt="Open Knowledge Format v0.1 Draft" /></a>
  </p>
  <p>
    <a href="https://github.com/XinbaoQiao/XinbaoWiki/actions/workflows/ci.yml"><img src="https://github.com/XinbaoQiao/XinbaoWiki/actions/workflows/ci.yml/badge.svg" alt="CI status" /></a>
    <a href="https://github.com/XinbaoQiao/XinbaoWiki/actions/workflows/maintenance.yml"><img src="https://github.com/XinbaoQiao/XinbaoWiki/actions/workflows/maintenance.yml/badge.svg" alt="Weekly wiki maintenance status" /></a>
  </p>
</div>

---

Xinbaopedia 不是把一份 CV 搬上网页，也不是在个人主页旁边塞一个聊天框。它把公开学术资料编译成一套由 Git 驱动的双语知识系统：同一份 Markdown 同时服务于人类阅读、站内搜索、LLM 检索和 agent-readable 知识导出。

> **One source, four surfaces:** bilingual Wiki pages, weighted search, citation-checked AI answers, and an OKF knowledge bundle.

## 为什么它不只是另一个个人主页

| 普通个人主页通常提供 | Xinbaopedia 进一步提供 |
| --- | --- |
| 一页履历和若干外链 | 可以沿人物、论文、项目、机构和研究概念继续探索的双语 Wiki |
| 标题或关键词匹配 | 对标题、别名、摘要和正文加权的可解释站内搜索；AI 检索还能感知当前页面 |
| 一个没有证据边界的聊天窗口 | Wiki 证据充分时强制使用页级引用；一般问题正常回答；敏感请求在模型调用前阻断 |
| 手工更新后直接上线 | 双语配对、链接、来源、内容哈希、检索 golden set、CI 和每周维护审计 |

最关键的区别是：**引用不是装饰，而是服务端契约。** Grounded 回答只有在 <code>[n]</code> 引用有效时才会返回，并且 API 只附上模型真正引用过的 Wiki 页面。缺失或越界引用不能直接进入用户界面。

## 架构

~~~mermaid
flowchart LR
  A["wiki/*.md<br/>canonical public knowledge"] --> B["Maintenance compiler<br/>links · bilingual pairs · sources · hashes"]
  B --> C["Next.js Wiki<br/>pages · search · themes"]
  B --> D["OKF v0.1 bundle<br/>agent-readable export"]
  B --> E["Lexical retrieval index<br/>stable heading chunks + graph hints"]
  E --> F{"Response router"}
  F -->|strong public evidence| G["Grounded LLM<br/>validated [n] citations"]
  F -->|weak or no Wiki evidence| H["Normal conversation<br/>no fabricated Wiki sources"]
  F -->|hidden or sensitive request| I["Deterministic protection<br/>provider not called"]
~~~

<code>wiki/*.md</code> 是唯一规范内容源。页面、关系图、搜索数据、检索分块和 <code>public/okf/</code> 都由它生成或验证；生成物不应脱离源文件单独修改。

## 技术栈

### 前端

| 组件 | 实际实现 | 作用 |
| --- | --- | --- |
| Web framework | [Next.js 15.5.20 App Router](https://nextjs.org/docs/15/app) | 页面路由、静态生成、metadata、sitemap、robots 与同站 API |
| UI | [React 19.2.7](https://react.dev/) + TypeScript | 搜索、双语切换、主题系统、文章组件与 AI 对话面板 |
| Wiki rendering | [react-markdown](https://github.com/remarkjs/react-markdown) + [remark-gfm](https://github.com/remarkjs/remark-gfm) + remark-math + rehype-katex + [KaTeX](https://katex.org/) | GFM、数学公式、表格、外链、WikiLinks 与缺失页提示 |
| Visual system | 原生 CSS variables | Wikipedia-inspired 文章布局、响应式设计、七种手动主题与按本地时间自动切换 |
| Search | 静态 <code>/search-index.json</code> + 客户端加权检索 | 中英文分流，对标题、别名、摘要和正文排序，并支持键盘操作 |

### LLM + Wiki 后端

| 层 | 实际实现 | 作用 |
| --- | --- | --- |
| API runtime | Next.js Node Route Handlers，部署于 Vercel | 浏览器只访问同站 API；模型密钥和服务端提示不进入前端 bundle |
| Knowledge source | Git-native Markdown + YAML frontmatter | <code>wiki/*.md</code> 保存可读、可 diff、可审查的公开知识 |
| Retrieval | 自研双语 heading-level lexical retrieval | 稳定 <code>slug#section</code> chunk ID、内容哈希、语言过滤、当前页加权和轻量 Wiki 图邻接扩展 |
| LLM gateway | 服务器端 OpenAI-compatible Chat Completions | 当前生产配置经 Yunwu 调用 <code>deepseek-v4-flash</code>；项目不依赖 OpenAI SDK |
| Response policy | grounded / conversational / protected 三路路由 | 有证据则引用回答，无 Wiki 证据则正常对话，隐藏或敏感请求确定性阻断 |
| Citation guard | 编号校验、来源压缩与一次有界重试 | 无效引用不能直接返回；普通对话不得伪造 Wiki 引用 |
| State | [Upstash Redis JS](https://github.com/upstash/redis-js) | 每日配额、冷却、重试预算和数据最小化的假名化运行元数据 |
| Knowledge export | OKF v0.1 Draft + Xinbaopedia OKF Profile v1 | 生成可被人类和 agent 读取的 <code>public/okf/</code> 知识包 |

这个后端不是 LangChain、LlamaIndex、Microsoft GraphRAG 或向量数据库的封装。检索、路由、引用验证、评测和维护流程都在仓库中显式实现，因此每个回答边界都可以从代码和测试追溯。

## 可以获得什么效果

- **Browse:** 从人物或研究主题出发，沿 WikiLinks 阅读论文、项目、机构与方法之间的关系。
- **Search:** 输入中英文标题、术语或自然表达，直接定位相关页面与摘要。
- **Ask:** 在首页询问全站问题，或在论文页问“这项工作解决了什么”，当前页会成为受约束的检索上下文。
- **Verify:** Grounded 回答附带实际引用页面；读者可以回到对应 Wiki 条目，并在条目提供外部引用时继续核对。
- **Maintain:** 内容更新会经过链接、双语、来源、OKF、检索、隐私、构建和真实 provider canary 检查。

## 我们真正基于什么，以及只参考了什么

| 来源 | 在 Xinbaopedia 中的角色 | 关系边界 |
| --- | --- | --- |
| [Next.js App Router](https://nextjs.org/docs/15/app) 与 [React](https://react.dev/) | Web 前端与同站后端的实际框架 | **实际采用** |
| [GitHub Flavored Markdown Spec](https://github.github.com/gfm/) | 表格、列表、链接和代码块的 Markdown 语法基础 | **实际采用** |
| [Open Knowledge Format v0.1 Draft](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) | Markdown + YAML 知识包的互操作基础 | **规范基础**；双语、检索、评测和复审周期是本项目扩展 |
| [Google Cloud: Introducing the Open Knowledge Format](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing) | Git-managed、portable、human/agent-readable knowledge 的设计动机 | **设计依据** |
| [Andrej Karpathy: LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) | durable Wiki memory、schema、ingest、query 和 lint 的概念起点 | **概念启发**；不是标准或生产参考实现 |
| [MediaWiki architecture](https://www.mediawiki.org/wiki/Manual:MediaWiki_architecture) 与 [job queue](https://www.mediawiki.org/wiki/Manual:Job_queue) | Wiki 页面、链接、revision-driven invalidation 与延迟维护的比较对象 | **交互与维护参考**；项目没有运行 MediaWiki |
| [Microsoft GraphRAG](https://github.com/microsoft/graphrag) | entity/relationship extraction 与 global graph query 的比较对象 | **比较参考**；未实现其 indexing、community detection 或 report pipeline |
| [LlamaIndex ingestion pipeline](https://developers.llamaindex.ai/python/framework/module_guides/loading/ingestion_pipeline/) | stable document IDs、hashes 与 incremental ingestion 的比较对象 | **比较参考**；不是依赖 |
| [Ragas metrics](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/) | retrieval、context 与 faithfulness 的评测术语 | **评测参考**；不声称 Ragas compatibility |
| [OWASP Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/) | prompt injection、敏感信息披露、输出处理和资源消耗的安全审查词汇 | **安全参考**；不声称认证或全面合规 |
| [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) | provider、model、latency、tokens 与 outcome 的可选遥测词汇 | **可观测性参考**；当前不是 OTel 实现 |

完整兼容矩阵与 claim boundaries 见 [Standards and conformance](docs/standards-and-conformance.md)。

## 安全、隐私与持续维护

- 隐藏页面不会进入公开路由、OKF 导出或 LLM 检索语料。
- Xinbaopedia 自有 Redis 与运行日志不写入原始问题、聊天历史、原始 IP、系统提示、私有语气配置或 API key；当前消息仍会发送给配置的模型服务生成回答，上游处理受该服务的政策约束。
- 自有运行观测保留 salted one-way question fingerprint、长度、页面、语言、假名化 visitor/browser/IP hashes、检索版本与分数、provider/model、outcome/retry、延迟和 token counts；这些哈希是 **pseudonymous**，不是 anonymous。
- <code>npm run check</code> 同时验证 TypeScript、WikiLinks、内容新鲜度、OKF、Wiki 行为、检索 golden set 与发布脚本。
- GitHub Actions 在 push/PR 上运行依赖审计、完整检查和构建；每周任务复核来源、外链、review due 状态和双语检索。
- 生产发布先验证 immutable preview deployment，再 promotion，并在 canonical domain 上执行 grounded、page-context、conversational 与 sensitive-request canaries。

## 仓库地图

~~~text
app/                     Next.js pages, metadata and API routes
components/              Wiki, search, theme and chat UI
lib/                     Wiki parsing, retrieval, prompts and response policy
wiki/                    canonical bilingual Markdown knowledge
public/okf/              generated agent-readable OKF bundle
evals/                   reviewed bilingual retrieval golden set
scripts/                 maintenance, audit, evaluation and release gates
docs/                    standards, taxonomy, maintenance and deployment docs
chat with xinbao/        AI policy, environment example and operator notes
~~~

深入文档：

- [Standards and conformance](docs/standards-and-conformance.md)
- [Continuous wiki maintenance](docs/continuous-maintenance.md)
- [Relation taxonomy](docs/relation-taxonomy.md)
- [Deployment troubleshooting](docs/deployment-troubleshooting.md)
- [Chat backend and deployment](chat%20with%20xinbao/README.md)

## 本地运行

需要 Node.js 22：

~~~bash
npm ci
npm run dev
~~~

默认地址为 <code>http://localhost:3000</code>。若需要启用 AI，请参考 [server environment example](chat%20with%20xinbao/env.example) 配置服务器端环境变量，切勿把真实密钥提交到仓库。

修改 <code>wiki/*.md</code> 后运行：

~~~bash
npm run maintain:wiki
npm run check
npm run build
~~~

<div align="center">

### A homepage you can read. A Wiki you can follow. An AI you can verify.

[**Explore Xinbaopedia →**](https://xinbaopedia.top)

<sub>Wikipedia-inspired, independently built, and not affiliated with the Wikimedia Foundation.</sub>

</div>
