<p align="right">
  <a href="README.md"><img src="https://img.shields.io/badge/English-e8edf7?style=flat-square&labelColor=e8edf7&color=e8edf7" alt="English" /></a>
  <a href="README.zh-CN.md"><img src="https://img.shields.io/badge/简体中文-17295a?style=flat-square" alt="简体中文" /></a>
</p>

<div align="center">
  <img src="public/xinbaopedia-icon.png" width="132" alt="Xinbaopedia" />

  # Xinbaopedia

  ## 你的学术故事值得被发现，而不只是被展示。

  **把静态学术主页变成一件可以探索、追问、验证和复用的知识产品。**

  Xinbaopedia 以双语、Git-native 的方式连接人物、论文、项目、机构与研究概念，并把搜索、有证据约束的 AI 问答和持续维护的发布流程放进同一个产品。

  <p>
    <a href="https://xinbaopedia.top"><img src="https://img.shields.io/badge/探索-在线产品-3366cc?style=for-the-badge" height="31" alt="探索在线产品" /></a>
    <a href="https://xinbaopedia.top/wiki/Qiao_Xinbao_zh/"><img src="https://img.shields.io/badge/浏览-中文%20Wiki-2a7f62?style=for-the-badge" height="31" alt="浏览中文 Wiki" /></a>
    <a href="https://xinbaopedia.top/okf/index.md"><img src="https://img.shields.io/badge/开放-Agent%20知识包-6b4fbb?style=for-the-badge" height="31" alt="打开 agent 知识包" /></a>
    <a href="https://github.com/XinbaoQiao/XinbaoWiki/fork"><img src="https://img.shields.io/badge/FORK-构建你的版本-f08c46?style=for-the-badge" height="31" alt="Fork Xinbaopedia" /></a>
  </p>

  <p>
    <a href="https://github.com/XinbaoQiao/XinbaoWiki/actions/workflows/ci.yml"><img src="https://github.com/XinbaoQiao/XinbaoWiki/actions/workflows/ci.yml/badge.svg" alt="CI status" /></a>
    <a href="https://github.com/XinbaoQiao/XinbaoWiki/actions/workflows/maintenance.yml"><img src="https://github.com/XinbaoQiao/XinbaoWiki/actions/workflows/maintenance.yml/badge.svg" alt="Weekly maintenance" /></a>
    <a href="LICENSING.md"><img src="https://img.shields.io/badge/License-MIT%20%2B%20CC%20BY%204.0-6b4fbb" alt="Licensing" /></a>
  </p>
</div>

---

## 从个人主页，到知识产品

普通学术主页回答“这个人是谁”。Xinbaopedia 会继续回答：

- 论文、项目、机构、合作者和研究问题之间如何连接？
- 能否直接搜索概念，而不是从头翻完整份 CV？
- AI 的回答能否指回它真正使用过的 Wiki 证据？
- 其他人能否 fork 产品、替换知识，并让它长期保持可靠？

**访客得到一张连通的学术地图，构建者得到一套可复用的产品蓝图。**

<table>
  <tr>
    <td width="50%" valign="top">
      <img src="https://img.shields.io/badge/浏览-连通的知识-3366cc?style=flat-square" alt="浏览" />
      <h3>个人主页变成知识地图</h3>
      人物、论文、项目、机构与概念通过真实 WikiLinks 相互连接，阅读不会停在平铺的时间线上。
    </td>
    <td width="50%" valign="top">
      <img src="https://img.shields.io/badge/搜索-双语发现-2a7f62?style=flat-square" alt="搜索" />
      <h3>搜索理解你的意图</h3>
      同时理解中英文标题、别名、摘要和自然表达，不要求用户记住精确文件名。
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <img src="https://img.shields.io/badge/问答-证据优先-6b4fbb?style=flat-square" alt="问答" />
      <h3>AI 必须展示依据</h3>
      依赖 Wiki 的回答引用真正使用过的页面；普通问题则继续自然对话，不重复固定拒答。
    </td>
    <td width="50%" valign="top">
      <img src="https://img.shields.io/badge/发布-持续维护-f08c46?style=flat-square" alt="发布" />
      <h3>上线不是终点</h3>
      内容检查、检索评测、真实模型 canary 与生产 smoke 共同守住发布后的长期质量。
    </td>
  </tr>
</table>

<br/>

<table>
  <tr>
    <td width="25%" align="center"><strong>2</strong><br/><sub>种语言，一张知识图谱</sub></td>
    <td width="25%" align="center"><strong>84</strong><br/><sub>个公开 agent-readable 概念</sub></td>
    <td width="25%" align="center"><strong>64</strong><br/><sub>条双语检索测试</sub></td>
    <td width="25%" align="center"><strong>3</strong><br/><sub>种模式：有据、对话、保护</sub></td>
  </tr>
</table>

## 使用它是什么感觉

| 你想要…… | Xinbaopedia 会…… | 你将得到…… |
| --- | --- | --- |
| 快速了解一个人的研究 | 把人物、教育、论文与主题组织成双语 Wiki | 自然引向下一页的阅读路径 |
| 找到只记得大概意思的概念 | 加权检索标题、别名、摘要、小节与正文 | 更接近真实意图的结果 |
| 问“这篇论文做了什么？” | 使用当前页并检索相关公开证据 | 可以回查的引用回答 |
| 问 Wiki 没覆盖的问题 | 转入普通对话而不是固定拒答 | 不伪造来源的自然回答 |
| 构建自己的版本 | 开放内容模型、维护器、评测与发布门禁 | 可持续维护的知识产品模板 |

> **产品承诺：** 像 Wiki 一样浏览，像搜索引擎一样发现，像 LLM 一样对话，像研究者一样验证。

一切从一份可编辑的可信知识源开始：只需维护 <code>wiki/*.md</code>，Xinbaopedia 就会把它编译为可阅读页面、关联导航、检索上下文、知识图谱和 agent-readable 知识包。

## 构建你的版本

1. **Fork 产品** — 保留前端、检索、维护和发布门禁。
2. **替换知识** — 修改 <code>wiki/*.md</code>、公开媒体和站点 metadata。
3. **编译并发布** — 重新生成知识产物，验证内容与检索，然后部署。

~~~bash
npm ci
npm run maintain:wiki
npm run check
npm run build
~~~

<table>
  <tr>
    <td width="33%" valign="top"><strong>01 · 内容</strong><br/><sub>Git-native 双语 Markdown，可阅读、可审查、可迁移。</sub></td>
    <td width="33%" valign="top"><strong>02 · 智能</strong><br/><sub>显式实现检索、回答策略、引用验证与评测。</sub></td>
    <td width="33%" valign="top"><strong>03 · 运维</strong><br/><sub>维护检查、不可变预览、模型 canary 与生产 smoke。</sub></td>
  </tr>
</table>

<details>
<summary><strong>仓库结构</strong></summary>

~~~text
app/                     产品页面、metadata 与同站 API
components/              Wiki、搜索、主题和 AI 交互
lib/                     解析、检索、提示词和回答策略
wiki/                    规范双语知识
public/okf/              生成的 agent-readable 知识包
evals/                   已审查的双语检索用例
scripts/                 维护、评测和发布门禁
docs/                    标准、部署和 AI 运维文档
~~~

</details>

## 可信本身就是产品能力

- **证据边界：** grounded 回答必须通过引用验证；普通对话不能虚构带编号的 Wiki 来源。
- **隐私边界：** Xinbaopedia 自有 Redis 与日志不保存原始问题、聊天历史、原始 IP、系统提示、私有语气配置或 API key。当前消息仍会发送给配置的模型服务。
- **知识边界：** 隐藏页不会进入公开路由、OKF 或 LLM 检索。
- **发布边界：** 每次 production promotion 前必须在 immutable preview 上通过完整 canary。

<details>
<summary><strong>技术实现：前端与 LLM + Wiki 后端</strong></summary>

| 层 | 实际实现 | 产品作用 |
| --- | --- | --- |
| Web 与 UI | [Next.js 15.5.20](https://nextjs.org/docs/15/app)、[React 19.2.7](https://react.dev/)、TypeScript | 静态生成、响应式 Wiki、搜索、主题、AI 面板与同站 API |
| Wiki 渲染 | react-markdown、GFM、KaTeX、WikiLinks | 文章、公式、表格、概念链接与缺失页提示 |
| 知识源 | Git-native Markdown + YAML frontmatter | 可读、可 diff、可审查的规范知识 |
| 检索 | 自研双语小节级词法检索 | 稳定小节 ID、哈希、语言过滤、当前页加权与轻量图扩展 |
| LLM gateway | 服务端 OpenAI-compatible Chat Completions | 生产环境目前经 Yunwu 调用 <code>deepseek-v4-flash</code> |
| 回答策略 | Grounded / conversational / protected router | 引用证据、普通对话与敏感请求确定性阻断 |
| 引用保护 | 编号验证、来源压缩、一次有界重试 | 无效引用不能进入 UI |
| 状态与导出 | Upstash Redis JS + OKF v0.1 Draft profile | 配额、重试状态与可迁移的人类/agent 知识包 |

这个后端不是 LangChain、LlamaIndex、Microsoft GraphRAG 或向量数据库的包装。检索、路由、引用验证、评测与维护都在仓库中显式实现。

</details>

<details>
<summary><strong>标准、灵感与边界</strong></summary>

- **实际使用：** [Next.js App Router](https://nextjs.org/docs/15/app)、[React](https://react.dev/) 与 [GitHub Flavored Markdown](https://github.github.com/gfm/)。
- **规范基础：** [Open Knowledge Format v0.1 Draft](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md)，项目扩展了双语检索与 review 字段。
- **概念启发：** [Andrej Karpathy 的 LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)。
- **对比参考而非依赖：** [MediaWiki](https://www.mediawiki.org/wiki/Manual:MediaWiki_architecture)、[Microsoft GraphRAG](https://github.com/microsoft/graphrag)、[LlamaIndex ingestion](https://developers.llamaindex.ai/python/framework/module_guides/loading/ingestion_pipeline/)、[Ragas](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/)、[OWASP LLM Top 10](https://genai.owasp.org/llm-top-10/) 与 [OpenTelemetry GenAI conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)。

完整声明边界见 [Standards and conformance](docs/standards-and-conformance.md)。

</details>

<details>
<summary><strong>持续维护与发布门禁</strong></summary>

<code>npm run check</code> 验证类型、WikiLinks、新鲜度、OKF、Wiki 行为、检索 golden cases 与发布脚本。GitHub Actions 重复执行检查与构建；每周维护复核来源和双语检索；生产发布在 promotion 前验证 immutable preview，并在 canonical domain 上执行真实 canary。

[持续维护](docs/continuous-maintenance.md) · [关系分类](docs/relation-taxonomy.md) · [部署排障](docs/deployment-troubleshooting.md) · [AI 后端](docs/chat/README.md)

</details>

## 许可、贡献与安全

软件采用 [MIT License](LICENSE)；可授权的原创 Wiki 与文档文字采用 [CC BY 4.0](LICENSES/CC-BY-4.0.txt)。个人媒体与第三方素材不包含在上述统一授权中。详见 [Licensing](LICENSING.md)、[Third-party notices](THIRD_PARTY_NOTICES.md) 和 [Asset provenance](ASSET_PROVENANCE.md)。

参与项目前请阅读 [Contributing](CONTRIBUTING.md) 与 [Code of Conduct](CODE_OF_CONDUCT.md)；安全问题请通过 [Security policy](SECURITY.md) 私下报告。

<br/>

<a href="https://xinbaopedia.top"><img src="public/readme/xinbaopedia-cta.svg" width="100%" alt="Stop publishing pages. Start shipping knowledge." /></a>

<div align="center">

## **Stop publishing pages. Start shipping knowledge.**

**打开产品，追溯证据，Fork 系统，让知识真正属于你。**

<p>
  <a href="https://xinbaopedia.top"><img src="https://img.shields.io/badge/打开-在线产品-3366cc?style=for-the-badge" height="34" alt="打开在线产品" /></a>
  <a href="https://xinbaopedia.top/wiki/Qiao_Xinbao_zh/"><img src="https://img.shields.io/badge/阅读-中文%20Wiki-2a7f62?style=for-the-badge" height="34" alt="阅读中文 Wiki" /></a>
  <a href="https://github.com/XinbaoQiao/XinbaoWiki/fork"><img src="https://img.shields.io/badge/构建-Fork%20Xinbaopedia-6b4fbb?style=for-the-badge" height="34" alt="Fork Xinbaopedia" /></a>
  <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/扩展-贡献指南-f08c46?style=for-the-badge" height="34" alt="阅读贡献指南" /></a>
</p>

<sub>受到 Wikipedia 启发，独立构建，与 Wikimedia Foundation 无隶属关系。</sub>

</div>
