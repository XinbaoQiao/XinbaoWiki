---
name: "Log"
occupation: "Maintenance log"
summary: "Append-only maintenance log for the wiki."
---

## 2026-05-05

- Rebuilt the local `XinbaoWiki` project as a Next.js 15 static-export wiki using `react-markdown` and `gray-matter`.
- Updated the page framework toward the Colarpedia/Wikipedia layout: left navigation sections, article tabs, right-side infobox, source/history links, and encyclopedia-style body typography.
- Copied old-homepage images into `public/images/` and extracted representative paper figures from owner-provided manuscript zip files into `public/papers/`.
- Linked the local CV PDF from [[CV]] and refreshed [[Xinbao_Qiao]], [[Publications]], and the main publication pages with local assets and date/status notes.
- Added `scripts/test-wiki-data.mjs` and wired it into `npm run check` to guard required pages, local assets, CV links, and backup URL removal.

## 2026-05-04

- Rebuilt the homepage as a richer academic wiki inspired by the LLM Wiki pattern and Colar-style academic wiki layout.
- Switched page slugs to underscore-style paths such as `/wiki/Xinbao_Qiao/`.
- Added Qiao Xinbao's Chinese name, birthday, birthplace, education timeline, GPA/rank details, research experience, technical skills, and research map.
- Reused visual assets from the earlier GitHub homepage through the backup branch.
- Expanded publication pages for ICML 2026, AAAI 2026, and ICLR 2025 papers.
- Added CV-provided active manuscript pages for decentralized data pruning and LLM illusory pattern perception.
- Classified [[When_Sample_Selection_Bias_Precipitates_Model_Collapse]] under synthetic data, recursive synthetic-data training, selection bias, model collapse, data silos, collaborative evaluation, and Wasserstein geometry.
- Added `CLAUDE.md` rules for future LLM-maintained wiki updates: new papers must be created as pages, categorized, backlinked, indexed, and logged.
