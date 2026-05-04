# Xinbao Qiao Academic Wiki

A richer personal academic homepage and LLM-maintained wiki for Xinbao Qiao.

## Stack

- Next.js 15 static export
- React 19
- `react-markdown`
- `gray-matter`
- `wiki/*.md` as the canonical source of truth
- `[[WikiLink]]` preprocessing with blue existing links and red missing links

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Static export

```bash
npm run build
```

The static site is exported to `out/`.

## Editing

Edit `wiki/*.md`, then run:

```bash
npm run check
```

Paper pages must be classified under research-topic pages and reflected in `wiki/index.md` and `wiki/log.md`.
