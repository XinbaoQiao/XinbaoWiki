<p align="right">
  <a href="README.md"><img src="https://img.shields.io/badge/English-17295a?style=flat-square" alt="English" /></a>
  <a href="README.zh-CN.md"><img src="https://img.shields.io/badge/简体中文-e8edf7?style=flat-square&labelColor=e8edf7&color=e8edf7" alt="简体中文" /></a>
</p>

<div align="center">
  <img src="public/xinbaopedia-icon.png" width="132" alt="Xinbaopedia" />

  # Xinbaopedia

  ## Your academic story should be discovered — not just displayed.

  **Turn a static academic homepage into a product people can explore, question, verify, and reuse.**

  A bilingual, Git-native knowledge product connecting profiles, publications, projects, institutions, and research ideas — with search, evidence-grounded AI, and continuous maintenance built in.

  <p>
    <a href="https://xinbaopedia.top"><img src="https://img.shields.io/badge/EXPLORE-Live%20Product-3366cc?style=for-the-badge" height="31" alt="Explore the live product" /></a>
    <a href="https://xinbaopedia.top/wiki/Xinbao_Qiao/"><img src="https://img.shields.io/badge/BROWSE-The%20Wiki-2a7f62?style=for-the-badge" height="31" alt="Browse the Wiki" /></a>
    <a href="https://xinbaopedia.top/okf/index.md"><img src="https://img.shields.io/badge/OPEN-Agent%20Knowledge-6b4fbb?style=for-the-badge" height="31" alt="Open agent knowledge" /></a>
    <a href="https://github.com/XinbaoQiao/XinbaoWiki/fork"><img src="https://img.shields.io/badge/FORK-Build%20Yours-f08c46?style=for-the-badge" height="31" alt="Fork Xinbaopedia" /></a>
  </p>

  <p>
    <a href="https://github.com/XinbaoQiao/XinbaoWiki/actions/workflows/ci.yml"><img src="https://github.com/XinbaoQiao/XinbaoWiki/actions/workflows/ci.yml/badge.svg" alt="CI status" /></a>
    <a href="https://github.com/XinbaoQiao/XinbaoWiki/actions/workflows/maintenance.yml"><img src="https://github.com/XinbaoQiao/XinbaoWiki/actions/workflows/maintenance.yml/badge.svg" alt="Weekly maintenance" /></a>
    <a href="LICENSING.md"><img src="https://img.shields.io/badge/License-MIT%20%2B%20CC%20BY%204.0-6b4fbb" alt="Licensing" /></a>
  </p>
</div>

---

## From profile page to knowledge product

A conventional academic homepage answers “Who is this person?” Xinbaopedia keeps going:

- How do papers, projects, institutions, collaborators, and research questions connect?
- Can I search for an idea directly instead of scanning an entire CV?
- Can an AI answer point back to the exact Wiki evidence it used?
- Can someone fork the product, replace the knowledge, and keep it healthy over time?

**Visitors get a connected academic map. Builders get a reusable product blueprint.**

<table>
  <tr>
    <td width="50%" valign="top">
      <img src="https://img.shields.io/badge/BROWSE-Connected%20knowledge-3366cc?style=flat-square" alt="Browse" />
      <h3>A profile becomes a map</h3>
      Follow people, papers, projects, institutions, and concepts through real WikiLinks instead of stopping at a flat timeline.
    </td>
    <td width="50%" valign="top">
      <img src="https://img.shields.io/badge/SEARCH-Bilingual%20discovery-2a7f62?style=flat-square" alt="Search" />
      <h3>Search follows intent</h3>
      Find content through English and Chinese titles, aliases, summaries, and natural phrasing — not exact filenames.
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <img src="https://img.shields.io/badge/ASK-Evidence%20first-6b4fbb?style=flat-square" alt="Ask" />
      <h3>AI has to show its work</h3>
      Grounded answers cite the Wiki pages they used. Questions outside the Wiki still receive normal conversational answers.
    </td>
    <td width="50%" valign="top">
      <img src="https://img.shields.io/badge/SHIP-Continuously%20maintained-f08c46?style=flat-square" alt="Ship" />
      <h3>Launch is not the finish line</h3>
      Content checks, retrieval evaluation, provider canaries, and production smoke keep the product trustworthy after release.
    </td>
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
| Understand a research profile quickly | Organizes biography, education, papers, and themes as a bilingual Wiki | A reading path that invites the next click |
| Find an idea you only vaguely remember | Weighs titles, aliases, summaries, headings, and body text | Results closer to what you meant |
| Ask “What did this paper contribute?” | Uses the current page and retrieves related public evidence | A cited answer you can inspect |
| Ask something outside the Wiki | Switches to ordinary conversation instead of a canned refusal | A natural answer without invented sources |
| Build your own version | Opens the content model, maintainer, evaluations, and release gates | A sustainable academic knowledge-product template |

> **The product promise:** browse like a Wiki, discover like a search engine, ask like an LLM, verify like a researcher.

Everything begins with one editable source of truth: <code>wiki/*.md</code>. Maintain knowledge once; Xinbaopedia compiles it into readable pages, connected navigation, search context, a knowledge graph, and an agent-readable bundle.

## Make it yours

1. **Fork the product** — keep the frontend, retrieval, maintenance, and release gates.
2. **Replace the knowledge** — edit <code>wiki/*.md</code>, public media, and site metadata.
3. **Compile and ship** — regenerate knowledge artifacts, validate content and retrieval, then deploy.

~~~bash
npm ci
npm run maintain:wiki
npm run check
npm run build
~~~

<table>
  <tr>
    <td width="33%" valign="top"><strong>01 · Content</strong><br/><sub>Git-native bilingual Markdown that stays readable, reviewable, and portable.</sub></td>
    <td width="33%" valign="top"><strong>02 · Intelligence</strong><br/><sub>Explicit retrieval, response policy, citation validation, and evaluation.</sub></td>
    <td width="33%" valign="top"><strong>03 · Operations</strong><br/><sub>Maintenance checks, immutable previews, provider canaries, and production smoke.</sub></td>
  </tr>
</table>

<details>
<summary><strong>Repository map</strong></summary>

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

</details>

## Trust is a product feature

- **Evidence boundary:** grounded answers require validated citations; conversational replies cannot invent numbered Wiki sources.
- **Privacy boundary:** Xinbaopedia-owned Redis and logs do not store raw questions, chat history, raw IP addresses, system prompts, private voice configuration, or API keys. The current message is still sent to the configured provider under its policies.
- **Knowledge boundary:** hidden pages never enter public routes, OKF, or LLM retrieval.
- **Release boundary:** every production promotion must pass content, retrieval, grounded-answer, page-context, conversation, and sensitive-request canaries on an immutable preview.

<details>
<summary><strong>Under the hood — frontend and LLM + Wiki backend</strong></summary>

| Layer | Implementation | Product role |
| --- | --- | --- |
| Web and UI | [Next.js 15.5.20](https://nextjs.org/docs/15/app), [React 19.2.7](https://react.dev/), TypeScript | Static generation, responsive Wiki, search, themes, AI panel, and same-site API |
| Wiki rendering | react-markdown, GFM, KaTeX, WikiLinks | Articles, equations, tables, linked concepts, and missing-page hints |
| Knowledge source | Git-native Markdown + YAML frontmatter | Readable, diffable, reviewable canonical knowledge |
| Retrieval | Custom bilingual heading-level lexical retrieval | Stable section IDs, hashes, language filters, page weighting, and light graph expansion |
| LLM gateway | Server-side OpenAI-compatible Chat Completions | Production currently calls <code>deepseek-v4-flash</code> through Yunwu |
| Response policy | Grounded / conversational / protected router | Cited evidence, ordinary conversation, and deterministic sensitive-request blocking |
| Citation guard | Number validation, source compaction, one bounded retry | Invalid citations cannot reach the UI |
| State and export | Upstash Redis JS + OKF v0.1 Draft profile | Quota and retry state plus a portable human/agent-readable knowledge bundle |

The backend is not a wrapper around LangChain, LlamaIndex, Microsoft GraphRAG, or a vector database. Retrieval, routing, citation validation, evaluation, and maintenance are explicit repository code.

</details>

<details>
<summary><strong>Standards, inspirations, and boundaries</strong></summary>

- **Actually used:** [Next.js App Router](https://nextjs.org/docs/15/app), [React](https://react.dev/), and [GitHub Flavored Markdown](https://github.github.com/gfm/).
- **Specification basis:** [Open Knowledge Format v0.1 Draft](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md), extended for bilingual retrieval and review.
- **Conceptual inspiration:** [Andrej Karpathy’s LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).
- **Comparison references, not dependencies:** [MediaWiki](https://www.mediawiki.org/wiki/Manual:MediaWiki_architecture), [Microsoft GraphRAG](https://github.com/microsoft/graphrag), [LlamaIndex ingestion](https://developers.llamaindex.ai/python/framework/module_guides/loading/ingestion_pipeline/), [Ragas](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/), [OWASP LLM Top 10](https://genai.owasp.org/llm-top-10/), and [OpenTelemetry GenAI conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/).

See [Standards and conformance](docs/standards-and-conformance.md) for complete claim boundaries.

</details>

<details>
<summary><strong>Continuous maintenance and release gates</strong></summary>

<code>npm run check</code> validates types, WikiLinks, freshness, OKF, Wiki behavior, retrieval golden cases, and release scripts. GitHub Actions repeats checks and build; weekly maintenance reviews sources and bilingual retrieval; production verifies an immutable preview before promotion and runs real canaries on the canonical domain.

[Continuous maintenance](docs/continuous-maintenance.md) · [Relation taxonomy](docs/relation-taxonomy.md) · [Deployment troubleshooting](docs/deployment-troubleshooting.md) · [Chat backend](docs/chat/README.md)

</details>

## Licensing, contribution, and security

Software uses the [MIT License](LICENSE); licensable original Wiki and documentation text uses [CC BY 4.0](LICENSES/CC-BY-4.0.txt). Personal media and third-party assets are excluded from those blanket grants. See [Licensing](LICENSING.md), [Third-party notices](THIRD_PARTY_NOTICES.md), and [Asset provenance](ASSET_PROVENANCE.md).

Read [Contributing](CONTRIBUTING.md), the [Code of Conduct](CODE_OF_CONDUCT.md), and the private-reporting [Security policy](SECURITY.md).

<br/>

<a href="https://xinbaopedia.top"><img src="public/readme/xinbaopedia-cta.svg" width="100%" alt="Stop publishing pages. Start shipping knowledge." /></a>

<div align="center">

## **Stop publishing pages. Start shipping knowledge.**

**Explore the product. Trace the evidence. Fork the system. Make the knowledge yours.**

<p>
  <a href="https://xinbaopedia.top"><img src="https://img.shields.io/badge/OPEN-Live%20Product-3366cc?style=for-the-badge" height="34" alt="Open live product" /></a>
  <a href="https://xinbaopedia.top/wiki/Xinbao_Qiao/"><img src="https://img.shields.io/badge/READ-The%20Wiki-2a7f62?style=for-the-badge" height="34" alt="Read the Wiki" /></a>
  <a href="https://github.com/XinbaoQiao/XinbaoWiki/fork"><img src="https://img.shields.io/badge/BUILD-Fork%20Xinbaopedia-6b4fbb?style=for-the-badge" height="34" alt="Fork Xinbaopedia" /></a>
  <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/EXTEND-Contribution%20Guide-f08c46?style=for-the-badge" height="34" alt="Contribution guide" /></a>
</p>

<sub>Wikipedia-inspired, independently built, and not affiliated with the Wikimedia Foundation.</sub>

</div>
