import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import matter from 'gray-matter';

const root = process.cwd();
const wikiDir = path.join(root, 'wiki');

function read(file) {
  return fs.readFileSync(path.join(wikiDir, file), 'utf8');
}

function frontmatter(file) {
  const raw = read(file);
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(match, `${file} has YAML frontmatter`);
  return match[1];
}

function frontmatterData(file) {
  return matter(read(file)).data;
}

function assertFile(file) {
  assert.ok(fs.existsSync(path.join(root, file)), `${file} exists`);
}

function assertNoPath(file) {
  assert.ok(!fs.existsSync(path.join(root, file)), `${file} is not part of the Vercel-only deployment`);
}

for (const file of ['Xinbao_Qiao.md', 'Qiao_Xinbao_zh.md', 'index.md', 'log.md', 'CV.md', 'Meng_Zhang.md', 'Angela_Yingjun_Zhang.md', 'Internet_Slang_2026.md']) {
  assertFile(`wiki/${file}`);
}
assertFile('CV.tex');

const chinesePageFiles = fs.readdirSync(wikiDir).filter((file) => file.endsWith('_zh.md'));
assert.ok(chinesePageFiles.length >= 40, 'wiki includes static Chinese versions for the article set');
for (const file of [
  'AI_and_Networks_zh.md',
  'Machine_Unlearning_zh.md',
  'Publications_zh.md',
  'When_Sample_Selection_Bias_Precipitates_Model_Collapse_zh.md',
  'The_Chinese_University_of_Hong_Kong_zh.md',
  'Internet_Slang_2026_zh.md',
  'index_zh.md',
  'log_zh.md'
]) {
  assertFile(`wiki/${file}`);
  assert.equal(frontmatterData(file).language, 'zh', `${file} marks the Chinese language`);
}

const bio = frontmatter('Xinbao_Qiao.md');
const bioData = frontmatterData('Xinbao_Qiao.md');
for (const field of ['name:', 'residence:', 'occupation:', 'education:', 'links:']) {
  assert.ok(bio.includes(field), `Xinbao_Qiao.md frontmatter includes ${field}`);
}

const home = read('Xinbao_Qiao.md');
const zhHome = read('Qiao_Xinbao_zh.md');

function frontmatterSlice(fm, start, end) {
  const match = fm.match(new RegExp(`${start}\\n([\\s\\S]*?)\\n${end}`));
  assert.ok(match, `frontmatter includes ${start} before ${end}`);
  return match[1];
}

const affiliation = frontmatterSlice(bio, 'affiliation:', 'education:');
assert.match(affiliation, /The Chinese University of Hong Kong/, 'affiliation lists current institution');
assert.match(affiliation, /Department of Information Engineering/, 'affiliation includes current department');
assert.doesNotMatch(affiliation, /NUSRI/, 'affiliation excludes past institutions');
assert.doesNotMatch(bio, /^native_name:/m, 'English infobox follows Colarpedia by folding native name into Born');
assert.doesNotMatch(bio, /^birth_place:/m, 'birthplace is kept in prose rather than the infobox');
assert.match(bio, /born: \|\n\s+September 2000 \(age 25\)\n\s+Xishuangbanna, Yunnan\n/, 'English Born row uses the requested month-and-place format');
assert.doesNotMatch(bio, /30 September 2000|Xishuangbanna, Yunnan, China/, 'English Born row omits day and country');
assert.deepEqual(bioData.occupation, ['PhD student'], 'occupation uses PhD student');
assert.equal(bioData.image_caption, 'Photograph taken at Singapore EXPO, 2025', 'English portrait caption identifies Singapore EXPO and year');
const educationBlock = frontmatterSlice(bio, 'education:', 'links:');
assert.deepEqual(bioData.education.map((item) => item.label), ['The Chinese University of Hong Kong', 'Zhejiang University', 'Shandong University'], 'English education is reverse chronological');
assert.deepEqual(bioData.education.at(-1), { label: 'Shandong University', url: '/wiki/Shandong_University/', detail: '(BEng, 2022)' }, 'English education links only school name and keeps degree detail separate');
assert.ok(bioData.links.some((link) => link.title === 'OpenReview' && link.url === 'https://openreview.net/profile?id=~Xinbao_Qiao1'), 'contact replaces Website with OpenReview');
assert.ok(['Mr. Ciao', 'MrCiao', 'Ciao'].every((alias) => bioData.aliases.includes(alias)), 'English biography aliases include Mr. Ciao');

const zhBio = frontmatter('Qiao_Xinbao_zh.md');
const zhBioData = frontmatterData('Qiao_Xinbao_zh.md');
const zhAffiliation = frontmatterSlice(zhBio, 'affiliation:', 'education:');
assert.match(zhAffiliation, /香港中文大学/, 'Chinese affiliation lists current institution');
assert.match(zhAffiliation, /信息工程系/, 'Chinese affiliation includes current department');
assert.doesNotMatch(zhAffiliation, /新加坡国立大学重庆研究院/, 'Chinese affiliation excludes past institutions');
assert.doesNotMatch(zhBio, /^native_name:/m, 'Chinese infobox follows Colarpedia by folding English name into Born');
assert.doesNotMatch(zhBio, /^birth_place:/m, 'Chinese birthplace is kept in prose rather than the infobox');
assert.match(zhBio, /born: \|\n\s+乔鑫宝 \(Xinbao Qiao\)\n\s+2000年9月30日 \(25岁\)\n\s+中国云南西双版纳/, 'Chinese Born row is a multiline Colarpedia-style value');
assert.equal(zhBioData.image_caption, '摄于 ICLR 2025，新加坡 EXPO', 'Chinese portrait caption identifies ICLR 2025 at Singapore EXPO');
assert.ok(['Mr. Ciao', 'MrCiao', '喬', 'ciao'].every((alias) => zhBioData.aliases.includes(alias)), 'Chinese biography aliases include Mr. Ciao and ciao spelling');
const zhEducationBlock = frontmatterSlice(zhBio, 'education:', 'links:');
assert.deepEqual(zhBioData.education.map((item) => item.label), ['香港中文大学', '浙江大学', '山东大学'], 'Chinese education is reverse chronological');
assert.deepEqual(zhBioData.education.at(-1), { label: '山东大学', url: '/wiki/Shandong_University/', detail: '（工学学士，2022）' }, 'Chinese education links only school name and keeps degree detail separate');

assert.match(home, /\[\[Publications\]\]/, 'home article links to Publications');
assert.match(home, /\[\[Research\]\]/, 'home article links to Research');
assert.match(home, /\[\[Angela_Yingjun_Zhang\|Angela Yingjun Zhang\]\]/, 'home article links to the PhD advisor page');
assert.match(home, /\[\[Meng_Zhang\|Meng Zhang\]\]/, 'home article links to the master advisor page');
assert.match(home, /born September 2000 in Xishuangbanna, Yunnan/, 'home article uses month-level birth date');
assert.doesNotMatch(home, /30 September 2000/, 'home article omits exact birth day');
assert.match(zhHome, /2000年9月30日/, 'Chinese page includes birth date');
assert.match(zhHome, /\[\[Angela_Yingjun_Zhang\|Angela Yingjun Zhang\]\]/, 'Chinese home article links to the PhD advisor page');
assert.match(zhHome, /\[\[Meng_Zhang\|Meng Zhang\]\]/, 'Chinese home article links to the master advisor page');
assert.match(read('CV.md'), /\/files\/XinbaoQiao_CV\.pdf/, 'CV page links to local PDF');

const contactCount = (home.match(/mailto:/g) || []).length;
assert.equal(contactCount, 1, 'home infobox contact exposes one email address');
assert.ok(bioData.links.some((link) => link.title === 'GitHub' && link.url === 'https://github.com/XinbaoQiao'), 'contact includes GitHub');

const layout = fs.readFileSync(path.join(root, 'app/layout.tsx'), 'utf8');
const wikiPageTsx = fs.readFileSync(path.join(root, 'app/wiki/[slug]/page.tsx'), 'utf8');
const wikiMarkdownTsx = fs.readFileSync(path.join(root, 'components/WikiMarkdown.tsx'), 'utf8');
const wikiLib = fs.readFileSync(path.join(root, 'lib/wiki.ts'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const nextConfig = fs.readFileSync(path.join(root, 'next.config.mjs'), 'utf8');
assertFile('components/LanguageToggle.tsx');
assertFile('components/ArticleTabs.tsx');
assertFile('components/WikiSearch.tsx');
assertFile('components/ChatWithXinbao.tsx');
assertFile('app/api/chat-with-xinbao/route.ts');
assertFile('app/api/chat-with-xinbao/questions/route.ts');
assertFile('lib/chat-with-xinbao.ts');
assertFile('chat with xinbao/README.md');
assertFile('chat with xinbao/env.example');
assertFile('chat with xinbao/persona-prompt.md');
assertFile('chat with xinbao/meme-voice-notes.md');
assertFile('scripts/wiki-maintenance.mjs');
assertFile('wiki/graph.json');
assertFile('wiki/maintenance-schema.json');
assertFile('public/okf/index.md');
assertFile('public/okf/log.md');
assertFile('public/okf/manifest.json');
assertFile('public/okf/pages.json');
assertFile('public/okf/graph.json');
assertFile('public/okf/schema.json');
assertFile('public/okf/concepts/Xinbao_Qiao.md');
assertNoPath('cloudflare');
assertFile('public/xinbaopedia-icon.png');
assertNoPath('public/xinbaopedia-icon.svg');
const siteIcon = fs.readFileSync(path.join(root, 'public/xinbaopedia-icon.png'));
const languageToggle = fs.readFileSync(path.join(root, 'components/LanguageToggle.tsx'), 'utf8');
const articleTabs = fs.readFileSync(path.join(root, 'components/ArticleTabs.tsx'), 'utf8');
const wikiSearch = fs.readFileSync(path.join(root, 'components/WikiSearch.tsx'), 'utf8');
const chatWithXinbao = fs.readFileSync(path.join(root, 'components/ChatWithXinbao.tsx'), 'utf8');
const chatRoute = fs.readFileSync(path.join(root, 'app/api/chat-with-xinbao/route.ts'), 'utf8');
const chatQuestionsRoute = fs.readFileSync(path.join(root, 'app/api/chat-with-xinbao/questions/route.ts'), 'utf8');
const chatKnowledge = fs.readFileSync(path.join(root, 'lib/chat-with-xinbao.ts'), 'utf8');
const pageIndex = JSON.parse(fs.readFileSync(path.join(wikiDir, 'pages.json'), 'utf8'));
const wikiGraph = JSON.parse(fs.readFileSync(path.join(wikiDir, 'graph.json'), 'utf8'));
const maintenanceSchema = JSON.parse(fs.readFileSync(path.join(wikiDir, 'maintenance-schema.json'), 'utf8'));
const okfManifest = JSON.parse(fs.readFileSync(path.join(root, 'public/okf/manifest.json'), 'utf8'));
const okfPageIndex = JSON.parse(fs.readFileSync(path.join(root, 'public/okf/pages.json'), 'utf8'));
const okfGraph = JSON.parse(fs.readFileSync(path.join(root, 'public/okf/graph.json'), 'utf8'));
const okfSchema = JSON.parse(fs.readFileSync(path.join(root, 'public/okf/schema.json'), 'utf8'));
const okfHome = matter(fs.readFileSync(path.join(root, 'public/okf/concepts/Xinbao_Qiao.md'), 'utf8'));
const okfSyntheticTopic = matter(fs.readFileSync(path.join(root, 'public/okf/concepts/Synthetic_Data_and_Model_Collapse.md'), 'utf8'));
const chatReadme = fs.readFileSync(path.join(root, 'chat with xinbao/README.md'), 'utf8');
const chatEnvExample = fs.readFileSync(path.join(root, 'chat with xinbao/env.example'), 'utf8');
const chatPersona = fs.readFileSync(path.join(root, 'chat with xinbao/persona-prompt.md'), 'utf8');
const chatMemeNotes = fs.readFileSync(path.join(root, 'chat with xinbao/meme-voice-notes.md'), 'utf8');
const internetSlang2026 = read('Internet_Slang_2026.md');
const internetSlang2026Zh = read('Internet_Slang_2026_zh.md');
const questionLogFunction = chatRoute.match(/async function recordQuestionLog[\s\S]*?\n}\n\nfunction withXinbaoSignature/)?.[0] || '';
assert.equal(siteIcon.toString('ascii', 1, 4), 'PNG', 'site icon uses the new PNG app-style mark');
assert.ok(siteIcon.length > 100000, 'site icon keeps enough raster detail for portal and favicon rendering');
assert.match(layout, /title: 'Xinbaopedia'/, 'site metadata title is Xinbaopedia');
assert.match(layout, /icons: \{ icon: pathWithBasePath\('\/xinbaopedia-icon\.png'\) \}/, 'site metadata exposes the base-path-aware PNG site icon');
assert.match(layout, /import 'katex\/dist\/katex\.min\.css';/, 'layout imports KaTeX CSS for rendered formulas');
assert.doesNotMatch(layout, /wiki-logo-mark|<img className=/, 'topbar uses a text-only wordmark');
assert.match(layout, /className="wiki-logo"[\s\S]*href=\{pathWithBasePath\('\/'\)\}[\s\S]*wiki-logo-word[\s\S]*Xinbaopedia[\s\S]*wiki-logo-subtitle[\s\S]*The Academic Wiki/, 'topbar wordmark links to the Wikipedia-style portal homepage');
assert.match(layout, /<ArticleTabs \/>/, 'article tools stay isolated in the top-level layout');
assert.match(layout, /import \{ WikiSearch \} from '@\/components\/WikiSearch';/, 'layout imports the interactive wiki search component');
assert.match(layout, /import \{ getSearchIndex, pathWithBasePath \} from '@\/lib\/wiki';/, 'layout imports the static search index builder');
assert.match(layout, /const searchIndex = getSearchIndex\(\);/, 'layout builds the search index server-side');
assert.match(layout, /<WikiSearch items=\{searchIndex\} hideOnPortal \/>/, 'layout keeps topbar search on article pages without duplicating the portal search');
assert.match(languageToggle, /if \(!decodeURIComponent\(pathname\)\.split\('\/'\)\.includes\('wiki'\)\) return null;/, 'language toggle hides on the portal homepage where language editions are shown in the masthead');
assert.match(wikiSearch, /hideOnPortal\?: boolean;/, 'search component exposes a homepage suppression prop for the topbar instance');
assert.match(wikiSearch, /if \(hideOnPortal && isPortalPath\(pathname\)\) return null;/, 'topbar search can hide on the portal homepage');
assert.doesNotMatch(wikiPageTsx, /Qiao Xinbao Academic Wiki/, 'article metadata no longer uses old Academic Wiki suffix');
assert.match(wikiPageTsx, /\$\{page\.title\} \| Xinbaopedia/, 'article metadata uses Xinbaopedia as the site name');
for (const dependency of ['remark-math', 'rehype-katex', 'katex']) {
  assert.ok(packageJson.dependencies?.[dependency], `package.json includes ${dependency}`);
}
assert.ok(packageJson.dependencies?.['@upstash/redis'], 'package.json includes Upstash Redis for server-side rate limits');
assert.equal(packageJson.scripts?.['maintain:wiki'], 'node scripts/wiki-maintenance.mjs --standardize --write', 'package.json exposes a deterministic wiki maintenance writer');
assert.equal(packageJson.scripts?.['lint:content'], 'node scripts/wiki-maintenance.mjs --check', 'package.json exposes a deterministic content maintenance check');
assert.match(packageJson.scripts?.check || '', /lint:content/, 'repository check includes the content maintenance check');
assert.equal(pageIndex.schemaVersion, 3, 'wiki page index uses the generated content-maintenance schema');
assert.equal(pageIndex.okfVersion, '0.1', 'wiki page index declares the OKF target version');
assert.ok(pageIndex.pages.length >= 80, 'generated page index includes the visible wiki corpus');
assert.ok(pageIndex.pages.some((page) => page.slug === 'Xinbao_Qiao' && page.type), 'generated page index includes typed home-page metadata');
assert.ok(!pageIndex.pages.some((page) => page.slug === 'Learn_What_Matters_Data_Pruning_for_Efficient_Decentralized_Learning'), 'generated page index excludes hidden manuscripts');
assert.equal(wikiGraph.schemaVersion, 3, 'wiki graph uses the generated content-maintenance schema');
assert.equal(wikiGraph.okfVersion, '0.1', 'wiki graph declares the OKF target version');
assert.ok(wikiGraph.nodes.length >= 80, 'wiki graph includes the markdown corpus');
assert.ok(wikiGraph.edges.length >= 100, 'wiki graph captures internal wiki relationships');
assert.ok(wikiGraph.nodes.some((node) => node.slug === 'Projects' && node.backlinks.includes('index')), 'wiki graph records backlinks');
assert.ok(wikiGraph.nodes.some((node) => node.slug === 'Xinbao_Qiao' && node.type), 'wiki graph records derived concept types');
assert.equal(wikiGraph.stats.warnings, 0, 'wiki graph has no publish-time maintenance warnings');
assert.deepEqual(wikiGraph.warnings, [], 'wiki graph warning list is empty after hardening');
assert.ok(wikiGraph.edges.some((edge) => edge.from === 'Synthetic_Data_and_Model_Collapse' && edge.relation === 'depends-on' && edge.source === 'frontmatter' && edge.to === 'Synthetic_Data'), 'wiki graph includes structured frontmatter relations');
assert.ok(wikiGraph.nodes.some((node) => node.slug === 'Synthetic_Data_and_Model_Collapse' && node.relationTypes.includes('depends-on')), 'wiki graph nodes summarize structured relation types');
assert.equal(maintenanceSchema.schemaVersion, 4, 'maintenance schema records the source contract version');
assert.equal(maintenanceSchema.okfVersion, '0.1', 'maintenance schema records the OKF target version');
assert.deepEqual(maintenanceSchema.source.requiredFrontmatter, ['type', 'title', 'description', 'tags', 'timestamp'], 'maintenance schema locks the source frontmatter contract');
assert.ok(maintenanceSchema.source.recommendedFrontmatter.includes('relations'), 'maintenance schema documents structured relation frontmatter');
assert.ok(maintenanceSchema.relations.structured.includes('depends-on'), 'maintenance schema documents supported structured relations');
assert.ok(maintenanceSchema.qualityGates.some((gate) => gate.includes('zero warnings')), 'maintenance schema documents warning-free checks');
assert.ok(maintenanceSchema.generatedArtifacts.includes('public/okf/concepts/*.md'), 'maintenance schema documents the public OKF concept export');
assert.equal(okfManifest.okfVersion, '0.1', 'public OKF manifest declares OKF v0.1');
assert.equal(okfManifest.bundle.publicPages, pageIndex.pages.length, 'public OKF manifest page count matches generated index');
assert.equal(okfManifest.bundle.hiddenPagesExcluded, 2, 'public OKF manifest records hidden-page exclusion');
assert.equal(okfPageIndex.pages.length, pageIndex.pages.length, 'public OKF page index mirrors the public source index');
assert.equal(okfGraph.nodes.length, pageIndex.pages.length, 'public OKF graph excludes hidden source pages');
const publicOkfSlugs = new Set(okfGraph.nodes.map((node) => node.slug));
for (const hiddenSlug of wikiGraph.nodes.filter((node) => node.hidden).map((node) => node.slug)) {
  assert.ok(!JSON.stringify(okfGraph).includes(hiddenSlug), `public OKF graph excludes hidden slug ${hiddenSlug}`);
}
for (const node of okfGraph.nodes) {
  assert.ok(node.outgoing.every((slug) => publicOkfSlugs.has(slug)), `${node.slug} public outgoing links only target public nodes`);
  assert.ok(node.backlinks.every((slug) => publicOkfSlugs.has(slug)), `${node.slug} public backlinks only target public nodes`);
}
for (const edge of okfGraph.edges) {
  assert.ok(publicOkfSlugs.has(edge.from) && publicOkfSlugs.has(edge.to), 'public OKF edges only connect public nodes');
}
assert.equal(okfSchema.okfVersion, '0.1', 'public OKF schema mirrors the maintenance schema');
assert.equal(okfSchema.schemaVersion, 4, 'public OKF schema mirrors the source contract version');
assert.equal(okfHome.data.type, 'PhD student', 'public OKF concept keeps a required type');
assert.equal(okfHome.data.title, 'Xinbao Qiao', 'public OKF concept keeps a required title');
assert.ok(okfHome.data.description, 'public OKF concept keeps a required description');
assert.ok(Array.isArray(okfHome.data.tags) && okfHome.data.tags.length > 0, 'public OKF concept keeps required tags');
assert.ok(okfHome.data.timestamp, 'public OKF concept keeps a timestamp');
assert.ok(okfHome.data.lifecycle?.confidence > 0, 'public OKF concept includes LLM Wiki lifecycle metadata');
assert.ok(okfSyntheticTopic.data.relations.some((relation) => relation.type === 'depends-on' && relation.target === 'Synthetic_Data'), 'public OKF concept exports structured relations');
assert.doesNotMatch(fs.readFileSync(path.join(root, 'public/okf/index.md'), 'utf8'), /^---/m, 'public OKF reserved index has no frontmatter');
assert.doesNotMatch(fs.readFileSync(path.join(root, 'public/okf/log.md'), 'utf8'), /^---/m, 'public OKF reserved log has no frontmatter');

for (const file of fs.readdirSync(wikiDir).filter((file) => file.endsWith('.md'))) {
  const data = frontmatterData(file);
  assert.ok(data.type, `${file} has explicit OKF type`);
  assert.ok(data.title, `${file} has explicit OKF title`);
  assert.ok(data.description, `${file} has explicit OKF description`);
  assert.ok(Array.isArray(data.tags) && data.tags.length > 0, `${file} has OKF tags`);
  assert.ok(data.timestamp, `${file} has OKF timestamp`);
}
assert.doesNotMatch(nextConfig, /output:\s*['"]export['"]/, 'Next config no longer forces static export');
assert.match(wikiMarkdownTsx, /import remarkMath from 'remark-math';/, 'Markdown renderer imports remark-math');
assert.match(wikiMarkdownTsx, /import rehypeKatex from 'rehype-katex';/, 'Markdown renderer imports rehype-katex');
assert.match(wikiMarkdownTsx, /remarkPlugins=\{\[remarkGfm, remarkMath\]\}/, 'Markdown renderer enables GFM and math parsing');
assert.match(wikiMarkdownTsx, /rehypePlugins=\{\[rehypeKatex\]\}/, 'Markdown renderer renders math through KaTeX');
assert.match(languageToggle, /usePathname/, 'language toggle is route-aware');
assert.match(languageToggle, /function activeSlug/, 'language toggle reads the active wiki slug');
assert.match(languageToggle, /function chineseSlug/, 'language toggle can derive page-specific Chinese slugs');
assert.match(languageToggle, /return `\$\{slug\}_zh`;/, 'language toggle maps arbitrary English pages to _zh counterparts');
assert.match(languageToggle, /Qiao_Xinbao_zh/, 'language toggle links to Chinese version');
assert.match(languageToggle, /Xinbao_Qiao/, 'language toggle links back to English version');
assert.match(languageToggle, /English/, 'Chinese page can switch back to English');
assert.match(wikiLib, /export function isChineseSlug/, 'wiki library exposes Chinese slug detection');
assert.match(wikiLib, /export function toChineseSlug/, 'wiki library maps English slugs to Chinese slugs');
assert.match(wikiLib, /export function wikiPageTitle/, 'wiki library exposes the content-maintenance title resolver');
assert.match(wikiLib, /export function wikiPageSummary/, 'wiki library exposes the OKF-compatible summary resolver');
assert.match(wikiLib, /export function wikiConceptType/, 'wiki library exposes the OKF-compatible concept-type resolver');
assert.match(wikiLib, /preprocessWikiLinks\(markdown: string, options: \{ language\?: 'en' \| 'zh' \}/, 'wikilink preprocessing is language-aware');
assert.match(wikiLib, /export type SearchIndexItem/, 'wiki library exposes a typed static search index item');
assert.match(wikiLib, /export function getSearchIndex\(\): SearchIndexItem\[\]/, 'wiki library builds a static search index from markdown pages');
assert.match(wikiLib, /plainText\(page\.content\)/, 'search index uses markdown body text, not only frontmatter');
assert.match(wikiLib, /tags: string\[\]/, 'search index exposes page tags for downstream content consumers');
assert.match(wikiLib, /hidden\?: boolean/, 'wiki frontmatter supports hidden pages');
assert.match(wikiLib, /\.filter\(\(page\) => page\.data\.hidden !== true\)/, 'search index excludes hidden pages');
assert.match(wikiPageTsx, /isChineseSlug\(page\.slug\)/, 'wiki page detects Chinese article slugs');
assert.match(wikiPageTsx, /preprocessWikiLinks\(page\.content, \{ language \}\)/, 'wiki page passes language into wikilink preprocessing');
assert.match(wikiSearch, /'use client';/, 'wiki search is a client component');
assert.match(wikiSearch, /import \{ ChatWithXinbao \} from '@\/components\/ChatWithXinbao';/, 'wiki search imports Chat with Xinbao');
assert.match(wikiSearch, /showLanguageSelect\?: boolean;/, 'wiki search can expose an inline language selector');
assert.match(wikiSearch, /language\?: SearchLanguage;/, 'wiki search accepts an externally controlled language');
assert.match(wikiSearch, /onLanguageChange\?: \(language: SearchLanguage\) => void;/, 'wiki search can notify the portal when the selected language changes');
assert.match(wikiSearch, /const activeLanguage = showLanguageSelect \? \(language \?\? selectedLanguage\) : preferredLanguage;/, 'wiki search lets the portal language selector control result language');
assert.match(wikiSearch, /<ChatWithXinbao language=\{activeLanguage\} \/>[\s\S]*<form/, 'chat icon renders before the search form and follows the active language');
assert.match(wikiSearch, /className="wiki-search-language-select"/, 'wiki search renders the portal language selector');
assert.match(wikiSearch, /useMemo/, 'wiki search memoizes query scoring');
assert.match(wikiSearch, /scoreItem/, 'wiki search has a ranking function');
assert.match(wikiSearch, /usePathname/, 'wiki search can detect the current page language');
assert.match(wikiSearch, /preparedItems\.filter\(\(item\) => item\.language === activeLanguage\)/, 'wiki search only returns results from the active page or selected language');
assert.doesNotMatch(wikiSearch, /item\.language === preferredLanguage\) score \+=/, 'wiki search no longer mixes languages by language-score boosting');
assert.match(wikiSearch, /onKeyDown/, 'wiki search supports keyboard navigation');
assert.match(wikiSearch, /role="listbox"/, 'wiki search renders accessible result listbox');
assert.match(wikiSearch, /window\.location\.assign\(item\.href\)/, 'wiki search submit navigates to the selected result');
assert.match(articleTabs, /usePathname/, 'article tools derive the active page from the current route');
assert.match(articleTabs, /href="#"/, 'active Article tab uses the Colarpedia inert article link');
assert.match(articleTabs, /issues\/new\?title=/, 'Talk links directly to GitHub new issue creation');
assert.match(articleTabs, /Talk: \$\{slug\}/, 'Talk issue title is page-specific');
assert.match(articleTabs, /edit\/main\/wiki\/\$\{encodeURIComponent\(fileName\)\}/, 'View source edits the current markdown page');
assert.match(articleTabs, /commits\/main\/wiki\/\$\{encodeURIComponent\(fileName\)\}/, 'History opens the current markdown page commits');

assert.match(chatWithXinbao, /'use client';/, 'Chat with Xinbao is a client component');
assert.match(chatWithXinbao, /import ReactMarkdown from 'react-markdown';/, 'chat client renders assistant replies with ReactMarkdown');
assert.match(chatWithXinbao, /import rehypeKatex from 'rehype-katex';/, 'chat client imports KaTeX rendering for formulas');
assert.match(chatWithXinbao, /import remarkMath from 'remark-math';/, 'chat client imports math parsing for formulas');
assert.match(chatWithXinbao, /function ChatMessageContent/, 'chat client isolates message markdown rendering');
assert.match(chatWithXinbao, /message\.role === 'assistant'/, 'chat client renders assistant messages as markdown while keeping user messages plain');
assert.match(chatWithXinbao, /remarkPlugins=\{\[remarkGfm, remarkMath\]\}/, 'chat client enables GFM and math parsing for assistant replies');
assert.match(chatWithXinbao, /rehypePlugins=\{\[rehypeKatex\]\}/, 'chat client enables KaTeX output for assistant replies');
assert.match(chatWithXinbao, /Chat with Xinbao/, 'chat window uses the required title');
assert.match(chatWithXinbao, /MAX_INPUT_LENGTH = 1000/, 'chat client caps input length at 1000 characters');
assert.match(chatWithXinbao, /\/api\/chat-with-xinbao/, 'chat client calls only the same-site API route');
assert.match(chatWithXinbao, /method: 'GET'/, 'chat client refreshes quota from the backend when the chat opens');
assert.match(chatWithXinbao, /remaining.*limit/s, 'chat client displays remaining daily quota');
assert.match(chatWithXinbao, /quotaUnknown: '10 messages\/day'/, 'chat client English quota fallback uses the 10-message daily limit');
assert.match(chatWithXinbao, /quotaUnknown: '每天 10 条消息'/, 'chat client Chinese quota fallback uses the 10-message daily limit');
assert.match(chatWithXinbao, /useState\(10\)/, 'chat client initializes the quota display to 10');
assert.match(chatWithXinbao, /Questions may be logged to improve answers\./, 'chat client discloses English question logging');
assert.match(chatWithXinbao, /问题可能会被记录，用于改进回答。/, 'chat client discloses Chinese question logging');
assert.match(chatWithXinbao, /Xinbao AI is temporarily unavailable\. Please try again later\./, 'chat client uses a generic model-error message');
assert.match(chatWithXinbao, /language: Language/, 'chat client localizes UI from current wiki language');
assert.match(chatWithXinbao, /distilled/, 'chat client introduces itself as a distilled academic skill');
assert.match(chatWithXinbao, /来踩踩[\s\S]*蒸馏出来的数字分身 skill[\s\S]*资料稳[\s\S]*轻微有梗[\s\S]*讲清楚喵~/, 'chat client Chinese greeting is playful but restrained');
assert.match(chatWithXinbao, /Xinbao AI is on the way[\s\S]*Checking Xinbaopedia notes[\s\S]*Almost there/, 'chat client includes varied English typing messages');
assert.match(chatWithXinbao, /Xinbao AI 正在赶来的路上[\s\S]*家人们，答案正在路上[\s\S]*886 还早[\s\S]*来踩踩[\s\S]*正在切换到资料稳模式/, 'chat client includes varied Chinese typing messages');
assert.match(chatWithXinbao, /function randomTypingMessage[\s\S]*Math\.random\(\)[\s\S]*setTypingMessage\(randomTypingMessage\(strings\.typing\)\)/, 'chat client randomly selects one typing message per request');
assert.doesNotMatch(chatWithXinbao, /YUNWU_API_KEY|UPSTASH_REDIS_REST_TOKEN|api\.yunwu|Bearer/, 'chat client contains no backend key names or provider endpoint');
assert.match(chatRoute, /runtime = 'nodejs'/, 'chat API route uses the Node runtime');
assert.match(chatRoute, /export async function GET\(request: NextRequest\)/, 'chat API exposes a backend quota endpoint');
assert.match(chatRoute, /MODEL = 'deepseek-v4-flash'/, 'chat API fixes the requested Yunwu model');
assert.match(chatRoute, /DEFAULT_BASE_URL = 'https:\/\/api\.yunwu\.ai\/v1'/, 'chat API uses the documented Yunwu base URL');
assert.match(chatRoute, /YUNWU_API_KEY/, 'chat API reads the Yunwu key from server env');
assert.match(chatRoute, /YUNWU_API_BASE_URL/, 'chat API supports a server env base URL override');
assert.match(chatRoute, /UPSTASH_REDIS_REST_URL[\s\S]*UPSTASH_REDIS_REST_TOKEN/, 'chat API reads Upstash credentials from server env');
assert.match(chatRoute, /RATE_LIMIT_SALT/, 'chat API hashes visitor identifiers with a server salt');
assert.match(chatRoute, /DAILY_LIMIT = 10/, 'chat API enforces 10 messages per day');
assert.match(chatRoute, /hashIdentity\(`\$\{ip\}:\$\{userAgent\}`\)/, 'chat API keeps an IP plus user-agent daily key so refreshes cannot reset quota');
assert.match(chatRoute, /COOLDOWN_SECONDS = 4/, 'chat API enforces the per-visitor cooldown');
assert.match(chatRoute, /HOURLY_IP_LIMIT = 80/, 'chat API enforces the hourly IP cap');
assert.match(chatRoute, /MAX_INPUT_LENGTH = 1000/, 'chat API validates input length server-side');
assert.match(chatRoute, /MAX_HISTORY_MESSAGES = 6/, 'chat API sends at most six history messages');
assert.match(chatRoute, /MAX_OUTPUT_TOKENS = 450/, 'chat API caps model output tokens');
assert.match(chatRoute, /thinking: \{ type: 'disabled' \}/, 'chat API disables model thinking output so the 450-token cap is reserved for the final answer');
assert.match(chatRoute, /REQUEST_TIMEOUT_MS = 12_000/, 'chat API has a backend timeout');
assert.match(chatRoute, /QUESTION_LOG_MAX_RECENT = 2_000/, 'chat API caps the retained recent question log');
assert.match(chatRoute, /QUESTION_LOG_RETENTION_DAYS = 90/, 'chat API expires daily question logs after 90 days');
assert.match(chatRoute, /function recordQuestionLog[\s\S]*message: message\.slice\(0, QUESTION_LOG_MESSAGE_LENGTH\)/, 'chat API records accepted questions with a bounded message field');
assert.match(chatRoute, /redis\.lpush\(QUESTION_LOG_RECENT_KEY[\s\S]*redis\.ltrim\(QUESTION_LOG_RECENT_KEY[\s\S]*redis\.zincrby\(frequencyKey/, 'chat API writes recent, capped, and frequency question logs');
assert.match(chatRoute, /sanitizeRefererPath\(request\)/, 'chat API records only a sanitized page path for question logs');
assert.doesNotMatch(questionLogFunction, /history/, 'chat API question logging does not store chat history');
assert.match(chatRoute, /httpOnly: true/, 'visitor cookie is HTTP-only');
assert.match(chatRoute, /sameSite: 'lax'/, 'visitor cookie uses SameSite=Lax');
assert.match(chatRoute, /Asia\/Tokyo/, 'daily quota keys use Asia/Tokyo date boundaries');
assert.match(chatRoute, /Daily limit reached\. Please come back tomorrow\./, 'chat API returns the required daily-limit message');
assert.match(chatRoute, /Xinbao AI is temporarily unavailable\. Please try again later\./, 'chat API returns only the generic model-error message');
assert.match(chatRoute, /function withXinbaoSignature\(reply: string, language: 'en' \| 'zh'\)/, 'chat API post-processes successful replies with a stable localized signature');
assert.match(chatRoute, /language: 'en' \| 'zh'/, 'chat API chooses the signature language from the current wiki language');
assert.doesNotMatch(chatRoute, /\\n\\n\$?\{?signature/, 'chat API keeps the meow signature on the same line as the reply');
assert.match(chatRoute, /\.replace\(\/\[。！？\.!\?\]\+\$\/u/, 'chat API removes terminal punctuation before the meow signature');
assert.match(chatRoute, /language === 'zh' \? '喵~' : ' meow~'/, 'chat API keeps Chinese suffix attached and adds a space before the English suffix');
assert.match(chatRoute, /meow~/, 'chat API appends the English meow signature on English pages');
assert.match(chatRoute, /喵~/, 'chat API appends the Chinese meow signature on Chinese pages');
assert.match(chatRoute, /Authorization: `Bearer \$\{apiKey\}`/, 'chat API proxies authorization only on the server');
assert.doesNotMatch(chatRoute, /console\.error\([^)]*message|console\.log\([^)]*message|system prompt/i, 'chat API does not log user messages or prompt text');
assert.match(chatQuestionsRoute, /runtime = 'nodejs'/, 'question-log export route uses the Node runtime');
assert.match(chatQuestionsRoute, /XINBAO_CHAT_ADMIN_TOKEN/, 'question-log export route requires an admin token');
assert.match(chatQuestionsRoute, /timingSafeEqual/, 'question-log export route compares admin tokens safely');
assert.match(chatQuestionsRoute, /if \(value && typeof value === 'object'\) return value;/, 'question-log export route accepts Upstash object values as well as JSON strings');
assert.match(chatQuestionsRoute, /QUESTION_LOG_RECENT_KEY[\s\S]*lrange<string>/, 'question-log export route can read recent question logs');
assert.match(chatQuestionsRoute, /mode === 'frequency'[\s\S]*zrange<unknown\[]>/, 'question-log export route can read normalized question frequencies');
assert.match(chatQuestionsRoute, /MAX_EXPORT_LIMIT = 500/, 'question-log export route caps export size');
assert.doesNotMatch(chatQuestionsRoute, /console\.log|console\.error|YUNWU_API_KEY/, 'question-log export route does not log or reference unrelated model secrets');
assert.match(chatKnowledge, /import 'server-only';/, 'chat knowledge builder is server-only');
assert.match(chatKnowledge, /project\.md/, 'chat knowledge builder can prioritize project.md if it is added later');
assert.match(chatKnowledge, /wiki'\)/, 'chat knowledge builder reads the local wiki directory');
assert.match(chatKnowledge, /Xinbao_Qiao[\s\S]*Qiao_Xinbao_zh[\s\S]*Projects[\s\S]*Research[\s\S]*Publications[\s\S]*CV[\s\S]*Internet_Slang_2026/, 'chat knowledge builder prioritizes homepage, projects, research, publications, CV, and yearly slang pages');
assert.doesNotMatch(chatKnowledge, /Learn_What_Matters_Data_Pruning_for_Efficient_Decentralized_Learning/, 'chat knowledge builder does not prioritize the hidden under-review manuscript');
assert.match(chatKnowledge, /digital proxy/, 'persona identifies the assistant as a digital proxy');
assert.match(chatKnowledge, /academic skill[\s\S]*distilled/, 'persona can introduce the assistant as a distilled academic skill');
assert.match(chatKnowledge, /Accepted user questions may be logged server-side/, 'persona transparently explains question logging when asked');
assert.match(chatKnowledge, /chat history, raw IPs, system prompts, and API keys are not stored/, 'persona documents what question logging must not claim to store');
assert.match(chatKnowledge, /顷刻炼化[\s\S]*数字分身 skill[\s\S]*恐怖如斯/, 'persona can introduce itself with the requested playful Chinese phrasing');
assert.match(chatKnowledge, /家人们[\s\S]*跟他爆了[\s\S]*直接拿捏[\s\S]*包的[\s\S]*先别急[\s\S]*不硬编/s, 'persona supports a small Chinese meme-style expression pool without encouraging unsupported claims');
assert.match(chatKnowledge, /Modern meme-guide voice[\s\S]*情绪价值[\s\S]*City不City[\s\S]*YYDS[\s\S]*我去不早说[\s\S]*不讲不讲[\s\S]*尊嘟假嘟[\s\S]*退一万步讲/, 'persona supports current meme-guide catchphrases');
assert.match(chatKnowledge, /2026 sentence-template and abstract voice[\s\S]*我将辞职在家研究[\s\S]*此人的 X 恐怕在我之上[\s\S]*有点抽象[\s\S]*source-grounded answer within one sentence/, 'persona supports bounded 2026 sentence-template and abstract voice');
assert.match(chatKnowledge, /Reusable casual sentence templates[\s\S]*家人们谁懂啊[\s\S]*主打一个 X[\s\S]*含金量还在上升/, 'persona supports reusable meme sentence templates');
assert.match(chatKnowledge, /00s retro Chinese web voice[\s\S]*886[\s\S]*踩踩[\s\S]*QQ空间 energy/, 'persona supports light 00s retro web catchphrases');
assert.doesNotMatch(chatKnowledge, /\u8dd1\u5802/, 'persona removes the disallowed catchphrase');
assert.match(chatKnowledge, /must not claim to be the real Xinbao Qiao/, 'persona prevents impersonating Xinbao');
assert.match(chatKnowledge, /Do not browse, invent, infer private facts/, 'persona constrains answers to local wiki sources');
assert.match(chatKnowledge, /XINBAO_CHAT_VOICE_STYLE/, 'chat knowledge builder supports a server-only private voice style layer');
assert.match(chatKnowledge, /private voice notes/, 'persona prevents revealing private voice notes');
assert.match(chatReadme, /Vercel deployment/, 'chat documentation explains Vercel deployment');
assert.match(chatReadme, /rg "YUNWU_API_KEY\|sk-\|Bearer\|api\.yunwu\|UPSTASH_REDIS_REST_TOKEN"/, 'chat documentation includes the key leak check command');
assert.match(chatReadme, /11th daily request[\s\S]*429/, 'chat documentation explains testing the 10-message limit');
for (const envName of ['YUNWU_API_KEY', 'YUNWU_API_BASE_URL', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'RATE_LIMIT_SALT', 'XINBAO_CHAT_VOICE_STYLE', 'XINBAO_CHAT_ADMIN_TOKEN']) {
  assert.match(chatEnvExample, new RegExp(`^${envName}=`, 'm'), `env.example includes ${envName}`);
}
assert.match(chatPersona, /You are Chat with Xinbao/, 'persona prompt template documents assistant identity');
assert.match(chatPersona, /XINBAO_CHAT_VOICE_STYLE/, 'persona prompt template documents the private voice style layer');
assert.match(chatPersona, /Accepted user questions may be logged server-side/, 'persona prompt template documents question logging transparency');
assert.match(chatPersona, /do not repeat one fixed meme[\s\S]*家人们[\s\S]*跟他爆了[\s\S]*顷刻炼化[\s\S]*轻微有梗[\s\S]*never use memes to cover missing evidence/, 'persona prompt template documents varied meme-style wording with factual boundaries');
assert.match(chatPersona, /Modern meme-guide voice[\s\S]*情绪价值[\s\S]*City不City[\s\S]*YYDS[\s\S]*爱你老己[\s\S]*做完你的做你的/, 'persona prompt template documents current meme-guide wording');
assert.match(chatPersona, /2026 sentence-template and abstract voice[\s\S]*我将辞职在家研究[\s\S]*听君一席话如听一席话[\s\S]*不按套路但按 source notes/, 'persona prompt template documents 2026 sentence-template and abstract wording');
assert.match(chatPersona, /Reusable casual sentence templates[\s\S]*退一万步讲[\s\S]*尊嘟假嘟[\s\S]*source-grounded content only/, 'persona prompt template documents meme sentence-template boundaries');
assert.match(chatPersona, /00s retro Chinese web voice[\s\S]*886[\s\S]*踩踩[\s\S]*留言板 energy/, 'persona prompt template documents the 00s retro phrase pool');
assert.match(chatMemeNotes, /46 notes\.hdoc[\s\S]*private reference material[\s\S]*should not quote it or commit it/, 'meme voice notes document private hdoc handling');
assert.match(chatMemeNotes, /Modern meme-guide references[\s\S]*情绪价值[\s\S]*班味儿[\s\S]*绝绝子[\s\S]*不讲不讲[\s\S]*命运的齿轮开始转动[\s\S]*退一万步讲/, 'meme voice notes organize current meme-guide categories');
assert.match(chatMemeNotes, /2026 sentence-template references[\s\S]*我将辞职在家研究[\s\S]*此人的 X 恐怕在我之上[\s\S]*从从容容、游刃有余[\s\S]*随橙想/, 'meme voice notes organize 2026 sentence-template categories');
assert.match(chatMemeNotes, /2026 social and AI-era references[\s\S]*抽象力[\s\S]*AI人格[\s\S]*AI搭子[\s\S]*SBTI[\s\S]*武BOT/, 'meme voice notes organize 2026 social and AI-era categories');
assert.match(chatMemeNotes, /Abstract literature[\s\S]*有点抽象[\s\S]*离谱但合理[\s\S]*精神状态领先版本/, 'meme voice notes organize abstract-literature categories');
assert.match(chatMemeNotes, /Sentence templates[\s\S]*家人们谁懂啊[\s\S]*直接拿捏[\s\S]*爱了爱了[\s\S]*这波属于反向严谨/, 'meme voice notes include reusable meme sentence templates');
assert.match(chatMemeNotes, /Web references[\s\S]*news\.cn[\s\S]*nlp\.ccnu\.edu\.cn[\s\S]*lingoace[\s\S]*wukongsch[\s\S]*qian-gua[\s\S]*rednotememe[\s\S]*stellarchinese[\s\S]*jiuzhe[\s\S]*ithome[\s\S]*chinawriter[\s\S]*digitaling[\s\S]*php\.cn/, 'meme voice notes record web sources for meme-guide knowledge');
assert.match(chatMemeNotes, /00s retro web nostalgia[\s\S]*886[\s\S]*踩踩[\s\S]*火钳刘明/, 'meme voice notes organize retro catchphrase categories');
assert.doesNotMatch(`${chatWithXinbao}\n${chatPersona}\n${chatMemeNotes}`, /\u8dd1\u5802/, 'chat voice knowledge removes the disallowed catchphrase everywhere public');
assert.match(internetSlang2026, /Internet Slang 2026[\s\S]*controlled phrase bank[\s\S]*Sentence and abstract-expression memes[\s\S]*AI as companion/, 'English 2026 slang page documents controlled use categories');
assert.match(internetSlang2026, /LingoAce[\s\S]*WuKong Education[\s\S]*QianGua Data[\s\S]*RedNoteMeme[\s\S]*Stellar Chinese/, 'English 2026 slang page cites current public slang sources');
assert.match(internetSlang2026Zh, /2026热梗[\s\S]*先准确，再有趣[\s\S]*句式梗与抽象表达[\s\S]*AI人格[\s\S]*之前已经从聊天语气中移除的旧词继续保持不用/, 'Chinese 2026 slang page documents current slang categories and omitted older phrasing');
assert.match(internetSlang2026Zh, /LingoAce[\s\S]*悟空教育[\s\S]*千瓜数据[\s\S]*RedNoteMeme[\s\S]*Stellar Chinese/, 'Chinese 2026 slang page cites current public slang sources');
assert.doesNotMatch(chatEnvExample, /sk-[A-Za-z0-9_-]{12,}/, 'env.example contains no real-looking API key');
assert.ok(!('cf:deploy' in (packageJson.scripts || {})), 'package scripts do not include the retired Cloudflare Worker deployment');
assert.ok(!('cf:dev' in (packageJson.scripts || {})), 'package scripts do not include the retired Cloudflare Worker dev server');
const retiredProxyPattern = new RegExp(
  [
    ['xinbaopedia', 'vercel', 'app'].join('\\.'),
    ['workers', 'dev'].join('\\.'),
    'wrangler',
    'Cloudflare Worker'
  ].join('|'),
  'i'
);
assert.doesNotMatch(
  `${JSON.stringify(packageJson)}\n${fs.readFileSync(path.join(root, 'README.md'), 'utf8')}`,
  retiredProxyPattern,
  'public project metadata describes the Vercel-only production path'
);

const sidebar = fs.readFileSync(path.join(root, 'components/Sidebar.tsx'), 'utf8');
assert.doesNotMatch(sidebar, /Notable works/, 'sidebar no longer uses Notable works');
assert.match(sidebar, /<aside className="wiki-sidebar" aria-label="Navigation">/, 'sidebar matches Colarpedia aside structure and aria label');
assert.doesNotMatch(sidebar, /function NavSection|className="nav-section"|<section className="nav-section">/, 'sidebar uses flat Colarpedia h4 plus ul blocks');
assert.match(sidebar, /const navigation = \['Xinbao_Qiao', 'Publications'\]/, 'sidebar navigation includes the main page and Publications');
assert.match(sidebar, /'Xinbao_Qiao': 'Main page'/, 'sidebar keeps the homepage label compact');
assert.match(sidebar, /<h4>Navigation<\/h4>[\s\S]*<h4>Research topics<\/h4>[\s\S]*<h4>Education<\/h4>[\s\S]*<h4>Experience<\/h4>[\s\S]*<h4>Contribute<\/h4>/, 'sidebar places Experience after Education');
assert.doesNotMatch(sidebar, /Source repository/, 'sidebar contribute links avoid the source repository label');
assert.doesNotMatch(sidebar, /OpenReview profile/, 'sidebar contribute avoids non-Colarpedia sidebar labels');
assert.match(sidebar, /LinkedIn[\s\S]*Email the author/, 'sidebar contribute mirrors Colarpedia with LinkedIn before email');
assert.doesNotMatch(sidebar, /className="external" href="mailto:/, 'email link is not styled as an external link');
for (const shortLabel of ['CUHK', 'NUSRI-CQ', 'ZJU', 'SDU']) {
  assert.match(sidebar, new RegExp(`'[^']+': '${shortLabel}'`), `sidebar uses short label ${shortLabel}`);
}
assert.match(sidebar, /'AI_and_Networks': 'AI and Networks'/, 'sidebar labels AI and Networks as a short topic');
assert.match(sidebar, /'Synthetic_Data_and_Model_Collapse': 'Synthetic Data'/, 'sidebar shortens synthetic-data topic');
assert.match(sidebar, /'Data_Centric_Machine_Learning': 'Data Centric ML'/, 'sidebar shortens data-centric topic');
assert.match(sidebar, /const education = \['The_Chinese_University_of_Hong_Kong', 'Zhejiang_University', 'Shandong_University'\]/, 'sidebar education is reverse chronological');
assert.match(sidebar, /const experience = \['NUSRI_CQ'\]/, 'sidebar experience keeps only NUSRI-CQ');
assert.doesNotMatch(sidebar, /Synthetic Data and Model Collapse/, 'sidebar avoids long research-topic labels');
assert.doesNotMatch(sidebar, /Data Centric Machine Learning/, 'sidebar avoids long research-topic labels');

const publications = read('Publications.md');
assert.doesNotMatch(publications, /raw\.githubusercontent\.com/, 'publication index avoids backup-branch image URLs');
assert.doesNotMatch(publications, /!\[/, 'publication index is text-only');
assert.doesNotMatch(publications, /Soft-Weighted Machine Unlearning/, 'publication index uses the final AAAI title');
assert.match(publications, /DynFrs: An Efficient Framework for Machine Unlearning in Random Forest/, 'publication index uses full DynFrs title');
assert.doesNotMatch(publications, /(?<!\*)Xinbao Qiao(?!\*)/, 'publication index bolds Xinbao Qiao in author lists');
assert.equal((publications.match(/\*\*Xinbao Qiao\*\*/g) || []).length, 4, 'publication index bolds Xinbao Qiao in every visible listed paper');

for (const page of [
  'Xinbao_Qiao.md',
  'Qiao_Xinbao_zh.md',
  'Hessian_Free_Online_Certified_Unlearning.md',
  'Soft_Weighted_Machine_Unlearning.md',
  'DynFrs.md',
  'When_Sample_Selection_Bias_Precipitates_Model_Collapse.md',
  'Learn_What_Matters_Data_Pruning_for_Efficient_Decentralized_Learning.md'
]) {
  assert.doesNotMatch(read(page), /^## References$/m, `${page} removes unused References section`);
  assert.doesNotMatch(read(page), /^## 参考资料$/m, `${page} removes unused Chinese references section`);
}

function footnoteRefs(body) {
  return body
    .split('\n')
    .filter((line) => !line.startsWith('[^'))
    .flatMap((line) => [...line.matchAll(/\[\^([^\]]+)\]/g)].map((match) => match[1]));
}

function footnoteDefs(body) {
  return [...body.matchAll(/^\[\^([^\]]+)\]:/gm)].map((match) => match[1]);
}

assert.deepEqual(footnoteDefs(home).sort(), ['cuhk-ie', 'qiao-ciao', 'xinbao-name', 'xinbao-qiao-bridge'].sort(), 'English biography keeps only essential footnotes');
assert.deepEqual(footnoteDefs(zhHome).sort(), ['cuhk-ie-zh', 'qiao-ciao-zh', 'xinbao-name-zh', 'xinbao-qiao-bridge-zh'].sort(), 'Chinese biography keeps only essential footnotes');
assert.deepEqual(footnoteRefs(home).slice(0, 3), ['xinbao-name', 'qiao-ciao', 'xinbao-qiao-bridge'], 'English biography orders visible name footnotes as Xinbao, Ciao, bridge');
assert.deepEqual(footnoteRefs(zhHome).slice(0, 3), ['xinbao-name-zh', 'qiao-ciao-zh', 'xinbao-qiao-bridge-zh'], 'Chinese biography orders visible name footnotes as Xinbao, Ciao, bridge');
assert.match(home, /\*\*Xinbao Qiao\*\*\[\^xinbao-name\]\[\^qiao-ciao\]\[\^xinbao-qiao-bridge\]/, 'English biography attaches the reordered name footnotes to the romanized name');
assert.match(home, /"喬"[\s\S]*sound of "ciao"[\s\S]*"Mr\. Ciao"[\s\S]*huggingface\.co\/MrCiao/, 'English biography explains the Mr. Ciao nickname');
assert.match(zhHome, /英文发表名：\*\*Xinbao Qiao\*\*\[\^xinbao-name-zh\]\[\^qiao-ciao-zh\]\[\^xinbao-qiao-bridge-zh\]/, 'Chinese biography attaches the reordered name footnotes to the romanized name');
assert.match(zhHome, /“喬”与“ciao”发音一致[\s\S]*“Mr\. Ciao”[\s\S]*huggingface\.co\/MrCiao/, 'Chinese biography explains the Mr. Ciao nickname');
assert.match(home, /Xinbao Qiao[\s\S]*新寶橋[\s\S]*pwbgis\.kcg\.gov\.tw[\s\S]*mapcarta\.com\/25634858/, 'English bridge-name footnote cites Taiwan bridge sources');
assert.match(zhHome, /Xinbao Qiao[\s\S]*新寶橋[\s\S]*pwbgis\.kcg\.gov\.tw[\s\S]*mapcarta\.com\/25634858/, 'Chinese bridge-name footnote cites Taiwan bridge sources');
for (const removedNote of ['timeline-note', 'research-scope', 'zju-program', 'sdu-background', 'ai-networks-note']) {
  assert.doesNotMatch(home, new RegExp(`\\[\\^${removedNote}\\]`), `English biography removes ${removedNote}`);
}
for (const removedNote of ['timeline-note-zh', 'research-scope-zh', 'zju-program-zh', 'sdu-background-zh', 'ai-networks-note-zh']) {
  assert.doesNotMatch(zhHome, new RegExp(`\\[\\^${removedNote}\\]`), `Chinese biography removes ${removedNote}`);
}

const acceptedPublicationPages = [
  'When_Sample_Selection_Bias_Precipitates_Model_Collapse.md',
  'Soft_Weighted_Machine_Unlearning.md',
  'Hessian_Free_Online_Certified_Unlearning.md',
  'DynFrs.md'
];

for (const page of acceptedPublicationPages) {
  const fm = frontmatter(page);
  const body = read(page);
  assert.match(body, /\*\*\[\[Xinbao_Qiao\|Xinbao Qiao\]\]\*\*/, `${page} bolds Xinbao Qiao in the article author line`);
  assert.doesNotMatch(fm, /^categories:/m, `${page} publication infobox omits categories`);
  assert.match(fm, /^location:/m, `${page} publication infobox includes conference location`);
  assert.doesNotMatch(fm, /owner-provided|author notification|published on OpenReview|presentation listed|arXiv submitted/i, `${page} publication status row stays concise`);
  for (const section of ['## Overview', '## Method', '## Key formula', '## Results', '## Placement']) {
    assert.match(body, new RegExp(`^${section}$`, 'm'), `${page} has ${section}`);
  }
  assert.doesNotMatch(body, /```text\n[\s\S]*?```/, `${page} uses rendered math instead of text code formulas`);
  assert.doesNotMatch(body, /\\\(|\\\)/, `${page} uses dollar-delimited inline math compatible with remark-math`);
  assert.match(body, /\$\$[\s\S]*?\$\$/, `${page} includes display math syntax`);
}

assert.match(read('Learn_What_Matters_Data_Pruning_for_Efficient_Decentralized_Learning.md'), /\*\*Xinbao Qiao\*\*/, 'under-review publication page bolds Xinbao Qiao in the author context');

const mengZhang = read('Meng_Zhang.md');
const angelaZhang = read('Angela_Yingjun_Zhang.md');
assert.match(mengZhang, /https:\/\/person\.zju\.edu\.cn\/mengzhang/, 'Meng Zhang page cites the official ZJU profile');
assert.match(mengZhang, /ZJU-UIUC Institute/, 'Meng Zhang page identifies the ZJU-UIUC Institute affiliation');
assert.match(mengZhang, /wireless and computer networks[\s\S]*edge intelligence[\s\S]*network economics[\s\S]*intelligent IoT/i, 'Meng Zhang page summarizes official research areas');
assert.match(mengZhang, /\[\[Xinbao_Qiao\|Xinbao Qiao\]\]/, 'Meng Zhang page connects to Qiao');
assert.match(angelaZhang, /https:\/\/staff\.ie\.cuhk\.edu\.hk\/~yjzhang\//, 'Angela Yingjun Zhang page cites the official CUHK profile');
assert.match(angelaZhang, /Professor[\s\S]*Department of Information Engineering[\s\S]*The Chinese University of Hong Kong/, 'Angela Yingjun Zhang page identifies CUHK IE affiliation');
assert.match(angelaZhang, /IEEE Fellow/, 'Angela Yingjun Zhang page records IEEE Fellow status');
assert.match(angelaZhang, /5G and 6G/, 'Angela Yingjun Zhang page summarizes official research interests');
assert.match(angelaZhang, /\[\[Xinbao_Qiao\|Xinbao Qiao\]\]/, 'Angela Yingjun Zhang page connects to Qiao');

const learnPageFm = frontmatter('Learn_What_Matters_Data_Pruning_for_Efficient_Decentralized_Learning.md');
assert.doesNotMatch(learnPageFm, /^categories:/m, 'under-review manuscript infobox omits categories');
assert.equal(frontmatterData('Learn_What_Matters_Data_Pruning_for_Efficient_Decentralized_Learning.md').hidden, true, 'under-review manuscript is hidden from public indexes for now');
assert.equal(frontmatterData('Learn_What_Matters_Data_Pruning_for_Efficient_Decentralized_Learning_zh.md').hidden, true, 'Chinese under-review manuscript is hidden from public indexes for now');

const hiddenManuscriptPattern = /Learn_What_Matters_Data_Pruning_for_Efficient_Decentralized_Learning|Learn What Matters/;
const publicMarkdownFiles = fs.readdirSync(wikiDir)
  .filter((file) => file.endsWith('.md'))
  .filter((file) => !file.startsWith('Learn_What_Matters_Data_Pruning_for_Efficient_Decentralized_Learning'));
for (const page of publicMarkdownFiles) {
  assert.doesNotMatch(read(page), hiddenManuscriptPattern, `${page} does not surface the hidden under-review manuscript`);
}
assert.doesNotMatch(fs.readFileSync(path.join(wikiDir, 'pages.json'), 'utf8'), hiddenManuscriptPattern, 'manual page index does not surface the hidden under-review manuscript');

assert.match(read('When_Sample_Selection_Bias_Precipitates_Model_Collapse.md'), /!\[[^\]]+\]\(\/papers\/model-collapse\/fid-trends-combined\.png\)/, 'model-collapse paper page displays a figure');
assert.match(read('When_Sample_Selection_Bias_Precipitates_Model_Collapse.md'), /!\[[^\]]+\]\(\/papers\/model-collapse\/teaser\.png\)/, 'model-collapse paper page displays a local teaser figure');
assert.match(read('Hessian_Free_Online_Certified_Unlearning.md'), /!\[[^\]]+\]\(\/papers\/hessian-free\/ours\.png\)/, 'Hessian-free paper page displays a figure');
assert.match(read('Soft_Weighted_Machine_Unlearning.md'), /!\[[^\]]+\]\(\/papers\/soft-weighted\/sec-5-1-1\.png\)/, 'soft-weighted paper page displays a figure');
assert.match(read('DynFrs.md'), /!\[[^\]]+\]\(\/papers\/dynfrs\/lazy-tags\.png\)/, 'DynFrs paper page displays a figure');
assert.match(read('Hessian_Free_Online_Certified_Unlearning.md'), /!\[[^\]]+\]\(\/papers\/hessian-free\/poster\.png\)/, 'Hessian-free paper page includes poster image');
assert.match(read('DynFrs.md'), /!\[[^\]]+\]\(\/papers\/dynfrs\/poster\.png\)/, 'DynFrs paper page includes poster image');
assert.match(read('Soft_Weighted_Machine_Unlearning.md'), /!\[[^\]]+\]\(\/papers\/soft-weighted\/framework\.png\)/, 'soft-weighted paper page includes framework image');

const infobox = fs.readFileSync(path.join(root, 'components/Infobox.tsx'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'app/globals.css'), 'utf8');
const homePage = fs.readFileSync(path.join(root, 'app/page.tsx'), 'utf8');
const homepagePortal = fs.readFileSync(path.join(root, 'components/HomepagePortal.tsx'), 'utf8');
assert.doesNotMatch(styles, /\.wiki-logo-mark/, 'topbar CSS does not keep custom logo-image styling');
assert.match(styles, /\.wiki-body p:has\(> img:only-child\) \{[\s\S]*display: flow-root;[\s\S]*text-align: center;[\s\S]*\}/, 'article image paragraphs avoid floated infobox overlap without adding a large clear gap');
assert.doesNotMatch(styles, /\.wiki-body p:has\(> img:only-child\) \{[\s\S]*clear: both;[\s\S]*\}/, 'article image paragraphs do not force images below floated infoboxes');
assert.match(styles, /\.wiki-body img \{[\s\S]*max-width: min\(100%, 520px\);[\s\S]*max-height: 380px;[\s\S]*object-fit: contain;[\s\S]*\}/, 'article images use a medium paper-figure size');
assert.match(styles, /\.wiki-body img\[src\$="poster\.png"\] \{[\s\S]*max-width: min\(100%, 720px\);[\s\S]*max-height: 640px;[\s\S]*\}/, 'poster images use a larger article display size');
assert.match(styles, /\.wiki-body img\[src\$="\.svg"\] \{[\s\S]*max-height: 440px;[\s\S]*\}/, 'SVG article diagrams keep a readable height');
assert.match(styles, /\.wiki-body \.katex-display \{[\s\S]*overflow-x: auto;[\s\S]*\}/, 'display formulas can scroll horizontally on narrow screens');
assert.match(styles, /\.wiki-search-panel \{[\s\S]*position: absolute;[\s\S]*max-height: min\(420px, 70vh\);[\s\S]*\}/, 'search results render in a bounded dropdown panel');
assert.match(styles, /\.wiki-search-result \{[\s\S]*display: grid;[\s\S]*grid-template-columns: 1fr auto;[\s\S]*\}/, 'search result rows use a compact two-column layout');
assert.match(styles, /\.wiki-search-result:hover,[\s\S]*\.wiki-search-result\[aria-selected="true"\] \{[\s\S]*background: #eaecf0;[\s\S]*\}/, 'search result hover and keyboard active states are visible');
assert.match(styles, /\.chat-xinbao-message \.katex-display \{[\s\S]*overflow-x: auto;[\s\S]*\}/, 'chat markdown formulas can scroll inside message bubbles');
assert.match(styles, /\.wiki-logo \{[\s\S]*display: inline-grid;[\s\S]*min-width: 148px;[\s\S]*text-decoration: none;[\s\S]*\}/, 'topbar logo CSS uses a compact Wikipedia-style wordmark container');
assert.match(styles, /\.wiki-logo:hover \{[\s\S]*text-decoration: none;[\s\S]*\}/, 'topbar logo hover does not underline the two-line wordmark');
assert.match(styles, /\.wiki-logo-word \{[\s\S]*font-family: var\(--font-serif\);[\s\S]*font-size: 23px;[\s\S]*\}/, 'topbar wordmark uses the wiki serif face');
assert.match(styles, /\.wiki-logo-subtitle \{[\s\S]*font-family: var\(--font-sans\);[\s\S]*text-transform: uppercase;[\s\S]*\}/, 'topbar subtitle uses a small uppercase sans style');
assert.match(styles, /body:has\(\.wiki-portal\) \.wiki-footer,[\s\S]*body:has\(\.wiki-portal\) \.wiki-topbar \{[\s\S]*display: none;[\s\S]*\}/, 'homepage hides the global topbar and footer chrome');
assert.match(styles, /\.wiki-portal-hero \{[\s\S]*max-width: 760px;[\s\S]*text-align: center;[\s\S]*\}/, 'homepage has a centered compact Wikipedia-style portal hero');
assert.match(styles, /--font-signature: "Alex Brush"/, 'homepage signature typography uses Alex Brush');
assert.match(styles, /\.wiki-portal-name \{[\s\S]*font-family: var\(--font-signature\);[\s\S]*font-size: 86px;[\s\S]*\}/, 'homepage starts directly with Xinbao Qiao in the Alex Brush signature face');
assert.doesNotMatch(styles, /\.wiki-portal-emblem/, 'homepage no longer styles an in-page portal icon');
assert.match(styles, /\.wiki-search-portal input \{[\s\S]*height: 44px;[\s\S]*font-size: 16px;[\s\S]*\}/, 'homepage search input is larger than the topbar search');
assert.match(styles, /\.wiki-search-portal \.wiki-search-language-select \{[\s\S]*width: 112px;[\s\S]*height: 44px;[\s\S]*\}/, 'homepage search includes a language selector');
assert.match(styles, /\.wiki-search-portal \.chat-xinbao-trigger \{[\s\S]*width: 44px;[\s\S]*height: 44px;[\s\S]*\}/, 'homepage search keeps the Chat with Xinbao trigger visible');
assert.match(styles, /\.chat-xinbao-shell \{[\s\S]*border-radius: 8px;[\s\S]*box-shadow: 0 18px 48px[\s\S]*\}/, 'Chat with Xinbao opens as a polished rounded floating panel');
assert.match(styles, /\.chat-xinbao-message \{[\s\S]*border-radius: 8px;[\s\S]*\}/, 'Chat with Xinbao message bubbles have a cleaner shape');
assert.match(styles, /\.chat-xinbao-composer button \{[\s\S]*background: #36c;[\s\S]*color: #ffffff;[\s\S]*\}/, 'Chat with Xinbao send button uses the wiki accent as a clear action');
assert.match(styles, /\.wiki-portal-editions \{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);[\s\S]*\}/, 'homepage moves profile language entries below the search');
assert.match(styles, /\.wiki-portal-directory summary \{[\s\S]*display: flex;[\s\S]*cursor: pointer;[\s\S]*\}/, 'homepage browse directory is collapsible');
assert.doesNotMatch(styles, /\.wiki-portal-directory summary::before|\.wiki-portal-directory summary::after/, 'homepage browse heading avoids decorative horizontal rules');
assert.match(styles, /\.wiki-portal-group-label \{[\s\S]*font-size: 11px;[\s\S]*text-transform: uppercase;[\s\S]*\}/, 'homepage browse links are grouped with compact taxonomy labels');
assert.match(styles, /\.wiki-portal-grid \{[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);[\s\S]*\}/, 'homepage browse directory uses a three-column desktop layout');
assert.match(styles, /\.wiki-shell:has\(\.wiki-portal\) \.wiki-sidebar \{[\s\S]*display: none;[\s\S]*\}/, 'homepage hides the article sidebar');
assert.match(homePage, /import \{ HomepagePortal \} from '@\/components\/HomepagePortal';/, 'homepage delegates interactive portal state to a client component');
assert.doesNotMatch(homePage, /wiki-portal-emblem|\/xinbaopedia-icon\.png/, 'homepage no longer renders the in-page icon');
assert.match(homepagePortal, /className="wiki-portal-name"[\s\S]*Xinbao Qiao/, 'homepage uses Xinbao Qiao as the central portal name');
assert.match(homePage, /Academic biography and research overview[\s\S]*个人学术条目与研究概览/, 'homepage keeps primary English and Chinese profile links below the search');
assert.match(homepagePortal, /<WikiSearch[\s\S]*language=\{language\}[\s\S]*onLanguageChange=\{setLanguage\}[\s\S]*showLanguageSelect[\s\S]*variant="portal"/, 'homepage search controls the portal language state');
assert.match(homepagePortal, /const browseLabels[\s\S]*en: 'Browse Xinbaopedia'[\s\S]*zh: '浏览 Xinbaopedia'/, 'homepage Browse heading has English and Chinese labels');
assert.match(homepagePortal, /<details className="wiki-portal-directory" open>[\s\S]*browseLabels\[language\]/, 'homepage browse directory is open by default and follows the active language');
assert.match(homePage, /Core research[\s\S]*Methods and geometry[\s\S]*Reliability and trust/, 'homepage research topics are organized into a readable taxonomy');
assert.match(homePage, /核心研究[\s\S]*方法与几何[\s\S]*可靠性与可信/, 'homepage research taxonomy has Chinese labels');
assert.match(homePage, /Indexes[\s\S]*Selected publications[\s\S]*Project pages/, 'homepage publication and project links are organized into a readable taxonomy');
assert.match(homePage, /索引[\s\S]*代表论文[\s\S]*项目页面/, 'homepage publication and project taxonomy has Chinese labels');
assert.match(homePage, /Profile[\s\S]*Institutions[\s\S]*Academic network/, 'homepage affiliation links are organized into a readable taxonomy');
assert.match(homePage, /个人资料[\s\S]*机构[\s\S]*学术网络/, 'homepage affiliation taxonomy has Chinese labels');
assert.match(homepagePortal, /section\.title\[language\][\s\S]*group\.label\[language\][\s\S]*group\.links\[language\]/, 'homepage Browse category labels and links switch with the selected language');
assert.doesNotMatch(homePage, /AI for Networks · Data-centric Machine Learning · Federated Learning|English entries|Chinese entries|Featured entry|wiki-portal-featured|\/images\/Portrait\.png|The academic wiki of Xinbao Qiao|showChat=\{false\}/, 'homepage removes the research-field line, entry count, featured block, portrait, old tagline, and chat suppression');
const sidebarLinkStyle = styles.match(/\.wiki-sidebar a \{([\s\S]*?)\}/);
assert.ok(sidebarLinkStyle, 'sidebar link style block exists');
assert.doesNotMatch(sidebarLinkStyle[1], /white-space: nowrap;/, 'sidebar link CSS avoids custom nowrap styling');
assert.match(infobox, /location: 'Conference location'/, 'infobox labels conference location');
assert.match(infobox, /department: 'Department'/, 'infobox supports institution department rows');
assert.match(infobox, /dates: 'Dates'/, 'infobox supports institution date rows');
assert.match(infobox, /place: 'Location'/, 'infobox supports institution location rows');
assert.match(infobox, /function sameInfoboxText/, 'infobox can compare visible row values');
assert.match(infobox, /key !== 'type' \|\| !sameInfoboxText\(data\.type, data\.occupation\)/, 'infobox suppresses Type when it duplicates Occupation');
assert.doesNotMatch(infobox, /categories: 'Categories'/, 'infobox does not label categories');
assert.doesNotMatch(infobox, /'categories'/, 'infobox does not render categories rows');
assert.doesNotMatch(infobox, /<ul className="infobox-list">/, 'infobox avoids nested list indentation in standard rows');
assert.match(infobox, /className="infobox-lines"/, 'infobox renders multiline values as aligned line groups');
assert.match(infobox, /className="infobox-line"/, 'infobox renders each row value line without list indentation');
assert.doesNotMatch(styles, /\.infobox-list/, 'infobox CSS no longer keeps list-style row formatting');
assert.match(styles, /\.infobox-lines \{[\s\S]*display: block;[\s\S]*\}/, 'infobox line groups align with ordinary scalar rows');

for (const page of [
  'The_Chinese_University_of_Hong_Kong.md',
  'Zhejiang_University.md',
  'Shandong_University.md',
  'NUSRI_CQ.md'
]) {
  const fm = frontmatter(page);
  const body = read(page);
  assert.match(fm, /^image:/m, `${page} institution page has an infobox image`);
  assert.match(fm, /^place:/m, `${page} uses institution place rather than conference location`);
  assert.doesNotMatch(fm, /^location:/m, `${page} does not reuse conference location field`);
  for (const section of ['## Program', '## Academic context', '## Connection to Qiao', '## See also']) {
    assert.match(body, new RegExp(`^${section}$`, 'm'), `${page} follows the Colarpedia-style institution structure`);
  }
  assert.ok(footnoteRefs(body).length <= 3, `${page} uses footnotes sparingly`);
  for (const note of footnoteDefs(body)) {
    const match = body.match(new RegExp(`^\\[\\^${note}\\]: ([\\s\\S]*?)(?=\\n\\[\\^|$)`, 'm'));
    assert.ok(match?.[1].includes('http'), `${page} footnote ${note} cites a source URL`);
  }
  assert.ok(body.split(/\s+/).length >= 180, `${page} is not a placeholder institution page`);
}

assert.match(read('The_Chinese_University_of_Hong_Kong.md'), /\[\[Angela_Yingjun_Zhang\|Angela Yingjun Zhang\]\]/, 'CUHK page links to the PhD advisor page');
assert.match(read('Zhejiang_University.md'), /\[\[Meng_Zhang\|Meng Zhang\]\]/, 'ZJU page links to the master advisor page');

for (const page of [
  'AI_and_Networks.md',
  'Machine_Unlearning.md',
  'Data_Centric_Machine_Learning.md',
  'Synthetic_Data_and_Model_Collapse.md',
  'Certified_Data_Removal.md',
  'Collaborative_Evaluation.md',
  'Data_Selection.md',
  'Data_Silos.md',
  'Distributed_Learning.md',
  'Fairness_and_Robustness.md',
  'Influence_Functions.md',
  'Interpretability.md',
  'LLM_Reliability.md',
  'Model_Collapse.md',
  'Random_Forest.md',
  'Recursive_Synthetic_Data_Training.md',
  'Sample_Selection_Bias.md',
  'Synthetic_Data.md',
  'Trustworthy_AI.md',
  'Wasserstein_Geometry.md'
]) {
  const body = read(page);
  assert.match(body, /^## Role in this wiki$/m, `${page} explains its role in the wiki`);
  assert.match(body, /^## Connection to Qiao's work$/m, `${page} connects the topic to Qiao's work`);
  assert.ok(footnoteRefs(body).length <= 1, `${page} avoids over-footnoting background`);
  assert.ok(footnoteDefs(body).length <= 1, `${page} keeps at most one source note`);
  assert.ok(body.split(/\s+/).length >= 120, `${page} is no longer a one-paragraph placeholder`);
}

for (const page of [
  'Collaborative_Evaluation.md',
  'Data_Centric_Machine_Learning.md',
  'Data_Selection.md',
  'Data_Silos.md',
  'Fairness_and_Robustness.md',
  'Interpretability.md',
  'LLM_Reliability.md',
  'Sample_Selection_Bias.md',
  'Synthetic_Data.md',
  'Trustworthy_AI.md'
]) {
  const body = read(page);
  assert.equal(footnoteRefs(body).length, 0, `${page} keeps generic topic prose unfootnoted`);
  assert.equal(footnoteDefs(body).length, 0, `${page} removes explanatory-only footnotes`);
}

function assertSectionOrder(page, sections) {
  const body = read(page);
  let lastIndex = -1;
  for (const section of sections) {
    const index = body.indexOf(section);
    assert.ok(index > lastIndex, `${page} includes ${section} in the shared topic-page order`);
    lastIndex = index;
  }
}

const researchTopicPages = [
  'AI_and_Networks.md',
  'Machine_Unlearning.md',
  'Synthetic_Data_and_Model_Collapse.md',
  'Data_Centric_Machine_Learning.md'
];

const researchTopicImages = new Map([
  ['AI_and_Networks.md', '/topics/ai-and-networks.png'],
  ['Machine_Unlearning.md', '/topics/machine-unlearning.png'],
  ['Synthetic_Data_and_Model_Collapse.md', '/topics/synthetic-data.png'],
  ['Data_Centric_Machine_Learning.md', '/topics/data-centric-ml.png']
]);

for (const page of researchTopicPages) {
  const body = read(page);
  const data = frontmatterData(page);
  const image = researchTopicImages.get(page);
  assert.ok(image, `${page} has a topic image mapping`);
  assert.equal(data.image, image, `${page} uses a custom topic illustration`);
  assert.match(data.image_caption, /topic diagram/, `${page} captions the topic illustration`);
  assert.doesNotMatch(`${data.image}\n${data.image_caption}`, /institutions|university|emblem|logo/i, `${page} does not reuse school imagery`);
  assertSectionOrder(page, ['## Introduction', '## Role in this wiki', '## Publications', "## Connection to Qiao's work", '## See also']);
  assert.match(body, /\| Paper \| Venue\/status \|/, `${page} uses the shared publications table heading`);
  assert.doesNotMatch(body, /Central paper|Central publication/i, `${page} avoids inconsistent central-paper phrasing`);
}

const generatedConceptImages = [
  'public/topics/ai-and-networks.png',
  'public/topics/machine-unlearning.png',
  'public/topics/synthetic-data.png',
  'public/topics/data-centric-ml.png',
  'public/papers/model-collapse/teaser.png'
];

for (const file of generatedConceptImages) {
  assertFile(file);
  const { size } = fs.statSync(path.join(root, file));
  assert.ok(size > 100_000, `${file} is a generated raster illustration, not a tiny placeholder`);
  assert.ok(size < 600_000, `${file} is compressed enough for static-page delivery`);
}

assert.doesNotMatch(read('AI_and_Networks.md'), /Learn_What_Matters_Data_Pruning_for_Efficient_Decentralized_Learning|Learn What Matters/, 'AI and Networks does not surface the hidden under-review manuscript');
assert.match(read('AI_and_Networks.md'), /\| \[\[When_Sample_Selection_Bias_Precipitates_Model_Collapse\|When Sample Selection Bias Precipitates Model Collapse\]\] \| ICML 2026, 6-11 July 2026, Seoul\. \|/, 'AI and Networks lists only conference, date, and place');
assert.match(read('Machine_Unlearning.md'), /ICLR 2025, 24-28 April 2025, Singapore\./, 'Machine Unlearning lists only ICLR conference timing');
assert.match(read('Machine_Unlearning.md'), /AAAI 2026, 20-27 January 2026, Singapore\./, 'Machine Unlearning lists only AAAI conference timing');
assert.match(read('Synthetic_Data_and_Model_Collapse.md'), /ICML 2026, 6-11 July 2026, Seoul\./, 'Synthetic Data lists only ICML conference timing');
assert.doesNotMatch(read('Data_Centric_Machine_Learning.md'), /Learn_What_Matters_Data_Pruning_for_Efficient_Decentralized_Learning|Learn What Matters/, 'Data Centric ML does not surface the hidden under-review manuscript');

function sectionBetween(body, start, end) {
  const startIndex = body.indexOf(start);
  assert.ok(startIndex >= 0, `body includes ${start}`);
  const endIndex = body.indexOf(end, startIndex + start.length);
  assert.ok(endIndex > startIndex, `body includes ${end} after ${start}`);
  return body.slice(startIndex, endIndex);
}

const verboseStatusPattern = /owner-provided|author-notification|OpenReview published|accepted main track|presentation listed|ongoing journal manuscript|according to|listed in the CV|arXiv v1/i;
for (const page of researchTopicPages) {
  const publicationsBlock = sectionBetween(read(page), '## Publications', "## Connection to Qiao's work");
  assert.doesNotMatch(publicationsBlock, verboseStatusPattern, `${page} keeps Venue/status cells concise`);
}
const publicationIndexBlock = sectionBetween(read('Publications.md'), '## Peer-reviewed and accepted papers', '## Topic index');
assert.doesNotMatch(publicationIndexBlock, verboseStatusPattern, 'publication index keeps venue/status cells concise');

for (const page of ['AI_and_Networks.md', 'Xinbao_Qiao.md', 'Qiao_Xinbao_zh.md', 'The_Chinese_University_of_Hong_Kong.md']) {
  assert.match(read(page), /https:\/\/www\.ie\.cuhk\.edu\.hk\/about-the-department\//, `${page} cites the CUHK IE source URL for information-engineering framing`);
}
assert.match(read('The_Chinese_University_of_Hong_Kong.md'), /https:\/\/www\.ie\.cuhk\.edu\.hk\/programmes\/mphil-phd-in-information-engineering\//, 'CUHK page cites the IE MPhil-PhD overview URL');
assert.match(read('The_Chinese_University_of_Hong_Kong.md'), /https:\/\/www\.cuhk\.edu\.hk\/english\/aboutus\/university-intro\.html/, 'CUHK page cites the official university introduction URL');

const allMarkdown = fs.readdirSync(wikiDir)
  .filter((file) => file.endsWith('.md'))
  .map((file) => read(file))
  .join('\n');
const allChineseMarkdown = chinesePageFiles.map((file) => read(file)).join('\n');
assert.doesNotMatch(allChineseMarkdown, /ZXQ|XQ0|当_ 抽样|软件_ Weightd|学习什么 内容|首尔首尔|大赦国际|高山模型|秋奥|\[\[\[/, 'Chinese markdown pages avoid broken machine-translation artifacts');
assert.match(read('When_Sample_Selection_Bias_Precipitates_Model_Collapse_zh.md'), /\\operatorname\{TN\}/, 'Chinese model-collapse page preserves rendered formula syntax');
assert.match(read('Hessian_Free_Online_Certified_Unlearning_zh.md'), /\\widehat\{H\}/, 'Chinese Hessian-free page preserves rendered formula syntax');
assert.match(read('DynFrs_zh.md'), /\\lceil qT\\rceil/, 'Chinese DynFrs page preserves rendered formula syntax');
assert.match(read('Soft_Weighted_Machine_Unlearning_zh.md'), /\\epsilon\^\\star/, 'Chinese soft-weighted page preserves rendered formula syntax');
assert.doesNotMatch(allMarkdown, /backup\/old-homepage/, 'wiki no longer depends on backup-branch image URLs');
assert.doesNotMatch(allMarkdown, /withheld\s+LLM\s+manuscript/i, 'withheld manuscript notes are not public content');

for (const page of ['Xinbao_Qiao.md', 'Qiao_Xinbao_zh.md', 'Publications.md']) {
  assert.doesNotMatch(read(page), /!\[/, `${page} remains text-only in the article body`);
}

const cvTex = fs.readFileSync(path.join(root, 'CV.tex'), 'utf8');
assert.match(cvTex, /xinbaoqiao@cuhk\.edu\.hk/, 'CV uses current CUHK email');
assert.doesNotMatch(cvTex, /xinbaoqiao@zju\.edu\.cn/, 'CV removes old Zhejiang email');
assert.match(cvTex, /The Chinese University of Hong Kong/, 'CV includes current PhD affiliation');
assert.match(cvTex, /When[\s\S]*Sample Selection Bias[\s\S]*Model Collapse[\s\S]*ICML,? 2026/, 'CV updates model-collapse paper status');
assert.doesNotMatch(cvTex, /withheld\s+LLM\s+manuscript/i, 'CV omits withheld manuscript notes');

const publicImages = fs.readdirSync(path.join(root, 'public/images')).filter((file) => /\.(png|jpe?g|gif|webp|svg|ico)$/i.test(file));
assert.deepEqual(publicImages, ['Portrait.png'], 'public site uses exactly one image');

for (const file of [
  'public/images/Portrait.png',
  'public/institutions/cuhk-emblem.svg',
  'public/institutions/zhejiang-university-logo.png',
  'public/institutions/shandong-university-logo.png',
  'public/institutions/nusri-cq-logo.svg',
  'public/topics/ai-and-networks.png',
  'public/topics/machine-unlearning.png',
  'public/topics/synthetic-data.png',
  'public/topics/data-centric-ml.png',
  'public/files/XinbaoQiao_CV.pdf',
  'public/papers/model-collapse/teaser.png',
  'public/papers/model-collapse/fid-trends-combined.png',
  'public/papers/model-collapse/barycenter-methodology.png',
  'public/papers/model-collapse/class-proportions-trend.png',
  'public/papers/hessian-free/ours.png',
  'public/papers/hessian-free/mia-tradeoff.png',
  'public/papers/hessian-free/poster.png',
  'public/papers/soft-weighted/sec-5-1-1.png',
  'public/papers/soft-weighted/framework.png',
  'public/papers/dynfrs/lazy-tags.png',
  'public/papers/dynfrs/poster.png'
]) {
  assertFile(file);
}

console.log('Wiki data tests passed.');
