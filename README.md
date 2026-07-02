# Xinbaopedia

> A Wikipedia-inspired personal academic wiki for Xinbao Qiao.

Xinbaopedia is a public-facing academic homepage, research archive, and living wiki. It collects Xinbao Qiao's biography, research interests, publications, projects, education, experience, and related study notes in one searchable site.

Visit the site: <https://xinbaopedia.top>

---

## What It Is

Xinbaopedia is designed as a small academic knowledge base rather than a conventional personal homepage. Instead of placing every detail on a single profile page, it organizes information into connected wiki articles:

| Area | What It Covers |
| --- | --- |
| Profile | Academic biography, affiliations, education, and contact information. |
| Research | Topics such as data-centric machine learning, trustworthy AI, distributed learning, unlearning, and model collapse. |
| Publications | Paper pages with summaries, venues, figures, posters, and related topic links. |
| Projects | Research prototypes, collaboration notes, and selected implementation records. |
| Notes | Supporting pages for concepts, institutions, skills, and reading trails. |

The result is a homepage that can grow like a knowledge graph. A visitor can start from the biography, jump into a paper, follow a research topic, and return through related pages without losing context.

## Highlights

- **Wikipedia-style reading experience**: article pages, infoboxes, internal links, side navigation, and neutral academic prose.
- **Bilingual content**: English and Chinese pages are maintained side by side for major entries.
- **Searchable knowledge base**: the site includes a searchable index across visible wiki pages.
- **Research-first organization**: papers are connected to broader research topics instead of being listed as isolated entries.
- **Living archive**: the repository can keep long-term records of projects, notes, resources, and publication updates.
- **Chat with Xinbao**: the site includes a lightweight conversational assistant grounded in public wiki content.
- **Production-ready publishing**: the main site is deployed on Vercel at <https://xinbaopedia.top>.

## Content Philosophy

The wiki aims to be factual, scoped, and maintainable.

- Main pages should use third-person, neutral, academic prose.
- Biographical claims should be concrete and not overstate uncertain information.
- Research pages should explain context, motivation, and connections between work.
- Paper pages should be linked back to relevant research-topic pages.
- Generated pages, build artifacts, logs, caches, and deployment outputs are not treated as source material.

The canonical content lives in `wiki/*.md`. If a public page needs to change, the Markdown source should change first.

## Content Maintenance Backend

The maintenance model combines the LLM Wiki v2 lesson that the schema is the product with the Open Knowledge Format principle that knowledge should stay human-readable, parseable, and portable. The canonical source remains `wiki/*.md`, but every source page is now treated as a concept with explicit frontmatter:

| Field | Purpose |
| --- | --- |
| `type` | Required concept type for routing, filtering, and presentation. |
| `title` | Stable display title for humans and agents. |
| `description` | One-sentence summary used by indexes, search, and previews. |
| `tags` | Cross-cutting categories for future tag views and retrieval. |
| `timestamp` | Last meaningful source timestamp. |

Run the deterministic maintainer after content changes:

```bash
npm run maintain:wiki
```

It standardizes source frontmatter and regenerates:

| File | Purpose |
| --- | --- |
| `wiki/pages.json` | Public, hidden-filtered page catalog for content consumers. |
| `wiki/graph.json` | Nodes, wikilink edges, backlinks, lifecycle metadata, type/language counts, and maintenance warnings. |
| `wiki/maintenance-schema.json` | Machine-readable maintenance contract: required fields, quality gates, lifecycle policy, and generated artifact list. |
| `public/okf/` | Public OKF v0.1-compatible bundle with `index.md`, `log.md`, `manifest.json`, JSON indexes, graph, schema, and one Markdown concept per public page. |

`npm run check` verifies that source concepts are standardized, generated files are fresh, hidden pages are excluded from public indexes and OKF exports, and the graph still resolves internal links. This makes the upkeep loop explicit: edit Markdown, run `npm run maintain:wiki`, review warnings, then build and publish.

The current lifecycle layer is concept-level. It records active/confirmed/private status, confidence, review cadence, and retention policy in generated graph and OKF exports. This leaves room for later claim-level confidence, supersession, richer relation types, hybrid search, and automated crystallization without changing how normal content edits are made.

## How The Site Is Organized

```text
wiki/                   Source articles for the public wiki
public/                 Images, PDF files, icons, and paper figures
public/okf/             Public agent-readable OKF bundle generated from wiki/*.md
app/                    Site pages and server endpoints
components/             Visual building blocks for the wiki interface
lib/                    Shared helpers for wiki rendering and chat behavior
scripts/                Content checks and wiki validation tools
chat with xinbao/       Notes and templates for the chat assistant
```

## Main Features

### Connected Wiki Pages

Articles can reference each other with wiki-style links. This keeps the site navigable as more research topics, papers, and project pages are added.

### Bilingual Entries

Many pages have English and Chinese versions. The language switcher lets readers move between paired entries when both versions exist.

### Academic Infoboxes

Profile, institution, project, and paper pages can show structured information in compact infoboxes. This gives visitors a quick summary before they read the full article.

### Search And Navigation

The top search bar indexes public wiki pages so visitors can find topics, papers, people, institutions, and concepts quickly.

### Chat With Xinbao

The chat assistant answers questions about public site content, such as research directions, publications, projects, academic background, and contact information. It is intended as a lightweight guide to the wiki, not as a replacement for the source pages.

## Publishing Flow

The production site is published through Vercel under the `xinbaopedia` scope.

The usual publishing process is:

1. Update the relevant source files, usually under `wiki/` or `README.md`.
2. Run the repository checks:

   ```bash
   npm run check
   npm run build
   ```

3. Commit the reviewed source changes.
4. Push the commit to `origin main`.
5. Deploy production on Vercel.
6. Verify the homepage and at least one changed page on <https://xinbaopedia.top>.

## Editing Guidance

When editing wiki content:

- Write for readers first, not for the build system.
- Keep the public tone academic, neutral, and concise.
- Prefer a short main explanation plus links to deeper pages.
- Connect new paper pages to relevant topic pages.
- Keep English and Chinese paired pages aligned when both exist.
- Update index and log pages when adding major new entries.
- Run `npm run maintain:wiki` so source frontmatter, the page catalog, the graph, the maintenance schema, and the public OKF bundle reflect the current source pages.

Useful high-level pages include:

- `wiki/index.md`
- `wiki/index_zh.md`
- `wiki/Research.md`
- `wiki/Research_zh.md`
- `wiki/Publications.md`
- `wiki/Publications_zh.md`
- `wiki/log.md`
- `wiki/log_zh.md`

## Built With

Xinbaopedia is built as a modern web application with Next.js, React, TypeScript, Markdown rendering, and Vercel deployment. The implementation details are intentionally kept behind the reading experience: visitors should see a clear academic wiki, while maintainers can still update the site through structured Markdown files.

Runtime credentials and private service tokens should stay in deployment environment variables. They should never be committed to this repository.

---

Xinbaopedia is a personal academic project. It is stylistically inspired by Wikipedia but is not affiliated with the Wikimedia Foundation.
