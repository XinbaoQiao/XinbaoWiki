# Xinbaopedia

Xinbaopedia is a personal academic wiki and homepage for Xinbao Qiao. It presents biographical, research, publication, project, and study notes in a Wikipedia-inspired interface while keeping `wiki/*.md` as the canonical content source.

Production site: <https://xinbaopedia.top>

## What This Repository Contains

- A Next.js 15 and React 19 application for rendering wiki pages.
- English and Chinese Markdown articles under `wiki/`.
- Wiki-link preprocessing for `[[WikiLink]]` references.
- Search, language switching, article tabs, and infobox components.
- `Chat with Xinbao`, a same-site conversational assistant backed by server-only routes.
- Optional Cloudflare Worker proxy configuration under `cloudflare/`.

Rendered pages, build output, caches, logs, and deployment artifacts are not knowledge sources. Update the Markdown source files first, then rebuild and redeploy the application.

## Project Layout

```text
app/                    Next.js pages, layout, and API routes
components/             Wiki UI and chat components
lib/                    Wiki parsing, search index, and chat helpers
wiki/                   Canonical Markdown content
public/                 Static images, PDFs, icons, and paper assets
scripts/                Wiki validation scripts
chat with xinbao/       Chat assistant notes and environment template
cloudflare/             Optional Worker proxy
```

## Stack

- Next.js 15
- React 19
- TypeScript
- `react-markdown`, `remark-gfm`, `remark-math`, and `rehype-katex`
- `gray-matter` frontmatter parsing
- Upstash Redis and a server-side LLM endpoint for `Chat with Xinbao`
- Vercel production deployment

## Local Development

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Validation

Run the full local check before publishing any source or content change:

```bash
npm run check
npm run build
```

`npm run check` runs TypeScript, wiki-link linting, and wiki data tests. `npm run build` validates that the Next.js application can render all generated routes.

## Editing Wiki Content

Edit the relevant file under `wiki/`. Keep prose third-person, neutral, concise, and factual. Use frontmatter for page metadata and `[[WikiLink]]` for internal references.

When adding or changing paper pages, also update the relevant research-topic pages and keep index/log pages aligned:

- `wiki/index.md`
- `wiki/index_zh.md`
- `wiki/log.md`
- `wiki/log_zh.md`

## Chat with Xinbao

The chat feature lives in:

- `components/ChatWithXinbao.tsx`
- `app/api/chat-with-xinbao/route.ts`
- `app/api/chat-with-xinbao/questions/route.ts`
- `lib/chat-with-xinbao.ts`
- `chat with xinbao/`

Runtime credentials belong in deployment environment variables, never in tracked files. See `chat with xinbao/env.example` for the expected variable names.

## Deployment

The primary deployment target is Vercel. After validation passes, commit the relevant tracked source changes, push to `origin main`, deploy production, and verify the homepage plus at least one changed page on <https://xinbaopedia.top>.

The Cloudflare Worker proxy is optional and documented in `cloudflare/README.md`.
