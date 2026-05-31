# CLAUDE.md

This repository is a personal academic wiki homepage for Xinbao Qiao.

## Core principle

The canonical source is `wiki/*.md`. The rendered website is a compiled artifact. Do not treat generated HTML or React components as the knowledge source.

## Tone

Write in third-person, neutral, objective, Wikipedia-style academic prose. Avoid marketing language. Prefer concise factual statements, explicit scope, and source notes for owner-provided or not-yet-public metadata.

## Frontmatter schema

Common page fields:

```yaml
---
name: "Page title"
native_name: ""
born: ""
birth_place: ""
residence: ""
occupation: []
affiliation: []
education: []
avatar: ""
links:
  - label: "Google Scholar"
    url: "https://..."
summary: "One-sentence summary."
aliases: []
---
```

Publication page fields:

```yaml
---
name: "Paper title"
type: "publication"
authors: []
venue: ""
year: 2026
status: "accepted"
publication_type: "Conference paper"
categories: []
links: []
image: ""
summary: "One-sentence paper summary."
---
```

## Workflow: add one page X

For the Chinese instruction "加一页 X", follow this exact workflow:

1. Create `wiki/X.md`.
2. Add `[[X]]` to the homepage article `wiki/Xinbao_Qiao.md` when the page is biographically or academically relevant.
3. Link it from the most relevant parent page with `[[X]]`.
4. Add it to `wiki/index.md`.
5. Append a dated note to `wiki/log.md`.
6. Run `npm run check`.

## Workflow: add one paper

A paper must not exist only under `Publications`. It must be classified under topic pages.

1. Create or update `wiki/<Paper Title>.md`.
2. Fill publication frontmatter.
3. Add `categories` for research clusters and method/topic pages.
4. Add backlinks from `Publications.md`, `Research.md`, and every category page.
5. Update `wiki/index.md`.
6. Append `wiki/log.md`.
7. Run `npm run check`.

## Workflow: publish after implementation

After every completed implementation or content edit, use the repository default publish workflow unless the user explicitly overrides it for that turn:

1. Run `npm run check`.
2. Run `npm run build`.
3. Stage only files directly related to the request.
4. Commit with a concise descriptive message.
5. Push to `origin main`.
6. Deploy production on Vercel under the `xinbaopedia` scope.
7. Verify `https://xinbaopedia.top` and at least one changed page.

Never commit API keys, tokens, `.env*`, `.secrets/`, local caches, generated build output, runtime logs, or unrelated untracked files. Use workspace credentials only ephemerally.

## WikiLink convention

Use `[[Page Name]]` or `[[Page_Name|display text]]`. Existing pages render as blue links. Missing pages render as red links.

## Source policy

- Public profile links may be listed directly.
- Owner-provided private manuscripts may be summarized, but the PDF should not be committed unless explicitly cleared for public release.
- Bibliographic metadata not yet publicly indexed must be marked as owner-provided or manuscript-provided.
