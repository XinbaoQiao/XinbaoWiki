# Contributing to Xinbaopedia

Xinbaopedia is a Git-native, bilingual academic Wiki with a cited LLM interface
and an OKF-compatible public export. Contributions are welcome when they make
the public knowledge base more accurate, navigable, reproducible, accessible,
or secure.

## Choose the Right Channel

- Use a **Content correction** Issue for a factual, citation, translation, or
  biographical correction.
- Use a **Bug report** for reproducible site, API, theme, search, retrieval, or
  accessibility defects.
- Use a **Feature request** to propose a new capability or workflow.
- Follow [SECURITY.md](SECURITY.md) and report vulnerabilities privately.

Do not put unpublished personal information, credentials, private questions,
private prompts, or raw user/IP data in an Issue, pull request, commit, log, or
screenshot.

## Canonical and Generated Files

| Path | Contribution rule |
| --- | --- |
| `wiki/*.md` | Canonical source for public knowledge content; edit these files |
| `wiki/pages.json`, `wiki/graph.json`, `wiki/maintenance-schema.json`, `wiki/quality-report.json`, `wiki/source-registry.json` | Generated maintenance artifacts; do not hand-edit |
| `public/okf/` | Generated public OKF bundle; do not hand-edit |
| `evals/wiki-chat-golden.json` | Reviewed answer-boundary contract; change only when intended retrieval behavior changes |
| `artifacts/` | Local or CI evidence; never commit |

After a canonical Wiki change, run `npm run maintain:wiki` and include only the
generated changes produced by that command. Inspect the diff: generation must
not expose hidden pages, remove unrelated citations, or rewrite unrelated
concepts.

## Content Standards

Wiki contributions should:

- use third-person, neutral, concise, Wikipedia-style academic prose;
- verify material claims against authoritative public evidence such as the
  publisher, venue, institution, ORCID, OpenReview, or an owner-approved
  primary source;
- cite the public source close to the claim and avoid placeholder or
  coverage-only URLs;
- preserve the meaning of claims and evidence across the paired English and
  Chinese pages rather than translating only the sentence surface;
- review affected WikiLinks, backlinks, and typed relations;
- keep biography and contact details factual, public, necessary, and narrowly
  scoped;
- include `Key takeaways` on public English publication pages and `关键启示` on
  their Chinese counterparts;
- preserve required frontmatter, content hashes, review provenance, and OKF
  profile fields.

A generated content hash proves repository freshness, not that a real-world
claim remains true. Do not advance `reviewed_at` merely to make a check pass.
Only a maintainer who reviewed the new revision and its evidence should approve
that lifecycle transition. If a contribution is waiting for that review,
describe it clearly in the pull request.

## Development Workflow

The project uses Node.js 22.

```bash
npm ci
npm run dev
```

Keep each change focused and preserve unrelated work. Add or update tests for
behavioral changes. Do not commit `.env*`, tokens, Vercel state, caches, build
output, runtime logs, or local artifacts.

For a Wiki content change:

```bash
npm run maintain:wiki
npm run check
npm run build
```

For a code or documentation change, run at minimum:

```bash
npm run check
npm run build
```

If an external-source audit is relevant, also run:

```bash
npm run audit:wiki -- --check-links --output artifacts/wiki-maintenance-audit.json
```

External sites may block automation. Report an indeterminate link result; do
not delete citations in bulk or claim that every remote source was verified.

## Pull Requests

A pull request should explain:

- the problem and the smallest change that solves it;
- canonical source files and generated files affected;
- authoritative evidence for factual changes;
- English/Chinese pairing impact;
- commands run and their results;
- changed routes, screenshots, or accessible reproduction steps for UI work;
- any privacy, security, LLM-answer-boundary, or deployment impact;
- permission or provenance for every new image, font, logo, dataset, or other
  third-party asset.

By contributing, you confirm that you have the right to submit the material and
that it does not knowingly contain secrets, private user data, or unauthorized
third-party content. Code contributions are accepted under the MIT License;
original text contributions are accepted under CC BY 4.0; and assets are
accepted only under documented, compatible terms. Any repository-level license
does not override third-party rights or asset-specific terms.
