---
name: "Log"
occupation: "Maintenance log"
summary: "Append-only maintenance log for the wiki."
---

## 2026-05-05

- Rebuilt the local `XinbaoWiki` project as a Next.js 15 static-export wiki using `react-markdown` and `gray-matter`.
- Updated the page framework toward the Colarpedia/Wikipedia layout: left navigation sections, article tabs, right-side infobox, source/history links, and encyclopedia-style body typography.
- Retained one old-homepage portrait in `public/images/Portrait.png` and removed publication-page image displays.
- Linked the local CV PDF from [[CV]] and refreshed [[Xinbao_Qiao]], [[Publications]], and the main publication pages with date/status notes.
- Added `scripts/test-wiki-data.mjs` and wired it into `npm run check` to guard required pages, local assets, CV links, and backup URL removal.
- Tightened the page framework to match Colarpedia class names and structure, and reduced displayed media to one portrait image.
- Added [[Qiao_Xinbao_zh|乔鑫宝]] as the Chinese version, moved Talk to GitHub Issues, simplified Contact to one email address, renamed the sidebar's publication list to research topics, and rewrote [[Xinbao_Qiao]] around chronological research experience and academic-project sections.
- Removed the temporarily withheld LLM manuscript from [[Publications]] and the public index.

## 2026-05-04

- Rebuilt the homepage as a richer academic wiki inspired by the LLM Wiki pattern and Colar-style academic wiki layout.
- Switched page slugs to underscore-style paths such as `/wiki/Xinbao_Qiao/`.
- Added Qiao Xinbao's Chinese name, birthday, birthplace, education timeline, GPA/rank details, research experience, technical skills, and research map.
- Reused visual assets from the earlier GitHub homepage through the backup branch.
- Expanded publication pages for ICML 2026, AAAI 2026, and ICLR 2025 papers.
- Added a CV-provided active manuscript page for decentralized data pruning.
- Classified [[When_Sample_Selection_Bias_Precipitates_Model_Collapse]] under synthetic data, recursive synthetic-data training, selection bias, model collapse, data silos, collaborative evaluation, and Wasserstein geometry.
- Added `CLAUDE.md` rules for future LLM-maintained wiki updates: new papers must be created as pages, categorized, backlinked, indexed, and logged.
