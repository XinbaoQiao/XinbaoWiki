# Xinbaopedia Standards and Conformance

Status: maintained project contract
Last upstream review: 2026-07-17

Xinbaopedia is a Git-native academic wiki with an agent-readable export. Its
base interchange format is Open Knowledge Format (OKF) v0.1 Draft. The project
adds a stricter, versioned producer profile for bilingual publishing,
provenance, review scheduling, graph traversal, and retrieval.

## Normative and Informative References

| Reference | Tracked version | Role in Xinbaopedia | Authority |
| --- | --- | --- | --- |
| [GoogleCloudPlatform Knowledge Catalog: OKF specification](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) | OKF v0.1 Draft | Base Markdown and YAML interchange contract | Normative base format |
| [Google Cloud OKF announcement](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing) | Published 2025-06-17 | Rationale for portable, Git-managed, agent-readable knowledge | Informative |
| [Andrej Karpathy: LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) | Unversioned gist; reviewed 2026-07-17 | Conceptual origin for source material, durable wiki memory, schemas, ingest, query, and lint operations | Informative, not a standard |
| [Microsoft GraphRAG](https://github.com/microsoft/graphrag) | Upstream main; reviewed 2026-07-17 | Comparison point for entity/relationship extraction and global graph queries | Informative, not a dependency |
| [LlamaIndex ingestion pipeline](https://developers.llamaindex.ai/python/framework/module_guides/loading/ingestion_pipeline/) | Current documentation; reviewed 2026-07-17 | Comparison point for stable document IDs, hashes, and incremental ingestion | Informative, not a dependency |
| [Ragas metrics](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/) | Stable documentation; reviewed 2026-07-17 | Vocabulary for retrieval, context, and faithfulness evaluation | Informative, not a dependency |
| [MediaWiki architecture](https://www.mediawiki.org/wiki/Manual:MediaWiki_architecture) and [job queue](https://www.mediawiki.org/wiki/Manual:Job_queue) | Current documentation; reviewed 2026-07-17 | Comparison point for revision-driven invalidation and deferred maintenance | Informative, not a dependency |
| [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/) | Current project; reviewed 2026-07-17 | Security review vocabulary | Informative |
| [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) | Development conventions; reviewed 2026-07-17 | Optional telemetry vocabulary; raw prompts are not required | Informative |

“Tracked version” above is the compatibility target. Before claiming support
for a newer upstream version, a maintainer must review the upstream diff,
update this table, regenerate the bundle, and run all conformance and retrieval
gates. For an unversioned upstream, record the review date and, when it affects
implementation semantics, the reviewed commit in the change description.

## Local Profile

The local profile is **Xinbaopedia OKF Profile v1**, layered on OKF v0.1 Draft.
Its canonical source is `wiki/*.md`; files under `public/okf/` are generated
exports and must not be edited by hand.

The profile adds the following producer requirements:

- `type`, `title`, `description`, `tags`, and `timestamp` are required on every
  concept. Base OKF requires only `type`; the stricter fields are a local
  quality policy.
- English and Chinese public concepts are paired and checked for translation
  consistency.
- Hidden concepts remain available to local maintenance but are excluded from
  the public pages, graph, concepts, sources, and retrieval corpus.
- WikiLinks, Markdown links, and typed frontmatter relations must resolve.
- Stable page and chunk hashes support freshness checks and incremental
  retrieval indexing.
- A generated source registry links canonical HTTP(S) evidence to dependent
  pages and evidence locations without inventing sources for unsupported
  claims. Its generated `not-checked` status is a declaration, not a persistent
  record of remote availability; link-audit artifacts supply point-in-time
  observations for individual runs.
- Generated review metadata distinguishes content modification from the
  editorial review baseline and records when the next review is due. Existing
  migration baselines are not claims of human or remote-source revalidation;
  maintenance no longer creates review provenance automatically for new pages.
- Retrieval metadata uses stable `slug#section` chunk IDs and public wiki URLs.
- Every generated artifact must match the current canonical source hash.

The local machine-readable schema is `wiki/maintenance-schema.json`; the
public copy is `public/okf/schema.json`. `schemaVersion` versions local profile
artifacts. `okfVersion` identifies the upstream base format. They are different
version axes and must not be conflated.

## Conformance Matrix

| Concern | OKF v0.1 Draft | Xinbaopedia profile |
| --- | --- | --- |
| Concept representation | Markdown with YAML frontmatter | Same |
| Required concept metadata | `type` | `type`, `title`, `description`, `tags`, `timestamp` |
| Root navigation | Reserved `index.md` | Bilingual `index.md` and `index_zh.md` |
| History | Reserved chronological `log.md` | Bilingual append-only logs plus Git history |
| External evidence | `# Citations` convention | Canonical body citations plus generated source registry and coverage report |
| Relationships | Standard links; semantics may be described in prose | WikiLinks, Markdown links, and a local typed relation taxonomy |
| Broken links | Consumers should tolerate them | Producers fail local link gates; external links are classified as healthy, broken, or indeterminate |
| Lifecycle | Not prescribed | Generated status, confidence, review, retention, and review-due metadata |
| Languages | Not prescribed | English/Chinese pairing and language-specific retrieval |
| Retrieval | Not prescribed | Stable heading chunks, content hashes, lexical retrieval, citations, and a golden-set gate |
| Hidden knowledge | Not prescribed | Explicitly excluded from every public export and retrieval result |

Base OKF conformance therefore does not imply conformance to the Xinbaopedia
profile. Conversely, local typed relations, lifecycle fields, retrieval scores,
and source coverage are project extensions rather than claims about the OKF
standard.

## Claim Boundaries

- Xinbaopedia follows the LLM Wiki pattern, but the Karpathy gist is neither a
  formal standard nor a production reference implementation.
- Xinbaopedia emits an OKF-compatible bundle and a stricter local profile; it
  does not claim that OKF v0.1 standardizes retrieval, evaluation, bilingual
  pairing, typed graphs, or review scheduling.
- The project does not claim to implement Microsoft GraphRAG. Its current
  curated graph may expand retrieval candidates, but it does not perform the
  GraphRAG indexing and community-report pipeline.
- The offline evaluator borrows established retrieval terminology, but passing
  it is not a claim of Ragas compatibility or an independent proof of factual
  correctness.
- The chat runtime has stricter response controls than the offline retrieval
  metrics alone: unsupported requests receive a deterministic server response
  without a provider call, and provider answers fail closed unless they contain
  valid `[n]` citations. Only actually cited sources are returned. Client-provided
  history is neither retrieval evidence nor provider input. Release smoke
  exercises both a real provider-backed answer and the deterministic abstention
  path; it is still a canary, not a general proof of model faithfulness.
- A successful structural or hash freshness check proves that generated files
  match the repository source. It does not prove that real-world facts remain
  current; source checks and scheduled human review provide that evidence.
- A weekly remote-link audit records what that workflow observed at that time.
  It does not mutate the source registry or prove that a URL remains available
  after the run.

## Verification

Run the following from the repository root:

```bash
npm run lint:content
npm run lint:okf
npm run audit:wiki -- --check-links --output artifacts/wiki-maintenance-audit.json
npm run eval:wiki-chat -- --output artifacts/wiki-chat-evaluation.json
```

The audit and evaluator emit versioned JSON and return a non-zero exit code
when their enforced gates fail. External sites that block automation, rate
limit, time out, or return a transient server error are reported as
`indeterminate`; confirmed invalid URLs and HTTP 400/404/410 responses fail the
audit. `--strict-indeterminate` is available for a deliberately stricter run.
The resulting audit file is run-scoped evidence and does not persist remote
verification into `wiki/source-registry.json` or `public/okf/sources.json`.
