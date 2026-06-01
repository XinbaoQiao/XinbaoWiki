---
name: "Log"
occupation: "Maintenance log"
summary: "Append-only maintenance log for the wiki."
---

## 2026-05-31

- Polished [[Xinbao_Qiao]] and [[Qiao_Xinbao_zh]] so the opening reads as a compact research profile, the research-experience section remains chronological, and the academic-project section is framed as problem clusters rather than repeated biography.
- Reformatted the accepted-paper table in [[Publications]] so each publication cell separates title, authors, and summary onto distinct lines.
- Reformatted the accepted-paper venue/status column so conference name, dates, and location render on separate lines.
- Widened the venue/status column on [[Publications]] so the header and short venue lines do not wrap unexpectedly.
- Tightened the [[Publications]] venue/status column to a compact fixed width just wider than the header.
- Styled accepted-paper summaries in [[Publications]] as muted annotation lines to distinguish them from titles and authors.
- Shortened the accepted-paper summary for [[When_Sample_Selection_Bias_Precipitates_Model_Collapse]] to keep only the tail-pruning statement in the publication table.

## 2026-05-27

- Updated the model-collapse publication page and linked research-topic pages from the revised manuscript, emphasizing low-resource verification regimes, fragmented real-data coverage, and tail-mode pruning in low-resource communities.
- Refreshed [[Xinbao_Qiao]], [[Publications]], [[Research]], [[Projects]], related concept pages, and `CV.tex` so the ICML 2026 paper is described through the newer low-resource-community framing.

## 2026-05-06

- Polished the English and Chinese biography pages with tighter opening prose, clearer doctoral-stage wording, and less repetition between research experience and project summaries.
- Reordered the opening biography footnote references so the Xinbao name-coincidence note appears before the Xinbao Qiao bridge-coincidence note.
- Updated the visible sidebar so Navigation includes [[Publications]], and the Experience section appears after Education with only [[NUSRI_CQ|NUSRI-CQ]].
- Added a compact name footnote to [[Xinbao_Qiao]] and [[Qiao_Xinbao_zh]] explaining the "Qiao"/"ciao" nickname relation and the "Mr. Ciao" handle.
- Added [[Internet_Slang_2026]] and [[Internet_Slang_2026_zh|2026热梗]] as yearly Chat with Xinbao tone references, expanded the meme-style prompt boundaries, and softened the opening greeting so it is playful but still appropriate for an academic homepage.
- Updated the CUHK doctoral-stage narrative around [[AI_and_Networks|AI and networks]], added [[Distributed_Wasserstein_Barycenter]] as the current Wasserstein barycenter focus, and reorganized research overview pages toward a compiled LLM-wiki-style map.
- Added `Chat with Xinbao`, a same-site AI assistant entry beside the search bar, with a server-only Next.js API route, Yunwu model proxying, Upstash-backed rate limits, and deployment/security documentation.
- Restricted the top search dropdown to the active page language, so English pages return English wiki entries and Chinese pages return Chinese wiki entries.

## 2026-05-05

- Replaced the inert top search form with a client-side static wiki search index, ranked dropdown results, and keyboard navigation.
- Enlarged standalone poster images while keeping ordinary paper figures at the medium article size.
- Rebalanced standalone paper-image sizing and replaced float-clearing image layout with `flow-root` image paragraphs to avoid large blanks beside infoboxes.
- Added static Chinese pages for the full wiki article set, made the language toggle page-specific, and routed Chinese-page body WikiLinks to Chinese counterparts.
- Further reduced body article image sizing so standalone paper figures stay compact inside publication pages.
- Replaced the custom topic diagrams and model-collapse teaser with generated conceptual PNG illustrations using short English labels, and reduced standalone paper-image sizing.
- Removed numeric prefixes from generated concept-illustration titles and reduced standalone paper-image sizing by roughly one third.
- Rendered publication formulas with KaTeX display math, constrained paper figures to readable article widths, and added a local teaser diagram for [[When_Sample_Selection_Bias_Precipitates_Model_Collapse]].
- Enlarged the Xinbaopedia favicon mark and added custom SVG topic diagrams to the four main research-topic infoboxes.
- Updated portrait captions to identify Singapore EXPO during ICLR 2025 and added advisor pages for [[Angela_Yingjun_Zhang|Angela Yingjun Zhang]] and [[Meng_Zhang|Meng Zhang]], with official profile links and biography back-links.
- Updated the English biography Born row to month-level date and place, and bolded Xinbao Qiao's author name in publication index and paper pages.
- Pruned explanatory-only footnotes from the biography and generic topic pages; retained only compact source notes or name/context notes that improve readability without cluttering the prose.
- Shortened Venue/status cells to status-only or conference/date/place format, added source URLs to CUHK-related footnotes, and rendered biography infobox rows as aligned multiline values rather than nested lists.
- Matched the Colarpedia source framework for the visible chrome: text-only top wordmark, page-specific Article/Talk/View source/History tabs, and a flat `h4`/`ul` sidebar with LinkedIn and Email the author under Contribute.
- Renamed site metadata to Xinbaopedia, added a wiki-style site icon, shortened left-sidebar institution labels, and aligned the biography Born row with the Colarpedia infobox pattern.
- Standardized the four Research topics pages with Introduction, Role in this wiki, Publications, Connection to Qiao's work, and See also sections; publication tables now include conference timing, arXiv timing, or ongoing status.
- Expanded institution pages for [[The_Chinese_University_of_Hong_Kong]], [[Zhejiang_University]], [[Shandong_University]], and [[NUSRI_CQ]] with logos, program context, Qiao-specific connections, and explanatory footnotes.
- Expanded linked research-topic pages, including [[AI_and_Networks]], [[Machine_Unlearning]], [[Synthetic_Data_and_Model_Collapse|Synthetic Data]], and [[Data_Centric_Machine_Learning|Data Centric ML]], so topic links open into standalone wiki articles rather than brief placeholders.
- Updated [[Xinbao_Qiao]] and [[Qiao_Xinbao_zh]] so the current occupation is PhD student, affiliation is the Department of Information Engineering at CUHK, birthplace appears in prose rather than the infobox, and education is ordered from newest to oldest.
- Recentered the wiki's research framing around [[AI_and_Networks|AI and Networks]] and shortened sidebar topic labels to compact wiki-style names.
- Rewrote the accepted paper pages with consistent overview, method, formula, results, and placement sections.
- Replaced publication infobox categories with conference locations for ICLR 2025, AAAI 2026, and ICML 2026 entries.
- Added wiki-style footnotes to [[Xinbao_Qiao]] and [[Qiao_Xinbao_zh]], and removed unused References sections.
- Added compressed ICLR 2025 poster images for [[Hessian_Free_Online_Certified_Unlearning|Hessian-Free Online Certified Unlearning]] and [[DynFrs|DynFrs: An Efficient Framework for Machine Unlearning in Random Forest]], plus the soft-weighted unlearning framework figure.
- Rebuilt the local `XinbaoWiki` project as a Next.js 15 static-export wiki using `react-markdown` and `gray-matter`.
- Updated the page framework toward the Colarpedia/Wikipedia layout: left navigation sections, article tabs, right-side infobox, source/history links, and encyclopedia-style body typography.
- Retained one old-homepage portrait in `public/images/Portrait.png`; paper-specific figures are stored separately under `public/papers`.
- Linked the local CV PDF from [[CV]] and refreshed [[Xinbao_Qiao]], [[Publications]], and the main publication pages with date/status notes.
- Added `scripts/test-wiki-data.mjs` and wired it into `npm run check` to guard required pages, local assets, CV links, and backup URL removal.
- Tightened the page framework to match Colarpedia class names and structure, and reduced displayed media to one portrait image.
- Added [[Qiao_Xinbao_zh|乔鑫宝]] as the Chinese version, moved Talk to GitHub Issues, simplified Contact to one email address, renamed the sidebar's publication list to research topics, and rewrote [[Xinbao_Qiao]] around chronological research experience and academic-project sections.
- Removed a temporarily withheld manuscript from [[Publications]] and the public index.
- Updated the infobox framework so Affiliation lists only the current institution, Education links only the school name with degree details on the next line, Contact includes OpenReview and GitHub, and the portrait caption records Singapore.
- Made the language toggle route-aware so the Chinese article links back to the English article; pointed Talk to GitHub new issue creation and History to GitHub commits.
- Added paper figures extracted from owner-provided zip packages to [[When_Sample_Selection_Bias_Precipitates_Model_Collapse]], [[Hessian_Free_Online_Certified_Unlearning|Hessian-Free Online Certified Unlearning]], and [[Soft_Weighted_Machine_Unlearning|Beyond Binary Erasure: Soft-Weighted Unlearning for Fairness and Robustness]].
- Refreshed the LaTeX CV source with current CUHK contact, education, research experience, publication statuses, and the public-paper list.

## 2026-05-04

- Rebuilt the homepage as a richer academic wiki inspired by the LLM Wiki pattern and Colar-style academic wiki layout.
- Switched page slugs to underscore-style paths such as `/wiki/Xinbao_Qiao/`.
- Added Qiao Xinbao's Chinese name, birthday, birthplace, education timeline, GPA/rank details, research experience, technical skills, and research map.
- Reused visual assets from the earlier GitHub homepage through the backup branch.
- Expanded publication pages for ICML 2026, AAAI 2026, and ICLR 2025 papers.
- Added a CV-provided active manuscript page for decentralized data pruning.
- Classified [[When_Sample_Selection_Bias_Precipitates_Model_Collapse]] under synthetic data, recursive synthetic-data training, selection bias, model collapse, data silos, collaborative evaluation, and Wasserstein geometry.
- Added `CLAUDE.md` rules for future LLM-maintained wiki updates: new papers must be created as pages, categorized, backlinked, indexed, and logged.
