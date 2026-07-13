import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
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

function sortedUrls(urls) {
  return urls.map((url) => url.replaceAll('\\&', '&')).sort();
}

function pngDimensions(buffer) {
  assert.equal(buffer.toString('ascii', 1, 4), 'PNG', 'asset is a PNG image');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

for (const file of ['Xinbao_Qiao.md', 'Qiao_Xinbao_zh.md', 'index.md', 'log.md', 'CV.md', 'Meng_Zhang.md', 'Angela_Yingjun_Zhang.md', 'Internet_Slang_2026.md']) {
  assertFile(`wiki/${file}`);
}
assertFile('CV.tex');
assert.ok(!fs.existsSync(path.join(root, 'app/atlas/page.tsx')), 'retired Research Atlas route is removed');
assert.ok(!fs.existsSync(path.join(root, 'components/ResearchAtlas.tsx')), 'retired Research Atlas component is removed');
assert.ok(!fs.existsSync(path.join(root, 'lib/research-atlas.ts')), 'retired Research Atlas data source is removed');

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
assert.ok(bioData.education.some((item) => item.label === 'Zhejiang University' && item.detail === '(MEng, 2025)'), 'English biography records the ZJU degree as MEng');
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
assert.ok(zhBioData.education.some((item) => item.label === '浙江大学' && item.detail === '（工学硕士，2025）'), 'Chinese biography records the ZJU degree as 工学硕士');

assert.match(home, /\[\[Publications\]\]/, 'home article links to Publications');
assert.match(home, /\[\[Research\]\]/, 'home article links to Research');
assert.match(home, /\[\[Angela_Yingjun_Zhang\|Angela Yingjun Zhang\]\]/, 'home article links to the PhD advisor page');
assert.match(home, /\[\[Meng_Zhang\|Meng Zhang\]\]/, 'home article links to the master advisor page');
assert.match(home, /born September 2000 in Xishuangbanna, Yunnan/, 'home article uses month-level birth date');
assert.doesNotMatch(home, /30 September 2000/, 'home article omits exact birth day');
assert.match(home, /Master of Engineering in Artificial Intelligence/, 'English homepage describes the ZJU AI degree as Master of Engineering');
assert.doesNotMatch(home, /Master of Science in Artificial Intelligence/, 'English homepage avoids the incorrect ZJU Master of Science wording');
assert.match(zhHome, /2000年9月30日/, 'Chinese page includes birth date');
assert.match(zhHome, /人工智能工学硕士/, 'Chinese homepage describes the ZJU AI degree as 工学硕士');
assert.doesNotMatch(zhHome, /理学硕士/, 'Chinese homepage avoids the incorrect ZJU 理学硕士 wording');
assert.match(zhHome, /\[\[Angela_Yingjun_Zhang\|张颖珺\]\]/, 'Chinese home article uses the advisor\'s Chinese name');
assert.match(zhHome, /\[\[Meng_Zhang\|Meng Zhang\]\]/, 'Chinese home article links to the master advisor page');
assert.match(home, /## See also[\s\S]*\[\[CV\|Résumé\]\]/, 'English homepage See also labels the CV link as Résumé');
assert.match(zhHome, /## 参见[\s\S]*\[\[CV_zh\|Résumé\]\]/, 'Chinese homepage uses 参见 and labels the CV link as Résumé');
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
assertFile('components/ChatWithXinbaoPanel.tsx');
assertFile('app/search-index.json/route.ts');
assertFile('app/robots.ts');
assertFile('app/sitemap.ts');
assertFile('app/api/chat-with-xinbao/route.ts');
assertFile('app/api/chat-with-xinbao/questions/route.ts');
assertFile('lib/chat-with-xinbao.ts');
assertFile('chat with xinbao/README.md');
assertFile('chat with xinbao/env.example');
assertFile('chat with xinbao/persona-prompt.md');
assertFile('chat with xinbao/meme-voice-notes.md');
assertFile('scripts/wiki-maintenance.mjs');
assertFile('scripts/new-wiki-page.mjs');
assertFile('wiki/graph.json');
assertFile('wiki/quality-report.json');
assertFile('wiki/maintenance-schema.json');
assertFile('public/okf/index.md');
assertFile('public/okf/log.md');
assertFile('public/okf/manifest.json');
assertFile('public/okf/pages.json');
assertFile('public/okf/graph.json');
assertFile('public/okf/quality-report.json');
assertFile('public/okf/schema.json');
assertFile('public/okf/concepts/Xinbao_Qiao.md');
assertNoPath('cloudflare');
assertFile('public/xinbaopedia-icon.png');
assertNoPath('public/xinbaopedia-icon.svg');
const siteIcon = fs.readFileSync(path.join(root, 'public/xinbaopedia-icon.png'));
const themedSiteIcons = [
  'public/site-icons/xinbaopedia-blue.png',
  'public/site-icons/xinbaopedia-gold.png',
  'public/site-icons/xinbaopedia-green.png',
  'public/site-icons/xinbaopedia-charcoal.png'
];
for (const iconPath of themedSiteIcons) {
  assertFile(iconPath);
  const themedIcon = fs.readFileSync(path.join(root, iconPath));
  assert.equal(themedIcon.toString('ascii', 1, 4), 'PNG', `${iconPath} is a PNG favicon candidate`);
  assert.ok(themedIcon.length > 100000, `${iconPath} keeps enough raster detail for browser favicon rendering`);
}
const themedSiteWordmarks = [
  'public/site-logos/wordmark/xinbao-qiao-blue.png',
  'public/site-logos/wordmark/xinbao-qiao-gold.png',
  'public/site-logos/wordmark/xinbao-qiao-green.png',
  'public/site-logos/wordmark/xinbao-qiao-charcoal.png'
];
for (const logoPath of themedSiteWordmarks) {
  assertFile(logoPath);
  const logo = fs.readFileSync(path.join(root, logoPath));
  assert.deepEqual(pngDimensions(logo), { width: 641, height: 158 }, `${logoPath} is cropped to the visible homepage wordmark instead of keeping the rectangular source canvas`);
  assert.ok(logo.length > 20000 && logo.length < 50000, `${logoPath} is a compact flattened homepage wordmark instead of publishing the full source artwork`);
  const alphaBounds = execFileSync('convert', [logoPath, '-alpha', 'extract', '-trim', '-format', '%wx%h+%X+%Y', 'info:'], { cwd: root, encoding: 'utf8' });
  assert.equal(alphaBounds, '633x150++4++4', `${logoPath} keeps only a small transparent guard around the visible logo`);
  const visibleColorCount = Number(execFileSync('convert', [logoPath, '-trim', '+repage', '-alpha', 'off', '-format', '%k', 'info:'], { cwd: root, encoding: 'utf8' }));
  assert.ok(visibleColorCount <= 2, `${logoPath} uses a flat visible logo color without a separate decorative outline`);
}
const languageToggle = fs.readFileSync(path.join(root, 'components/LanguageToggle.tsx'), 'utf8');
const articleTabs = fs.readFileSync(path.join(root, 'components/ArticleTabs.tsx'), 'utf8');
const wikiSearch = fs.readFileSync(path.join(root, 'components/WikiSearch.tsx'), 'utf8');
const chatWithXinbao = fs.readFileSync(path.join(root, 'components/ChatWithXinbao.tsx'), 'utf8');
const chatWithXinbaoPanel = fs.readFileSync(path.join(root, 'components/ChatWithXinbaoPanel.tsx'), 'utf8');
const searchIndexRoute = fs.readFileSync(path.join(root, 'app/search-index.json/route.ts'), 'utf8');
const robotsRoute = fs.readFileSync(path.join(root, 'app/robots.ts'), 'utf8');
const sitemapRoute = fs.readFileSync(path.join(root, 'app/sitemap.ts'), 'utf8');
const chatRoute = fs.readFileSync(path.join(root, 'app/api/chat-with-xinbao/route.ts'), 'utf8');
const chatQuestionsRoute = fs.readFileSync(path.join(root, 'app/api/chat-with-xinbao/questions/route.ts'), 'utf8');
const chatKnowledge = fs.readFileSync(path.join(root, 'lib/chat-with-xinbao.ts'), 'utf8');
const pageIndex = JSON.parse(fs.readFileSync(path.join(wikiDir, 'pages.json'), 'utf8'));
const wikiGraph = JSON.parse(fs.readFileSync(path.join(wikiDir, 'graph.json'), 'utf8'));
const wikiQualityReport = JSON.parse(fs.readFileSync(path.join(wikiDir, 'quality-report.json'), 'utf8'));
const maintenanceSchema = JSON.parse(fs.readFileSync(path.join(wikiDir, 'maintenance-schema.json'), 'utf8'));
const okfManifest = JSON.parse(fs.readFileSync(path.join(root, 'public/okf/manifest.json'), 'utf8'));
const okfPageIndex = JSON.parse(fs.readFileSync(path.join(root, 'public/okf/pages.json'), 'utf8'));
const okfGraph = JSON.parse(fs.readFileSync(path.join(root, 'public/okf/graph.json'), 'utf8'));
const okfQualityReport = JSON.parse(fs.readFileSync(path.join(root, 'public/okf/quality-report.json'), 'utf8'));
const okfSchema = JSON.parse(fs.readFileSync(path.join(root, 'public/okf/schema.json'), 'utf8'));
const okfHome = matter(fs.readFileSync(path.join(root, 'public/okf/concepts/Xinbao_Qiao.md'), 'utf8'));
const okfSyntheticTopic = matter(fs.readFileSync(path.join(root, 'public/okf/concepts/Synthetic_Data_and_Model_Collapse.md'), 'utf8'));
const okfConceptLog = fs.readFileSync(path.join(root, 'public/okf/concepts/log.md'), 'utf8');
const okfConceptLogZh = fs.readFileSync(path.join(root, 'public/okf/concepts/log_zh.md'), 'utf8');
const okfConceptHomeZh = fs.readFileSync(path.join(root, 'public/okf/concepts/Qiao_Xinbao_zh.md'), 'utf8');
const chatReadme = fs.readFileSync(path.join(root, 'chat with xinbao/README.md'), 'utf8');
const chatEnvExample = fs.readFileSync(path.join(root, 'chat with xinbao/env.example'), 'utf8');
const chatPersona = fs.readFileSync(path.join(root, 'chat with xinbao/persona-prompt.md'), 'utf8');
const chatMemeNotes = fs.readFileSync(path.join(root, 'chat with xinbao/meme-voice-notes.md'), 'utf8');
const internetSlang2026 = read('Internet_Slang_2026.md');
const internetSlang2026Zh = read('Internet_Slang_2026_zh.md');
const questionLogFunction = chatRoute.match(/async function recordQuestionLog[\s\S]*?\n}\n\nfunction withXinbaoSignature/)?.[0] || '';
assert.equal(siteIcon.toString('ascii', 1, 4), 'PNG', 'site icon uses the new PNG app-style mark');
assert.ok(siteIcon.length > 100000, 'site icon keeps enough raster detail for portal and favicon rendering');
assert.match(layout, /metadataBase: new URL\('https:\/\/xinbaopedia\.top'\)/, 'site metadata resolves canonical URLs against the production domain');
assert.match(layout, /default: 'Xinbaopedia'[\s\S]*template: '%s \| Xinbaopedia'/, 'site metadata keeps a canonical title and article title template');
assert.match(layout, /text: pathWithBasePath\('\/xinbaopedia-icon\.png'\)/, 'layout keeps a text-theme favicon fallback');
assert.match(layout, /const sitePaletteIcons = \{[\s\S]*blue: pathWithBasePath\('\/site-icons\/xinbaopedia-blue\.png'\)[\s\S]*gold: pathWithBasePath\('\/site-icons\/xinbaopedia-gold\.png'\)[\s\S]*green: pathWithBasePath\('\/site-icons\/xinbaopedia-green\.png'\)[\s\S]*charcoal: pathWithBasePath\('\/site-icons\/xinbaopedia-charcoal\.png'\)[\s\S]*\}/, 'layout defines the base-path-aware themed favicon set');
assert.match(layout, /icons: \{ icon: sitePaletteIcons\.blue \}/, 'site metadata defaults to the morning-blue favicon before client-side time selection');
assert.match(layout, /import \{ LanguageToggle, SitePalette \} from '@\/components\/LanguageToggle';/, 'layout imports the shared site palette controller');
assert.match(layout, /<SitePalette icons=\{sitePaletteIcons\} \/>/, 'layout mounts the site palette controller once for every page');
assert.match(layout, /import 'katex\/dist\/katex\.min\.css';/, 'layout imports KaTeX CSS for rendered formulas');
assert.doesNotMatch(layout, /wiki-logo-mark|<img className=/, 'topbar uses a text-only wordmark');
assert.match(layout, /className="wiki-logo"[\s\S]*href=\{pathWithBasePath\('\/'\)\}[\s\S]*wiki-logo-word[\s\S]*Xinbaopedia[\s\S]*wiki-logo-subtitle[\s\S]*The Academic Wiki/, 'topbar wordmark links to the Wikipedia-style portal homepage');
assert.match(layout, /<ArticleTabs \/>/, 'article tools stay isolated in the top-level layout');
assert.match(layout, /import \{ WikiSearch \} from '@\/components\/WikiSearch';/, 'layout imports the interactive wiki search component');
assert.match(layout, /import \{ pathWithBasePath \} from '@\/lib\/wiki';/, 'layout imports only the base-path helper from the wiki library');
assert.doesNotMatch(layout, /getSearchIndex|searchIndex/, 'layout does not serialize the full search index into every page');
assert.match(layout, /<WikiSearch hideOnPortal \/>/, 'layout keeps topbar search on article pages without embedding its data');
assert.match(languageToggle, /if \(!decodeURIComponent\(pathname\)\.split\('\/'\)\.includes\('wiki'\)\) return null;/, 'language toggle hides on the portal homepage where language editions are shown in the masthead');
assert.match(languageToggle, /type SitePaletteName = 'text' \| 'blue' \| 'gold' \| 'green' \| 'charcoal';/, 'site palette includes a manual text wordmark theme alongside color logo themes');
assert.match(languageToggle, /\{ color: '#202122', mode: 'text', title: 'Text wordmark theme' \}/, 'site palette exposes a text theme swatch');
assert.match(languageToggle, /const sitePaletteOptions: SitePaletteOption\[\] = \[[\s\S]*mode: 'text'[\s\S]*mode: 'blue'[\s\S]*mode: 'gold'[\s\S]*mode: 'green'[\s\S]*mode: 'charcoal'[\s\S]*mode: 'auto'[\s\S]*\];/, 'site palette switcher orders the pure text theme first and auto mode last');
assert.match(languageToggle, /function sitePaletteForLocalTime\(date = new Date\(\)\): Exclude<SitePaletteName, 'text'> \{[\s\S]*hour >= 5 && hour < 10[\s\S]*return 'blue'[\s\S]*hour >= 10 && hour < 16[\s\S]*return 'gold'[\s\S]*hour >= 16 && hour < 20[\s\S]*return 'green'[\s\S]*return 'charcoal'[\s\S]*\}/, 'site palette maps local time only to color logo themes');
assert.match(languageToggle, /window\.localStorage\.getItem\(sitePaletteStorageKey\)/, 'site palette restores a manual color override from local storage');
assert.match(languageToggle, /document\.documentElement\.dataset\.sitePalette = palette;/, 'site palette exposes the active color as an html data attribute');
assert.match(languageToggle, /document\.documentElement\.dataset\.sitePaletteMode = mode;/, 'site palette preserves whether the visible palette came from auto or manual mode');
assert.match(languageToggle, /updateSiteFavicon\(icons\[palette\]\);/, 'site palette updates the browser favicon when the active palette changes');
assert.match(languageToggle, /window\.setInterval\(applyPalette, 5 \* 60 \* 1000\)/, 'site palette periodically refreshes auto mode as local time changes');
assert.match(languageToggle, /const active = mode === option\.mode;/, 'site palette marks only the chosen mode as active');
assert.doesNotMatch(languageToggle, /activePalette|activePalette === option\.mode/, 'site palette no longer double-highlights Auto and the current time color');
assert.match(languageToggle, /className="site-palette-switcher"/, 'site palette keeps manual color swatches as a fallback control');
assert.match(wikiSearch, /hideOnPortal\?: boolean;/, 'search component exposes a homepage suppression prop for the topbar instance');
assert.match(wikiSearch, /if \(hideOnPortal && isPortalPath\(pathname\)\) return null;/, 'topbar search can hide on the portal homepage');
assert.doesNotMatch(wikiPageTsx, /Qiao Xinbao Academic Wiki/, 'article metadata no longer uses old Academic Wiki suffix');
assert.match(wikiPageTsx, /title: page\.title[\s\S]*alternates: \{ canonical \}[\s\S]*openGraph:/, 'article metadata supplies canonical and share metadata through the root title template');
for (const dependency of ['remark-math', 'rehype-katex', 'katex']) {
  assert.ok(packageJson.dependencies?.[dependency], `package.json includes ${dependency}`);
}
assert.ok(packageJson.dependencies?.['@upstash/redis'], 'package.json includes Upstash Redis for server-side rate limits');
assert.equal(packageJson.scripts?.['maintain:wiki'], 'node scripts/wiki-maintenance.mjs --standardize --write', 'package.json exposes a deterministic wiki maintenance writer');
assert.equal(packageJson.scripts?.['lint:content'], 'node scripts/wiki-maintenance.mjs --check', 'package.json exposes a deterministic content maintenance check');
assert.equal(packageJson.scripts?.['lint:okf'], 'node scripts/okf-conformance.mjs', 'package.json exposes a deterministic OKF conformance check');
assert.equal(packageJson.scripts?.['new:wiki'], 'node scripts/new-wiki-page.mjs', 'package.json exposes a reusable source-page template helper');
assert.equal(packageJson.scripts?.['verify:publish'], 'node scripts/verify-publish-set.mjs', 'package.json exposes a publish-set safety check');
assert.equal(packageJson.scripts?.['smoke:production'], 'node scripts/smoke-production.mjs', 'package.json exposes a production smoke check');
assert.equal(packageJson.scripts?.['deploy:production'], 'node scripts/deploy-production.mjs', 'package.json exposes a token-safe Vercel production deployment wrapper');
assert.match(packageJson.scripts?.check || '', /lint:content/, 'repository check includes the content maintenance check');
assert.match(packageJson.scripts?.check || '', /lint:okf/, 'repository check includes the OKF conformance check');
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
assert.equal(wikiQualityReport.schemaVersion, 1, 'wiki quality report declares its schema version');
assert.equal(wikiQualityReport.okfVersion, '0.1', 'wiki quality report declares the OKF target version');
assert.equal(wikiQualityReport.counts.pages, wikiGraph.stats.pages, 'wiki quality report page count matches the graph');
assert.equal(wikiQualityReport.counts.warnings, 0, 'wiki quality report keeps the current corpus warning-free');
assert.deepEqual(wikiQualityReport.warnings, [], 'wiki quality report keeps an explicit empty warning list');
assert.equal(wikiQualityReport.hiddenPages.count, 2, 'wiki quality report counts hidden pages');
assert.equal(wikiQualityReport.hiddenPages.pages.length, 2, 'wiki quality report lists source hidden pages');
assert.deepEqual(wikiQualityReport.duplicateTitleGroups, [], 'wiki quality report lists duplicate-title groups even when empty');
assert.deepEqual(wikiQualityReport.orphanPages, [], 'wiki quality report lists orphan pages even when empty');
assert.deepEqual(wikiQualityReport.noOutgoingPages, [], 'wiki quality report lists no-outgoing pages even when empty');
assert.deepEqual(wikiQualityReport.missingTranslationPairs, [], 'wiki quality report lists missing translation pairs even when empty');
assert.deepEqual(wikiQualityReport.translationConsistency.warnings, [], 'translation consistency has no current warnings');
assert.equal(wikiQualityReport.structuredRelationCounts['depends-on'], 2, 'wiki quality report counts structured depends-on relations');
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
const okfLanguageCounts = Object.fromEntries(
  Object.entries(okfGraph.nodes.reduce((counts, node) => ({ ...counts, [node.language]: (counts[node.language] || 0) + 1 }), {})).sort(([a], [b]) => a.localeCompare(b))
);
const okfTypeCounts = Object.fromEntries(
  Object.entries(okfGraph.nodes.reduce((counts, node) => ({ ...counts, [node.type]: (counts[node.type] || 0) + 1 }), {})).sort(([a], [b]) => a.localeCompare(b))
);
assert.deepEqual(okfGraph.stats.languages, okfLanguageCounts, 'public OKF graph language counts are recomputed after hidden-page exclusion');
assert.deepEqual(okfGraph.stats.types, okfTypeCounts, 'public OKF graph type counts are recomputed after hidden-page exclusion');
assert.equal(okfQualityReport.schemaVersion, 1, 'public OKF quality report declares its schema version');
assert.equal(okfQualityReport.okfVersion, '0.1', 'public OKF quality report declares the OKF target version');
assert.equal(okfQualityReport.counts.pages, okfGraph.nodes.length, 'public OKF quality report page count matches public graph');
assert.deepEqual(okfQualityReport.counts.languages, okfLanguageCounts, 'public OKF quality report language counts match the public graph');
assert.deepEqual(okfQualityReport.counts.types, okfTypeCounts, 'public OKF quality report type counts match the public graph');
assert.equal(okfQualityReport.counts.warnings, 0, 'public OKF quality report is warning-free');
assert.deepEqual(okfQualityReport.warnings, [], 'public OKF quality report keeps an explicit empty warning list');
assert.deepEqual(okfQualityReport.hiddenPages.pages, [], 'public OKF quality report does not expose hidden page slugs');
assert.deepEqual(okfQualityReport.missingTranslationPairs, [], 'public OKF quality report lists missing translation pairs even when empty');
assert.equal(okfQualityReport.structuredRelationCounts['depends-on'], wikiQualityReport.structuredRelationCounts['depends-on'], 'public OKF quality report keeps structured relation counts');
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
assert.match(okfConceptLog, /\[Qiao Xinbao zh\]\(\.\/Qiao_Xinbao_zh\.md\)/, 'English OKF log preserves explicit Chinese homepage links');
assert.doesNotMatch(okfConceptLog, /\[Qiao Xinbao zh\]\(\.\/Xinbao_Qiao\.md\)/, 'English OKF log does not collapse explicit Chinese links back to English');
assert.match(okfConceptLogZh, /\[英文人物主页\]\(\.\/Xinbao_Qiao\.md\)/, 'Chinese OKF log preserves explicit English homepage links when the label says English');
assert.match(okfConceptHomeZh, /\[English version\]\(\.\/Xinbao_Qiao\.md\)/, 'Chinese OKF biography preserves its explicit English-version link');
assert.doesNotMatch(okfConceptHomeZh, /\[English version\]\(\.\/Qiao_Xinbao_zh\.md\)/, 'Chinese OKF biography does not self-link the English-version entry');
assert.doesNotMatch(fs.readFileSync(path.join(root, 'public/okf/index.md'), 'utf8'), /^---/m, 'public OKF reserved index has no frontmatter');
assert.doesNotMatch(fs.readFileSync(path.join(root, 'public/okf/log.md'), 'utf8'), /^---/m, 'public OKF reserved log has no frontmatter');

const newWikiPageScript = fs.readFileSync(path.join(root, 'scripts/new-wiki-page.mjs'), 'utf8');
assert.match(newWikiPageScript, /--slug <Slug> --title <Title> --type <Type> --language en\|zh --description <Text>/, 'new wiki page helper documents the required template arguments');
assert.match(newWikiPageScript, /translation_of/, 'new wiki page helper supports translation_of frontmatter');
assert.match(newWikiPageScript, /wiki\/\$\{slug\}\.md already exists; use --force/, 'new wiki page helper refuses to overwrite existing pages by default');
const ciWorkflow = fs.readFileSync(path.join(root, '.github/workflows/ci.yml'), 'utf8');
const deployProductionScript = fs.readFileSync(path.join(root, 'scripts/deploy-production.mjs'), 'utf8');
assert.match(ciWorkflow, /apt-get install -y --no-install-recommends imagemagick mupdf-tools/, 'CI installs ImageMagick and mutool for image and CV PDF checks');
assert.match(ciWorkflow, /npm audit --omit=dev --audit-level=high/, 'CI blocks high-severity production dependency advisories');
assert.match(deployProductionScript, /const vercelCliVersion = '54\.18\.7';/, 'deployment wrapper pins a Vercel CLI version with VERCEL_TOKEN env support');
assert.match(deployProductionScript, /VERCEL_TOKEN is required in the environment/, 'deployment wrapper requires the token through the environment');
assert.match(deployProductionScript, /function redactArgs\(args, env\)/, 'deployment wrapper redacts token values from wrapper error messages');
assert.match(deployProductionScript, /'<redacted-token>'/, 'deployment wrapper uses a stable token redaction marker');
assert.match(deployProductionScript, /env\.VERCEL_TOKEN = token/, 'deployment wrapper passes the token only through the child process environment');
assert.match(deployProductionScript, /function vercelArgs\(command, args = \[\]\)/, 'deployment wrapper centralizes Vercel CLI argument construction');
assert.match(deployProductionScript, /function deploymentUrlFromOutput\(output\)[\s\S]*JSON\.parse\(output\)[\s\S]*parsed\?\.deployment\?\.url[\s\S]*\.vercel\\\.app/, 'deployment wrapper accepts both JSON agent output and plain Vercel deployment URLs');
assert.match(deployProductionScript, /function resolveCachedVercelBin\(\)/, 'deployment wrapper resolves a local Vercel CLI binary before deploying');
assert.match(deployProductionScript, /node_modules', '\.bin', vercelBinName\(\)/, 'deployment wrapper prefers the project-local Vercel CLI binary');
assert.match(deployProductionScript, /'_npx'/, 'deployment wrapper can reuse an existing npm npx cache without invoking npx during deploy');
assert.match(deployProductionScript, /function requireCleanDeploymentTree\(\)/, 'deployment wrapper checks the local git state before production deploy');
assert.match(deployProductionScript, /working tree must be clean before production deploy/, 'deployment wrapper refuses dirty production deploys');
assert.match(deployProductionScript, /local branch must match its upstream before production deploy/, 'deployment wrapper refuses ahead or behind production deploys');
assert.doesNotMatch(deployProductionScript, /['"]--token['"], token/, 'deployment wrapper does not put the token on the Vercel CLI command line');
assert.match(deployProductionScript, /'--project', project, '--scope', scope/, 'deployment wrapper links the explicit Vercel project and scope');
assert.match(deployProductionScript, /'--prod', '--skip-domain'/, 'deployment wrapper stages a production build without changing the canonical domain');
assert.match(deployProductionScript, /function runStagedSmoke[\s\S]*vercelArgs\('curl'/, 'deployment wrapper uses authenticated Vercel curl for protected staged deployments');
assert.match(deployProductionScript, /\/robots\.txt[\s\S]*\/sitemap\.xml[\s\S]*\/search-index\.json[\s\S]*\/api\/chat-with-xinbao\//, 'staged smoke covers metadata, search, and chat routes');
assert.match(deployProductionScript, /'--silent', '--show-error', '--max-time', '30'/, 'each staged smoke request has a bounded network timeout');
assert.match(deployProductionScript, /runStagedSmoke\(vercelCommand, env, stagedUrl\)/, 'deployment wrapper smoke-tests the protected staged deployment before promotion');
assert.match(deployProductionScript, /throw new Error\('Vercel did not return a valid staged deployment URL'\)/, 'deployment wrapper preserves finally cleanup when staged URL parsing fails');
assert.match(deployProductionScript, /process\.once\('SIGINT'[\s\S]*cleanupOnSignal\(130\)[\s\S]*process\.once\('SIGTERM'[\s\S]*cleanupOnSignal\(143\)/, 'deployment wrapper removes generated env state when interrupted');
assert.match(deployProductionScript, /vercelArgs\('promote', \[stagedUrl, '--yes', '--scope', scope\]\)/, 'deployment wrapper promotes only a verified staged deployment');
assert.match(deployProductionScript, /runSmoke\(env, productionUrl\)/, 'deployment wrapper verifies the canonical domain after promotion');
assert.doesNotMatch(deployProductionScript, /vercel@latest/, 'deployment wrapper avoids floating Vercel CLI versions');
const gitignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
const vercelignore = fs.readFileSync(path.join(root, '.vercelignore'), 'utf8');
const verifyPublishSet = fs.readFileSync(path.join(root, 'scripts/verify-publish-set.mjs'), 'utf8');
assert.match(gitignore, /\.vercel-auth-\*\//, 'gitignore excludes temporary Vercel auth directories');
assert.match(vercelignore, /\.vercel-auth-\*\//, 'vercelignore excludes temporary Vercel auth directories');
assert.match(gitignore, /agent_progress\.md/, 'gitignore keeps the local agent ledger out of commits by default');
assert.match(vercelignore, /AGENTS\.md[\s\S]*CLAUDE\.md[\s\S]*agent_progress\.md[\s\S]*CV\.tex[\s\S]*assets\//, 'vercelignore excludes agent guidance, local ledger, and CV source assets from deploy uploads');
assert.match(verifyPublishSet, /temporary Vercel auth state/, 'publish-set checker blocks temporary Vercel auth directories if staged');
assert.match(verifyPublishSet, /function untrackedFiles\(\)/, 'publish-set checker includes untracked files that are not ignored');
assert.match(verifyPublishSet, /ls-files', '--others', '--exclude-standard'/, 'publish-set checker asks git for untracked publishable files');

for (const file of fs.readdirSync(wikiDir).filter((file) => file.endsWith('.md'))) {
  const data = frontmatterData(file);
  assert.ok(data.type, `${file} has explicit OKF type`);
  assert.ok(data.title, `${file} has explicit OKF title`);
  assert.ok(data.description, `${file} has explicit OKF description`);
  assert.ok(Array.isArray(data.tags) && data.tags.length > 0, `${file} has OKF tags`);
  assert.ok(data.timestamp, `${file} has OKF timestamp`);
}
assert.doesNotMatch(nextConfig, /output:\s*['"]export['"]/, 'Next config no longer forces static export');
assert.match(nextConfig, /X-Content-Type-Options'[\s\S]*nosniff[\s\S]*X-Frame-Options'[\s\S]*SAMEORIGIN[\s\S]*Referrer-Policy'[\s\S]*strict-origin-when-cross-origin[\s\S]*Permissions-Policy'/, 'Next config applies baseline browser security headers');
assert.equal(packageJson.engines?.node, '22.x', 'package.json pins the same Node major used by CI and production');
assert.equal(packageJson.dependencies?.next, '15.5.20', 'package.json pins the patched Next.js 15 release');
assert.equal(packageJson.overrides?.['js-yaml'], '3.15.0', 'package.json overrides the vulnerable transitive js-yaml release');
assert.match(wikiMarkdownTsx, /import remarkMath from 'remark-math';/, 'Markdown renderer imports remark-math');
assert.match(wikiMarkdownTsx, /import rehypeKatex from 'rehype-katex';/, 'Markdown renderer imports rehype-katex');
assert.match(wikiMarkdownTsx, /defaultUrlTransform/, 'Markdown renderer uses react-markdown URL sanitation explicitly');
assert.match(wikiMarkdownTsx, /function wikiUrlTransform\(value: string\)/, 'Markdown renderer centralizes URL protocol handling');
assert.match(wikiMarkdownTsx, /\^tel:/, 'Markdown renderer preserves telephone links instead of rewriting them to #');
assert.match(wikiMarkdownTsx, /urlTransform=\{wikiUrlTransform\}/, 'Markdown renderer passes the custom URL transform to ReactMarkdown');
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
assert.match(wikiLib, /type WikiPageOptions = \{ includeHidden\?: boolean \};/, 'wiki library keeps hidden-page access explicit for maintenance callers');
assert.match(wikiLib, /export function getPublicWikiSlugs\(\)/, 'wiki library exposes public wiki slugs for production routes');
assert.match(wikiLib, /const WIKI_SLUG_PATTERN = \/\^\[A-Za-z0-9_\\-\\u4e00-\\u9fff\]\+\$\/u;/, 'wiki library constrains route slugs to file-safe concept names');
assert.match(wikiLib, /export function isSafeWikiSlug\(slug: string\)/, 'wiki library exposes slug validation for route and link safety checks');
assert.match(wikiLib, /function wikiFilePath\(slug: string\)/, 'wiki library resolves wiki paths through one bounded helper');
assert.match(wikiLib, /path\.resolve\(WIKI_DIR, `\$\{slug\}\.md`\)/, 'wiki library resolves page files before reading them');
assert.match(wikiLib, /catch \{\s*return null;\s*\}/, 'wiki page loader rejects malformed encoded slugs');
assert.match(wikiLib, /if \(data\.hidden === true && !options\.includeHidden\) return null;/, 'wiki page loader blocks hidden pages by default');
assert.match(wikiLib, /preprocessWikiLinks\(markdown: string, options: \{ language\?: 'en' \| 'zh' \}/, 'wikilink preprocessing is language-aware');
assert.match(wikiLib, /function shouldPreserveResolvedTarget\(target: string, resolved: string, language: 'en' \| 'zh', label: string\)/, 'wikilink preprocessing can preserve explicit cross-language targets');
assert.match(wikiLib, /hasExplicitEnglishLabel\(label\)/, 'wikilink preprocessing preserves English links on Chinese pages when the label explicitly says English');
assert.match(wikiLib, /export type SearchIndexItem/, 'wiki library exposes a typed static search index item');
assert.match(wikiLib, /export function getSearchIndex\(\): SearchIndexItem\[\]/, 'wiki library builds a static search index from markdown pages');
assert.match(wikiLib, /plainText\(page\.content\)/, 'search index uses markdown body text, not only frontmatter');
assert.match(wikiLib, /text: text\.slice\(0, 2400\)/, 'search index bounds article body text to a compact client-search payload');
assert.match(wikiLib, /tags: string\[\]/, 'search index exposes page tags for downstream content consumers');
assert.match(wikiLib, /hidden\?: boolean/, 'wiki frontmatter supports hidden pages');
assert.match(wikiLib, /\.filter\(\(page\) => page\.data\.hidden !== true\)/, 'search index excludes hidden pages');
assert.match(searchIndexRoute, /dynamic = 'force-static'/, 'search index endpoint is generated as a static deployment asset');
assert.match(searchIndexRoute, /getSearchIndex\(\)/, 'search index endpoint is backed by the canonical wiki index builder');
assert.match(searchIndexRoute, /s-maxage=31536000/, 'search index endpoint is cacheable at the deployment edge');
assert.match(robotsRoute, /sitemap: 'https:\/\/xinbaopedia\.top\/sitemap\.xml'/, 'robots metadata points crawlers to the canonical sitemap');
assert.match(sitemapRoute, /getPublicWikiSlugs\(\)/, 'sitemap includes every public wiki route');
assert.match(sitemapRoute, /encodeURIComponent\(slug\)/, 'sitemap safely encodes wiki slugs');
assert.match(wikiPageTsx, /getPublicWikiSlugs\(\)\.map/, 'wiki route statically generates only public wiki pages');
assert.doesNotMatch(wikiPageTsx, /getAllWikiSlugs\(\)\.map/, 'wiki route does not statically generate hidden source pages');
assert.match(wikiPageTsx, /dynamicParams = true/, 'wiki route lets non-generated slugs reach explicit notFound handling');
assert.match(wikiPageTsx, /isChineseSlug\(page\.slug\)/, 'wiki page detects Chinese article slugs');
assert.match(wikiPageTsx, /preprocessWikiLinks\(page\.content, \{ language \}\)/, 'wiki page passes language into wikilink preprocessing');
assert.match(wikiPageTsx, /data-page-type=\{pageType\}/, 'wiki page exposes the OKF concept type for page-specific styling');
assert.match(wikiPageTsx, /<Infobox data=\{page\.data\} language=\{language\} \/>/, 'wiki page passes route language into the infobox chrome');
assert.match(wikiSearch, /'use client';/, 'wiki search is a client component');
assert.match(wikiSearch, /import \{ ChatWithXinbao \} from '@\/components\/ChatWithXinbao';/, 'wiki search imports Chat with Xinbao');
assert.match(wikiSearch, /\/search-index\.json/, 'wiki search fetches the static search index only from the same-site endpoint');
assert.match(wikiSearch, /searchIndexPromise \?\?= fetch/, 'wiki search shares one cached in-browser search-index request');
assert.match(wikiSearch, /onFocus=\{\(\) => \{[\s\S]*void loadItems\(\);/, 'wiki search loads its index only when a user interacts with the input');
assert.doesNotMatch(wikiSearch, /items: SearchIndexItem\[\];/, 'wiki search no longer requires the full index as a server-rendered prop');
assert.match(wikiSearch, /const searchCopy = \{[\s\S]*en: \{[\s\S]*submit: 'Search'[\s\S]*zh: \{[\s\S]*submit: '搜索'/, 'wiki search localizes its visible search chrome');
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
assert.match(chatWithXinbao, /dynamic\([\s\S]*ChatWithXinbaoPanel[\s\S]*ssr: false/, 'Chat with Xinbao dynamically loads its heavy panel on the client');
assert.match(chatWithXinbao, /const \[hasOpened, setHasOpened\] = useState\(false\)/, 'Chat with Xinbao does not mount the heavy panel before the first user click');
assert.match(chatWithXinbaoPanel, /import \{ createPortal \} from 'react-dom';/, 'Chat with Xinbao uses a React portal for the floating panel');
assert.match(chatWithXinbaoPanel, /const \[mounted, setMounted\] = useState\(false\);[\s\S]*useEffect\(\(\) => \{[\s\S]*setMounted\(true\);[\s\S]*\}, \[\]\);/, 'Chat with Xinbao waits for the client before accessing document.body');
assert.match(chatWithXinbaoPanel, /return createPortal\([\s\S]*chat-xinbao-minimized[\s\S]*chat-xinbao-shell[\s\S]*document\.body/, 'Chat with Xinbao keeps the minimized and expanded panels in one shared portal layer');
assert.match(articleTabs, /usePathname/, 'article tools derive the active page from the current route');
assert.match(articleTabs, /href="#"/, 'active Article tab uses the Colarpedia inert article link');
assert.match(articleTabs, /article: 'Article'[\s\S]*article: '条目'/, 'article tools localize the active article label');
assert.match(articleTabs, /source: 'View source'[\s\S]*source: '查看源代码'/, 'article tools localize the source label');
assert.match(articleTabs, /history: 'History'[\s\S]*history: '历史'/, 'article tools localize the history label');
assert.match(articleTabs, /issues\/new\?title=/, 'Talk links directly to GitHub new issue creation');
assert.match(articleTabs, /Talk: \$\{slug\}/, 'Talk issue title is page-specific');
assert.match(articleTabs, /const source = GITHUB_BASE;/, 'View source opens the repository root');
assert.doesNotMatch(articleTabs, /const source = `\$\{GITHUB_BASE\}\/edit\/main\/wiki\//, 'View source no longer opens a page-specific edit URL');
assert.match(articleTabs, /commits\/main\/wiki\/\$\{encodeURIComponent\(fileName\)\}/, 'History opens the current markdown page commits');

assert.match(chatWithXinbao, /'use client';/, 'Chat with Xinbao is a client component');
assert.match(chatWithXinbaoPanel, /import ReactMarkdown from 'react-markdown';/, 'chat panel renders assistant replies with ReactMarkdown');
assert.match(chatWithXinbaoPanel, /import rehypeKatex from 'rehype-katex';/, 'chat panel imports KaTeX rendering for formulas');
assert.match(chatWithXinbaoPanel, /import remarkMath from 'remark-math';/, 'chat panel imports math parsing for formulas');
assert.match(chatWithXinbaoPanel, /function ChatMessageContent/, 'chat panel isolates message markdown rendering');
assert.match(chatWithXinbaoPanel, /message\.role === 'assistant'/, 'chat panel renders assistant messages as markdown while keeping user messages plain');
assert.match(chatWithXinbaoPanel, /remarkPlugins=\{\[remarkGfm, remarkMath\]\}/, 'chat panel enables GFM and math parsing for assistant replies');
assert.match(chatWithXinbaoPanel, /rehypePlugins=\{\[rehypeKatex\]\}/, 'chat panel enables KaTeX output for assistant replies');
assert.match(chatWithXinbaoPanel, /Chat with Xinbao/, 'chat window uses the required title');
assert.match(chatWithXinbaoPanel, /MAX_INPUT_LENGTH = 1000/, 'chat client caps input length at 1000 characters');
assert.match(chatWithXinbaoPanel, /\/api\/chat-with-xinbao/, 'chat client calls only the same-site API route');
assert.match(chatWithXinbaoPanel, /method: 'GET'/, 'chat client refreshes quota from the backend when the chat opens');
assert.match(chatWithXinbaoPanel, /remaining.*limit/s, 'chat client displays remaining daily quota');
assert.match(chatWithXinbaoPanel, /quotaUnknown: '10 messages\/day'/, 'chat client English quota fallback uses the 10-message daily limit');
assert.match(chatWithXinbaoPanel, /quotaUnknown: '每天 10 条消息'/, 'chat client Chinese quota fallback uses the 10-message daily limit');
assert.match(chatWithXinbaoPanel, /useState\(10\)/, 'chat client initializes the quota display to 10');
assert.match(chatWithXinbaoPanel, /Questions may be logged to improve answers\./, 'chat client discloses English question logging');
assert.match(chatWithXinbaoPanel, /问题可能会被记录，用于改进回答。/, 'chat client discloses Chinese question logging');
assert.match(chatWithXinbaoPanel, /Xinbao AI is temporarily unavailable\. Please try again later\./, 'chat client uses a generic model-error message');
assert.match(chatWithXinbaoPanel, /language: Language/, 'chat client localizes UI from current wiki language');
assert.match(chatWithXinbaoPanel, /Xinbaopedia chat assistant[\s\S]*CV\/résumé[\s\S]*short, grounded[\s\S]*wiki does not have enough evidence/, 'chat client English greeting is natural, action-oriented, and evidence-bounded');
assert.match(chatWithXinbaoPanel, /想快速了解乔鑫宝[\s\S]*研究方向、论文、项目、简历和联系方式[\s\S]*说人话[\s\S]*不硬编/, 'chat client Chinese greeting is natural, action-oriented, and evidence-bounded');
assert.doesNotMatch(chatWithXinbaoPanel, /digital-proxy skill distilled|蒸馏出来的数字分身 skill|哈基米 energy|讲清楚喵~/, 'chat client no longer uses forced technical persona language in the opening experience');
assert.match(chatWithXinbaoPanel, /Checking Xinbaopedia notes[\s\S]*Looking through public pages[\s\S]*Almost there/, 'chat client includes varied English typing messages');
assert.match(chatWithXinbaoPanel, /正在查公开资料[\s\S]*正在整理相关页面[\s\S]*先看资料，不硬编[\s\S]*马上整理好/, 'chat client includes natural Chinese typing messages');
assert.match(chatWithXinbaoPanel, /function randomTypingMessage[\s\S]*Math\.random\(\)[\s\S]*setTypingMessage\(randomTypingMessage\(strings\.typing\)\)/, 'chat client randomly selects one typing message per request');
assert.doesNotMatch(`${chatWithXinbao}\n${chatWithXinbaoPanel}`, /YUNWU_API_KEY|UPSTASH_REDIS_REST_TOKEN|api\.yunwu|Bearer/, 'chat client contains no backend key names or provider endpoint');
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
assert.match(chatRoute, /const pipeline = redis\.pipeline\(\);[\s\S]*pipeline\.lpush\(QUESTION_LOG_RECENT_KEY[\s\S]*pipeline\.ltrim\(QUESTION_LOG_RECENT_KEY[\s\S]*pipeline\.expire\(QUESTION_LOG_RECENT_KEY, retentionTtl\)[\s\S]*pipeline\.zincrby\(frequencyKey[\s\S]*pipeline\.expire\(frequencyKey, retentionTtl\)[\s\S]*pipeline\.exec\(\)/, 'chat API pipelines and expires recent, daily, and frequency question logs');
assert.match(chatRoute, /sanitizeRefererPath\(request\)/, 'chat API records only a sanitized page path for question logs');
assert.match(chatRoute, /after\(\(\) => recordQuestionLog/, 'chat API defers question-log writes until after the response lifecycle');
assert.match(chatRoute, /reserveDailyUsage[\s\S]*redis\.eval<[\s\S]*highest >= tonumber\(ARGV\[2\]\) then return tonumber\(ARGV\[2\]\) \+ 1/, 'chat API atomically reserves daily quota and returns a rejection sentinel at the limit');
assert.match(chatRoute, /refundDailyUsage[\s\S]*model response status[\s\S]*refundDailyUsage[\s\S]*empty model reply[\s\S]*refundDailyUsage/, 'chat API refunds quota when the model request does not produce a usable answer');
assert.match(chatRoute, /Cache-Control', 'private, no-store'/, 'chat quota and reply responses explicitly disable shared caching');
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
assert.match(chatQuestionsRoute, /Cache-Control': 'private, no-store'/, 'question-log export responses explicitly disable caching');
assert.doesNotMatch(chatQuestionsRoute, /console\.log|console\.error|YUNWU_API_KEY/, 'question-log export route does not log or reference unrelated model secrets');
assert.match(chatKnowledge, /import 'server-only';/, 'chat knowledge builder is server-only');
assert.match(chatKnowledge, /project\.md/, 'chat knowledge builder can prioritize project.md if it is added later');
assert.match(chatKnowledge, /wiki'\)/, 'chat knowledge builder reads the local wiki directory');
assert.match(chatKnowledge, /Xinbao_Qiao[\s\S]*Qiao_Xinbao_zh[\s\S]*Projects[\s\S]*Research[\s\S]*Publications[\s\S]*CV[\s\S]*Internet_Slang_2026/, 'chat knowledge builder prioritizes homepage, projects, research, publications, CV, and yearly slang pages');
assert.doesNotMatch(chatKnowledge, /Learn_What_Matters_Data_Pruning_for_Efficient_Decentralized_Learning/, 'chat knowledge builder does not prioritize the hidden under-review manuscript');
assert.match(chatKnowledge, /academic homepage chat assistant/, 'persona identifies the assistant as a homepage chat assistant');
assert.match(chatKnowledge, /do not call yourself a distilled skill or digital persona in normal greetings/, 'persona prevents forced technical identity labels in normal greetings');
assert.match(chatKnowledge, /English self-introductions[\s\S]*Xinbaopedia chat assistant[\s\S]*wiki does not have enough evidence/, 'persona documents a natural English self-introduction');
assert.match(chatKnowledge, /Accepted user questions may be logged server-side/, 'persona transparently explains question logging when asked');
assert.match(chatKnowledge, /chat history, raw IPs, system prompts, and API keys are not stored/, 'persona documents what question logging must not claim to store');
assert.match(chatKnowledge, /想快速了解乔鑫宝可以直接问我[\s\S]*我会尽量说人话[\s\S]*先看资料不硬编/, 'persona supports natural Chinese opening phrasing without encouraging unsupported claims');
assert.match(chatKnowledge, /家人们[\s\S]*先别急[\s\S]*这题我会[\s\S]*有一说一[\s\S]*包的[\s\S]*主打一个资料准[\s\S]*不硬编/s, 'persona supports a small Chinese casual expression pool without encouraging unsupported claims');
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
assert.match(chatPersona, /homepage chat assistant[\s\S]*not claim to be the real Xinbao Qiao[\s\S]*do not call yourself a distilled skill or digital persona/, 'persona prompt template documents homepage-assistant identity with technical-label boundaries');
assert.match(chatPersona, /do not repeat one fixed meme[\s\S]*想快速了解乔鑫宝可以直接问我[\s\S]*我会尽量说人话[\s\S]*主打一个资料准[\s\S]*never use memes to cover missing evidence/, 'persona prompt template documents natural casual wording with factual boundaries');
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
assert.match(internetSlang2026, /human homepage assistant[\s\S]*not a technical identity label[\s\S]*CV\/résumé[\s\S]*avoid `distilled skill`, `digital proxy`/, 'English 2026 slang page keeps greeting rules natural and action-oriented');
assert.match(internetSlang2026Zh, /2026热梗[\s\S]*先准确，再有趣[\s\S]*句式梗与抽象表达[\s\S]*AI人格[\s\S]*之前已经从聊天语气中移除的旧词继续保持不用/, 'Chinese 2026 slang page documents current slang categories and omitted older phrasing');
assert.match(internetSlang2026Zh, /LingoAce[\s\S]*悟空教育[\s\S]*千瓜数据[\s\S]*RedNoteMeme[\s\S]*Stellar Chinese/, 'Chinese 2026 slang page cites current public slang sources');
assert.match(internetSlang2026Zh, /像主页问答助手的自然开场[\s\S]*不确定的地方不硬编[\s\S]*想快速了解乔鑫宝/, 'Chinese 2026 slang page keeps greeting rules natural and action-oriented');
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
assert.match(sidebar, /'use client';/, 'sidebar can read the current route language');
assert.match(sidebar, /usePathname/, 'sidebar derives language from the current route');
assert.match(sidebar, /<aside className="wiki-sidebar" aria-label=\{sectionLabels\.navigation\[language\]\}>/, 'sidebar localizes the navigation aria label');
assert.doesNotMatch(sidebar, /function NavSection|className="nav-section"|<section className="nav-section">/, 'sidebar uses flat Colarpedia h4 plus ul blocks');
assert.match(sidebar, /const navigation = \['Xinbao_Qiao', 'Publications'\]/, 'sidebar navigation includes the main page and Publications');
assert.doesNotMatch(sidebar, /Research Atlas|研究图谱|\/atlas/, 'sidebar removes the retired Research Atlas entry');
assert.match(sidebar, /Xinbao_Qiao: \{ en: 'Main page', zh: '主页' \}/, 'sidebar keeps the homepage label compact and localized');
assert.match(sidebar, /navigation: \{ en: 'Navigation', zh: '导航' \}[\s\S]*researchTopics: \{ en: 'Research topics', zh: '研究主题' \}[\s\S]*education: \{ en: 'Education', zh: '教育经历' \}[\s\S]*experience: \{ en: 'Experience', zh: '研究经历' \}[\s\S]*contribute: \{ en: 'Contribute', zh: '链接' \}/, 'sidebar places Experience after Education and localizes section headings');
assert.doesNotMatch(sidebar, /Source repository/, 'sidebar contribute links avoid the source repository label');
assert.doesNotMatch(sidebar, /OpenReview profile/, 'sidebar contribute avoids non-Colarpedia sidebar labels');
assert.match(sidebar, /LinkedIn[\s\S]*sectionLabels\.email\[language\]/, 'sidebar contribute mirrors Colarpedia with LinkedIn before email');
assert.doesNotMatch(sidebar, /className="external" href="mailto:/, 'email link is not styled as an external link');
for (const shortLabel of ['CUHK', 'NUSRI-CQ', 'ZJU', 'SDU']) {
  assert.match(sidebar, new RegExp(`en: '${shortLabel}'`), `sidebar uses short label ${shortLabel}`);
}
assert.match(sidebar, /AI_and_Networks: \{ en: 'AI and Networks', zh: 'AI 与网络' \}/, 'sidebar labels AI and Networks as a short topic');
assert.match(sidebar, /Synthetic_Data_and_Model_Collapse: \{ en: 'Synthetic Data', zh: '合成数据' \}/, 'sidebar shortens synthetic-data topic');
assert.match(sidebar, /Data_Centric_Machine_Learning: \{ en: 'Data Centric ML', zh: '数据中心 ML' \}/, 'sidebar shortens data-centric topic');
assert.match(sidebar, /function localizedSlug\(slug: string, language: SidebarLanguage\)/, 'sidebar builds localized article links');
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
assert.match(zhHome, /英文名：\*\*Xinbao Qiao\*\*\[\^xinbao-name-zh\]\[\^qiao-ciao-zh\]\[\^xinbao-qiao-bridge-zh\]/, 'Chinese biography identifies and annotates the English name');
assert.doesNotMatch(zhHome, /英文发表名/, 'Chinese biography avoids implying a separate publication-only name');
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

const acceptedPublicationChinesePages = [
  'When_Sample_Selection_Bias_Precipitates_Model_Collapse_zh.md',
  'Soft_Weighted_Machine_Unlearning_zh.md',
  'Hessian_Free_Online_Certified_Unlearning_zh.md',
  'DynFrs_zh.md'
];

for (const page of acceptedPublicationPages) {
  const fm = frontmatter(page);
  const body = read(page);
  assert.match(body, /\*\*\[\[Xinbao_Qiao\|Xinbao Qiao\]\]\*\*/, `${page} bolds Xinbao Qiao in the article author line`);
  assert.doesNotMatch(fm, /^categories:/m, `${page} publication infobox omits categories`);
  assert.match(fm, /^location:/m, `${page} publication infobox includes conference location`);
  assert.doesNotMatch(fm, /owner-provided|author notification|published on OpenReview|presentation listed|arXiv submitted/i, `${page} publication status row stays concise`);
  for (const section of ['## Overview', '## Method', '## Key takeaways', '## Results', '## Placement']) {
    assert.match(body, new RegExp(`^${section}$`, 'm'), `${page} has ${section}`);
  }
  assert.doesNotMatch(body, /^## Key formula$/m, `${page} replaces formula exposition with insight-oriented takeaways`);
  assert.doesNotMatch(body, /```text\n[\s\S]*?```/, `${page} uses rendered math instead of text code formulas`);
  assert.doesNotMatch(body, /\\\(|\\\)/, `${page} uses dollar-delimited inline math compatible with remark-math`);
  assert.match(body, /^- \*\*[^*]+\*\* /m, `${page} states bold, scannable takeaway claims`);
}

for (const page of acceptedPublicationChinesePages) {
  const fm = frontmatter(page);
  const body = read(page);
  assert.doesNotMatch(fm, /^categories:/m, `${page} publication infobox omits categories`);
  assert.match(fm, /^location:/m, `${page} publication infobox includes conference location`);
  assert.doesNotMatch(fm, /owner-provided|author notification|published on OpenReview|presentation listed|arXiv submitted/i, `${page} publication status row stays concise`);
  for (const section of ['## 概述', '## 方法', '## 关键启示', '## 结果', '## 定位']) {
    assert.match(body, new RegExp(`^${section}$`, 'm'), `${page} has ${section}`);
  }
  assert.doesNotMatch(body, /^## 关键公式$/m, `${page} replaces formula exposition with insight-oriented takeaways`);
  assert.doesNotMatch(body, /```text\n[\s\S]*?```/, `${page} avoids text code formulas`);
  assert.doesNotMatch(body, /\\\(|\\\)/, `${page} uses dollar-delimited inline math compatible with remark-math`);
  assert.match(body, /^- \*\*[^*]+\*\* /m, `${page} states bold, scannable takeaway claims`);
}

assert.match(read('Learn_What_Matters_Data_Pruning_for_Efficient_Decentralized_Learning.md'), /\*\*Xinbao Qiao\*\*/, 'under-review publication page bolds Xinbao Qiao in the author context');

const mengZhang = read('Meng_Zhang.md');
const angelaZhang = read('Angela_Yingjun_Zhang.md');
const angelaZhangZh = read('Angela_Yingjun_Zhang_zh.md');
assert.match(mengZhang, /https:\/\/person\.zju\.edu\.cn\/mengzhang/, 'Meng Zhang page cites the official ZJU profile');
assert.match(mengZhang, /ZJU-UIUC Institute/, 'Meng Zhang page identifies the ZJU-UIUC Institute affiliation');
assert.match(mengZhang, /wireless and computer networks[\s\S]*edge intelligence[\s\S]*network economics[\s\S]*intelligent IoT/i, 'Meng Zhang page summarizes official research areas');
assert.match(mengZhang, /\[\[Xinbao_Qiao\|Xinbao Qiao\]\]/, 'Meng Zhang page connects to Qiao');
assert.match(angelaZhang, /https:\/\/staff\.ie\.cuhk\.edu\.hk\/~yjzhang\//, 'Angela Yingjun Zhang page cites the official CUHK profile');
assert.match(angelaZhang, /Professor[\s\S]*Department of Information Engineering[\s\S]*The Chinese University of Hong Kong/, 'Angela Yingjun Zhang page identifies CUHK IE affiliation');
assert.match(angelaZhang, /IEEE Fellow/, 'Angela Yingjun Zhang page records IEEE Fellow status');
assert.match(angelaZhang, /5G and 6G/, 'Angela Yingjun Zhang page summarizes official research interests');
assert.match(angelaZhang, /\[\[Xinbao_Qiao\|Xinbao Qiao\]\]/, 'Angela Yingjun Zhang page connects to Qiao');
assert.equal(frontmatterData('Angela_Yingjun_Zhang_zh.md').title, '张颖珺', 'Chinese advisor page uses Zhang Yingjun\'s Chinese name as its title');
assert.equal(frontmatterData('Angela_Yingjun_Zhang_zh.md').name, '张颖珺', 'Chinese advisor infobox uses Zhang Yingjun\'s Chinese name');
assert.match(angelaZhangZh, /\*\*张颖珺\*\*是香港中文大学信息工程系教授/, 'Chinese advisor biography uses 张颖珺 in prose');
for (const page of ['Qiao_Xinbao_zh.md', 'Education_zh.md', 'Experience_zh.md', 'CV_zh.md', 'The_Chinese_University_of_Hong_Kong_zh.md', 'index_zh.md']) {
  assert.doesNotMatch(read(page), /Angela Yingjun Zhang/, `${page} does not expose the English advisor name in Chinese prose`);
  assert.match(read(page), /张颖珺/, `${page} uses the advisor's Chinese name`);
}

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

const publicationImages = (page) => [...read(page).matchAll(/!\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1]);
assert.match(read('When_Sample_Selection_Bias_Precipitates_Model_Collapse.md'), /!\[[^\]]+\]\(\/papers\/model-collapse\/poster\.png\)/, 'model-collapse paper page includes poster image');
assert.match(read('When_Sample_Selection_Bias_Precipitates_Model_Collapse.md'), /!\[[^\]]+\]\(\/papers\/model-collapse\/teaser\.png\)/, 'model-collapse paper page displays a local teaser figure');
assert.match(read('DynFrs.md'), /!\[[^\]]+\]\(\/papers\/dynfrs\/lazy-tags\.png\)/, 'DynFrs paper page displays a figure');
assert.match(read('Hessian_Free_Online_Certified_Unlearning.md'), /!\[[^\]]+\]\(\/papers\/hessian-free\/poster\.png\)/, 'Hessian-free paper page includes poster image');
assert.match(read('DynFrs.md'), /!\[[^\]]+\]\(\/papers\/dynfrs\/poster\.png\)/, 'DynFrs paper page includes poster image');
assert.match(read('Soft_Weighted_Machine_Unlearning.md'), /!\[[^\]]+\]\(\/papers\/soft-weighted\/poster\.png\)/, 'soft-weighted paper page includes poster image');
assert.match(read('Soft_Weighted_Machine_Unlearning.md'), /!\[[^\]]+\]\(\/papers\/soft-weighted\/framework\.png\)/, 'soft-weighted paper page includes framework image');
assert.deepEqual(publicationImages('When_Sample_Selection_Bias_Precipitates_Model_Collapse.md'), ['/papers/model-collapse/poster.png', '/papers/model-collapse/teaser.png'], 'model-collapse paper places the poster before the overview teaser');
assert.deepEqual(publicationImages('Hessian_Free_Online_Certified_Unlearning.md'), ['/papers/hessian-free/poster.png'], 'Hessian-free paper removes the experimental curve and keeps only the poster');
assert.deepEqual(publicationImages('DynFrs.md'), ['/papers/dynfrs/poster.png', '/papers/dynfrs/lazy-tags.png'], 'DynFrs paper places the poster before the method schematic');
assert.deepEqual(publicationImages('Soft_Weighted_Machine_Unlearning.md'), ['/papers/soft-weighted/poster.png', '/papers/soft-weighted/framework.png'], 'soft-weighted paper places the poster before the framework schematic');
assert.match(read('When_Sample_Selection_Bias_Precipitates_Model_Collapse.md'), /\/papers\/model-collapse\/poster\.png\)[\s\S]*## Overview[\s\S]*\/papers\/model-collapse\/teaser\.png\)/, 'model-collapse paper separates the poster from the teaser with overview text');
assert.match(read('Soft_Weighted_Machine_Unlearning.md'), /\/papers\/soft-weighted\/poster\.png\)[\s\S]*## Overview[\s\S]*## Method[\s\S]*\/papers\/soft-weighted\/framework\.png\)/, 'soft-weighted paper separates the poster from the framework schematic with article text');
for (const page of ['When_Sample_Selection_Bias_Precipitates_Model_Collapse.md', 'DynFrs.md', 'Soft_Weighted_Machine_Unlearning.md']) {
  assert.doesNotMatch(read(page), /poster\.png\)\n\n!\[[^\]]+\]\(\/papers\//, `${page} does not place a non-poster figure immediately after the poster`);
}
for (const [page, expectedCount] of Object.entries({
  'When_Sample_Selection_Bias_Precipitates_Model_Collapse.md': 2,
  'When_Sample_Selection_Bias_Precipitates_Model_Collapse_zh.md': 2,
  'Hessian_Free_Online_Certified_Unlearning.md': 1,
  'Hessian_Free_Online_Certified_Unlearning_zh.md': 1,
  'DynFrs.md': 2,
  'DynFrs_zh.md': 2,
  'Soft_Weighted_Machine_Unlearning.md': 2,
  'Soft_Weighted_Machine_Unlearning_zh.md': 2,
})) {
  const images = publicationImages(page);
  assert.equal(images.length, expectedCount, `${page} keeps only overview and poster-class publication images`);
  assert.ok(images.every((image) => !/fid-trends-combined|class-proportions-trend|barycenter-methodology|mia-tradeoff|sec-5-1-1|hessian-free\/ours/.test(image)), `${page} omits detailed result-gallery images`);
}

const infobox = fs.readFileSync(path.join(root, 'components/Infobox.tsx'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'app/globals.css'), 'utf8');
const homePage = fs.readFileSync(path.join(root, 'app/page.tsx'), 'utf8');
const homepagePortal = fs.readFileSync(path.join(root, 'components/HomepagePortal.tsx'), 'utf8');
assert.doesNotMatch(styles, /research-atlas|wiki-portal-atlas/, 'retired Research Atlas styles are removed');
assert.doesNotMatch(styles, /\.wiki-logo-mark/, 'topbar CSS does not keep custom logo-image styling');
assert.match(styles, /\.wiki-tabs-inner \{[\s\S]*padding: 0 24px 0 calc\(24px \+ var\(--sidebar-width\) \+ 24px\);[\s\S]*\}/, 'article tabs align with the main article column after the sidebar');
assert.match(styles, /\.wiki-shell \{[\s\S]*grid-template-columns: var\(--sidebar-width\) minmax\(0, var\(--content-width\)\);[\s\S]*gap: 24px;[\s\S]*\}/, 'article shell uses a fixed navigation column and constrained readable article column');
assert.match(styles, /\.wiki-sidebar \{[\s\S]*position: sticky;[\s\S]*top: 14px;[\s\S]*\}/, 'article navigation stays available in a Wikipedia-style left rail');
assert.match(styles, /\.wiki-page \{[\s\S]*overflow-wrap: break-word;[\s\S]*\}/, 'article pages protect long labels and links from breaking the layout');
assert.match(styles, /\.wiki-main:has\(\.wiki-portal\) \{[\s\S]*grid-column: 1 \/ -1;[\s\S]*max-width: 100%;[\s\S]*\}/, 'homepage main content spans the hidden sidebar grid column');
assert.match(styles, /\.wiki-page\[data-page-type="publication"\] \.wiki-title \{[\s\S]*white-space: nowrap;[\s\S]*font-size: 1\.56em;[\s\S]*\}/, 'publication article titles stay on one line on desktop');
assert.match(styles, /\.wiki-page\[data-page-type="publication"\] \.wiki-title \{[\s\S]*font-size: 1\.08em;[\s\S]*\}/, 'publication article titles use a compact single-line size on mobile');
assert.match(styles, /\.wiki-main table \{[\s\S]*max-width: 100%;[\s\S]*\}/, 'article tables stay constrained inside the article column');
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
assert.match(styles, /\.wiki-portal-name \{[\s\S]*font-family: var\(--font-signature\);[\s\S]*font-size: 124px;[\s\S]*\}/, 'homepage starts directly with a logo-sized Xinbao Qiao in the Alex Brush signature face');
assert.match(styles, /\.wiki-portal-name-button \{[\s\S]*appearance: none;[\s\S]*-webkit-appearance: none;[\s\S]*display: inline-grid;[\s\S]*place-items: center;[\s\S]*max-width: min\(620px, 86vw\);[\s\S]*font: inherit;[\s\S]*cursor: pointer;[\s\S]*user-select: none;[\s\S]*-webkit-tap-highlight-color: transparent;[\s\S]*\}/, 'homepage signature name removes native button chrome while centering the themed logo or text');
assert.match(styles, /\.wiki-portal-name-text \{[\s\S]*max-width: 100%;[\s\S]*line-height: \.95;[\s\S]*white-space: nowrap;[\s\S]*\}/, 'homepage pure text signature stays centered inside the shared wordmark box');
assert.match(styles, /\.site-palette-text \{[\s\S]*linear-gradient\(135deg,[\s\S]*#202122[\s\S]*\}/, 'site palette switcher includes a compact text-theme swatch');
assert.match(styles, /\.wiki-portal-name-logo \{[\s\S]*display: none;[\s\S]*width: 100%;[\s\S]*height: auto;[\s\S]*max-height: 124px;[\s\S]*object-fit: contain;[\s\S]*\}/, 'homepage themed logo images use responsive cropped image sizing');
assert.match(styles, /\.wiki-main \.wiki-portal-name-logo \{[\s\S]*border: 0;[\s\S]*outline: 0;[\s\S]*background: transparent;[\s\S]*box-shadow: none;[\s\S]*margin: 0;[\s\S]*\}/, 'homepage themed logo images override article image borders and background');
assert.match(styles, /html\[data-site-palette="blue"\] \.wiki-portal-name-text,[\s\S]*html\[data-site-palette="charcoal"\] \.wiki-portal-name-text \{[\s\S]*display: none;[\s\S]*\}/, 'homepage hides the pure text name when a color logo theme is active');
assert.match(styles, /html\[data-site-palette="blue"\] \.wiki-portal-name-logo-blue,[\s\S]*html\[data-site-palette="gold"\] \.wiki-portal-name-logo-gold,[\s\S]*html\[data-site-palette="green"\] \.wiki-portal-name-logo-green,[\s\S]*html\[data-site-palette="charcoal"\] \.wiki-portal-name-logo-charcoal \{[\s\S]*display: block;[\s\S]*\}/, 'homepage displays the matching color logo for each theme');
const signatureInteractionStyle = styles.match(/\.wiki-portal-name-button:hover,[\s\S]*\.wiki-portal-name-button:active \{([\s\S]*?)\}/);
assert.ok(signatureInteractionStyle, 'homepage signature interaction style block exists');
assert.match(signatureInteractionStyle[1], /border: 0;[\s\S]*outline: 0;[\s\S]*background: transparent;[\s\S]*box-shadow: none;/, 'homepage signature button removes the long rectangular browser frame in every interaction state');
assert.match(styles, /\.wiki-portal-name-button::-moz-focus-inner \{[\s\S]*padding: 0;[\s\S]*border: 0;[\s\S]*\}/, 'homepage signature button removes Firefox inner focus border');
assert.match(styles, /@media \(max-width: 720px\) \{[\s\S]*\.wiki-portal-name \{[\s\S]*font-size: 84px;[\s\S]*\}/, 'homepage keeps the pure text signature compact on mobile');
assert.match(styles, /@media \(max-width: 420px\) \{[\s\S]*\.wiki-portal-name \{[\s\S]*font-size: 72px;[\s\S]*\}[\s\S]*\}[\s\S]*@media \(max-width: 360px\) \{[\s\S]*\.wiki-portal-name \{[\s\S]*font-size: 64px;[\s\S]*\}/, 'homepage pure text signature has fixed small-screen sizes to avoid overflow');
assert.match(styles, /\.wiki-portal-name-text \{[\s\S]*animation: wiki-name-write 2\.4s cubic-bezier\(\.33, 0, \.2, 1\) \.12s both;[\s\S]*color: var\(--signature-ink\);[\s\S]*\}/, 'homepage name reveal uses a deliberately slower handwriting-like animation speed without image chrome');
assert.match(styles, /@supports \(\(background-clip: text\) or \(-webkit-background-clip: text\)\) \{[\s\S]*\.wiki-portal-name-text \{[\s\S]*background-size: 100% 100%;[\s\S]*-webkit-background-clip: text;[\s\S]*background-clip: text;[\s\S]*-webkit-text-fill-color: transparent;[\s\S]*\}/, 'homepage name uses a text-ink reveal instead of a clipped rectangle');
assert.match(styles, /@keyframes wiki-name-write \{[\s\S]*background-size: 0% 100%;[\s\S]*background-size: 100% 100%;[\s\S]*\}/, 'homepage name writes left to right by filling text ink');
assert.doesNotMatch(styles, /\.wiki-portal-name-text \{[\s\S]*clip-path|@keyframes wiki-name-write \{[\s\S]*clip-path/, 'homepage name reveal avoids clip-path rectangles that can look like a border');
assert.match(styles, /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*\.wiki-portal-name-text,[\s\S]*\.wiki-portal-collapsed \{[\s\S]*animation: none;[\s\S]*\}/, 'homepage name reveal animation honors reduced-motion settings');
assert.doesNotMatch(styles, /\.wiki-portal-emblem/, 'homepage no longer styles an in-page portal icon');
assert.match(styles, /\.wiki-search-portal input \{[\s\S]*height: 44px;[\s\S]*font-size: 16px;[\s\S]*\}/, 'homepage search input is larger than the topbar search');
assert.match(styles, /\.wiki-search-portal \.wiki-search-language-select \{[\s\S]*width: 112px;[\s\S]*height: 44px;[\s\S]*\}/, 'homepage search includes a language selector');
assert.match(styles, /\.wiki-search \{[\s\S]*--wiki-search-control-size: 32px;[\s\S]*\}/, 'shared search chrome defines the default square Chat with Xinbao trigger size');
assert.match(styles, /\.wiki-search-portal \{[\s\S]*--wiki-search-control-size: 44px;[\s\S]*\}/, 'homepage search makes the square Chat with Xinbao trigger match the 44px search bar');
assert.match(styles, /\.chat-xinbao-trigger \{[\s\S]*width: var\(--wiki-search-control-size\);[\s\S]*height: var\(--wiki-search-control-size\);[\s\S]*flex: 0 0 var\(--wiki-search-control-size\);[\s\S]*\}/, 'Chat with Xinbao trigger keeps a square footprint tied to the active search control height');
assert.doesNotMatch(styles, /\.wiki-search-portal \.chat-xinbao-trigger/, 'homepage uses the shared Chat with Xinbao trigger template instead of a portal-specific one');
assert.match(styles, /\.chat-xinbao-shell \{[\s\S]*border-radius: 8px;[\s\S]*box-shadow: 0 18px 48px[\s\S]*\}/, 'Chat with Xinbao opens as a polished rounded floating panel');
assert.match(styles, /\.chat-xinbao-message \{[\s\S]*border-radius: 8px;[\s\S]*\}/, 'Chat with Xinbao message bubbles have a cleaner shape');
assert.match(styles, /\.chat-xinbao-composer button \{[\s\S]*background: #36c;[\s\S]*color: #ffffff;[\s\S]*\}/, 'Chat with Xinbao send button uses the wiki accent as a clear action');
assert.match(styles, /\.wiki-portal-editions \{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);[\s\S]*\}/, 'homepage moves profile language entries below the search');
assert.match(styles, /\.wiki-portal-directory summary \{[\s\S]*display: flex;[\s\S]*cursor: pointer;[\s\S]*\}/, 'homepage browse directory is collapsible');
assert.match(styles, /\.wiki-portal-directory summary span::after \{[\s\S]*content: "▸";[\s\S]*margin-left: 8px;[\s\S]*color: currentColor;[\s\S]*font-size: 19px;[\s\S]*font-weight: 700;[\s\S]*\}/, 'homepage browse disclosure uses a prominent right-pointing triangle when collapsed');
assert.match(styles, /\.wiki-portal-directory\[open\] summary span::after \{[\s\S]*rotate\(90deg\);[\s\S]*\}/, 'homepage browse disclosure smoothly rotates its triangle downward when expanded');
assert.doesNotMatch(styles, /\.wiki-portal-directory summary::before|\.wiki-portal-directory summary::after/, 'homepage browse heading avoids decorative horizontal rules');
assert.match(styles, /\.wiki-shell:has\(\.wiki-portal\) \{[\s\S]*min-height: 100svh;[\s\S]*transition: padding \.24s ease;[\s\S]*\}/, 'homepage portal shell has a viewport-aware animated layout container');
assert.match(styles, /\.wiki-shell:has\(\.wiki-portal-collapsed\) \{[\s\S]*place-items: center;[\s\S]*\}/, 'homepage centers the portal when every collapsible section is closed');
assert.match(styles, /\.wiki-portal-collapsed \{[\s\S]*animation: wiki-portal-recenter \.26s ease-out;[\s\S]*transform: translateY\(-2vh\);[\s\S]*\}/, 'homepage collapsed state animates the portal toward the page center');
assert.match(styles, /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*\.wiki-portal-collapsed[\s\S]*animation: none;[\s\S]*\.wiki-portal-collapsed \{[\s\S]*transform: none;[\s\S]*\}[\s\S]*\}/, 'homepage collapsed-state animation honors reduced-motion settings');
assert.match(styles, /\.wiki-portal-block \{[\s\S]*--portal-section-accent: #36c;[\s\S]*min-width: 0;[\s\S]*\}/, 'homepage browse top-level sections keep the shared taxonomy accent');
assert.doesNotMatch(styles, /counter-reset: portal-section|counter\(portal-section|decimal-leading-zero|\.wiki-portal-block h3::before/, 'homepage browse top-level headings do not show numbered taxonomy badges');
assert.match(styles, /\.wiki-portal-block h3 \{[\s\S]*padding: 7px 10px;[\s\S]*border-left: 4px solid var\(--portal-section-accent\);[\s\S]*background: color-mix\(in srgb, var\(--portal-section-accent\) 7%, var\(--wiki-bg-alt\)\);[\s\S]*font-family: var\(--font-serif\);[\s\S]*font-size: 16px;[\s\S]*font-weight: 700;[\s\S]*letter-spacing: \.01em;[\s\S]*\}/, 'homepage browse top-level headings use compact tinted title bands instead of oversized type');
assert.doesNotMatch(styles, /\.wiki-portal-block h3 \{[\s\S]*font-variant-caps|transform: skewX\(-3deg\)/, 'homepage browse top-level headings avoid forced small caps and skewed text');
assert.match(styles, /\.wiki-portal-block h3 span \{[\s\S]*display: block;[\s\S]*color: color-mix\(in srgb, var\(--portal-section-accent\) 38%, var\(--wiki-text\)\);[\s\S]*\}/, 'homepage browse title-band text keeps a restrained accent tint');
assert.doesNotMatch(styles, /\.wiki-portal-block h3::after/, 'homepage title bands do not retain the old accent underline');
assert.match(styles, /\.wiki-portal-group-label \{[\s\S]*display: inline-flex;[\s\S]*border-left: 3px solid var\(--portal-section-accent\);[\s\S]*font-size: 11px;[\s\S]*text-transform: uppercase;[\s\S]*\}/, 'homepage browse links are grouped with compact taxonomy labels');
assert.match(styles, /\.wiki-portal-block li > span \{[\s\S]*font-size: 12px;[\s\S]*\}/, 'homepage limits muted summary typography to link summaries');
assert.doesNotMatch(styles, /\.wiki-portal-block span \{/, 'homepage link-summary typography cannot override top-level heading spans');
assert.match(styles, /\.wiki-portal-grid \{[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);[\s\S]*\}/, 'homepage browse directory uses a three-column desktop layout');
assert.match(styles, /\.wiki-shell:has\(\.wiki-portal\) \.wiki-sidebar \{[\s\S]*display: none;[\s\S]*\}/, 'homepage hides the article sidebar');
assert.match(homePage, /import \{ HomepagePortal \} from '@\/components\/HomepagePortal';/, 'homepage delegates interactive portal state to a client component');
assert.doesNotMatch(homePage, hiddenManuscriptPattern, 'homepage directory does not expose the hidden under-review manuscript');
assert.match(homePage, /if \(!page\) \{[\s\S]*throw new Error\(`Homepage directory slug must resolve to a public wiki page: \$\{slug\}`\);[\s\S]*\}/, 'homepage directory refuses missing or hidden wiki pages instead of generating fallback links');
assert.doesNotMatch(homePage, /slug\.replaceAll\('_', ' '\)/, 'homepage directory does not fall back to slug text for missing pages');
assert.doesNotMatch(homePage, /wiki-portal-emblem|\/xinbaopedia-icon\.png/, 'homepage no longer renders the in-page icon');
assert.match(homepagePortal, /className="wiki-portal-name"[\s\S]*Xinbao Qiao/, 'homepage uses Xinbao Qiao as the central portal name');
assert.match(homepagePortal, /wiki-portal-name-text[\s\S]*Xinbao Qiao/, 'homepage keeps the pure text signature as the central name');
assert.match(homePage, /Academic biography and research overview[\s\S]*个人学术条目与研究概览/, 'homepage keeps primary English and Chinese profile links below the search');
assert.match(homepagePortal, /<WikiSearch[\s\S]*language=\{language\}[\s\S]*onLanguageChange=\{setLanguage\}[\s\S]*showLanguageSelect[\s\S]*variant="portal"/, 'homepage search controls the portal language state');
assert.doesNotMatch(homepagePortal, /searchIndex|items=\{/, 'homepage does not receive or serialize the full search index');
assert.match(homepagePortal, /function withBasePath\(pathname: string\)/, 'homepage portal keeps static logo assets base-path aware');
assert.match(homepagePortal, /src=\{withBasePath\('\/site-logos\/wordmark\/xinbao-qiao-blue\.png'\)\}/, 'homepage blue wordmark image is base-path aware');
assert.match(homepagePortal, /wiki-portal-name-logos[\s\S]*\/site-logos\/wordmark\/xinbao-qiao-blue\.png[\s\S]*\/site-logos\/wordmark\/xinbao-qiao-gold\.png[\s\S]*\/site-logos\/wordmark\/xinbao-qiao-green\.png[\s\S]*\/site-logos\/wordmark\/xinbao-qiao-charcoal\.png/, 'homepage renders the themed Xinbao Qiao logo images for color themes');
assert.doesNotMatch(homepagePortal, /height=\{190\}|width=\{760\}/, 'homepage no longer renders the old rectangular logo canvas dimensions');
assert.match(homepagePortal, /const browseLabels[\s\S]*en: 'Browse Xinbaopedia'[\s\S]*zh: '浏览 Xinbaopedia'/, 'homepage Browse heading has English and Chinese labels');
assert.doesNotMatch(homepagePortal, /Research Atlas|研究图谱|\/atlas/, 'homepage removes the retired Research Atlas entry');
assert.match(homepagePortal, /const updateLabels[\s\S]*Latest Updates[\s\S]*Scrollable latest updates[\s\S]*最新动态[\s\S]*可滚动的最新动态/, 'homepage updates have bilingual labels for the feed and scrollable region');
assert.doesNotMatch(homepagePortal, /milestoneLabels|milestoneEntries|portal-milestones|wiki-portal-milestones|Milestones|里程碑/, 'homepage removes the duplicate Milestones surface and its supporting state and data');
assert.match(homepagePortal, /const updateEntries[\s\S]*ICML 2026 paper accepted[\s\S]*Completed master’s degree[\s\S]*AAAI 2026 paper accepted[\s\S]*Started full-time research internship[\s\S]*Two ICLR 2025 papers accepted[\s\S]*dateTime: '2022-09'[\s\S]*dateTime: '2022-07'/, 'homepage keeps the selected high-signal English update archive in reverse chronology');
assert.match(homepagePortal, /ICML 2026 论文录用[\s\S]*完成硕士学位[\s\S]*AAAI 2026 论文录用[\s\S]*开始全职研究实习[\s\S]*两篇 ICLR 2025 论文录用[\s\S]*dateTime: '2022-09'[\s\S]*dateTime: '2022-07'/, 'homepage keeps the selected Chinese update archive in reverse chronology');
assert.doesNotMatch(homepagePortal, /Mar 2023|2023年3月|Started data-centric ML research|开始数据中心机器学习研究|dateTime: '2023-03'/, 'homepage excludes the March 2023 research-start update');
assert.match(homepagePortal, /updateEntries\[language\]\.map/, 'homepage renders the complete update archive without slicing away older entries');
assert.doesNotMatch(homepagePortal, /Research code released|研究代码公开|Academic service|学术服务|Serving as a reviewer/, 'homepage updates exclude routine code and service notices');
assert.match(homepagePortal, /className="wiki-portal-disclosures"[\s\S]*className="wiki-portal-news wiki-portal-timeline"[\s\S]*className="wiki-portal-directory"/, 'homepage places only Updates and Browse as sibling disclosure sections');
assert.match(styles, /\.wiki-portal-disclosures \{[\s\S]*--portal-search-width: 690px;[\s\S]*--portal-search-leading-width: 50px;[\s\S]*--portal-search-submit-width: 96px;[\s\S]*max-width: 920px;/, 'homepage restores the original 920px expanded Browse container while retaining search measurements');
assert.match(styles, /\.wiki-portal-disclosures > details \{[\s\S]*interpolate-size: allow-keywords;[\s\S]*\}[\s\S]*\.wiki-portal-disclosures > details::details-content \{[\s\S]*block-size: 0;[\s\S]*opacity: 0;[\s\S]*transition:[\s\S]*block-size \.24s[\s\S]*content-visibility \.24s allow-discrete[\s\S]*opacity \.16s[\s\S]*\}[\s\S]*\.wiki-portal-disclosures > details\[open\]::details-content \{[\s\S]*block-size: auto;[\s\S]*opacity: 1;/, 'homepage disclosures animate their content smoothly in both directions');
assert.match(styles, /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*\.wiki-portal-disclosures > details::details-content,[\s\S]*\.wiki-portal-directory summary span::after,[\s\S]*\.wiki-portal-timeline-heading::after \{[\s\S]*transition: none;/, 'homepage disclosure and indicator animations honor reduced-motion settings');
assert.match(styles, /\.wiki-portal-timeline \{[\s\S]*width: min\([\s\S]*var\(--portal-search-width\)[\s\S]*margin-left: max\([\s\S]*var\(--portal-search-leading-width\)[\s\S]*border-left: 4px solid var\(--site-theme-accent\);[\s\S]*border-radius: 2px;[\s\S]*background: color-mix/, 'homepage Updates remains aligned to the white search field inside the restored wider Browse container');
assert.doesNotMatch(styles, /\.wiki-portal-timeline \{[\s\S]*radial-gradient|\.wiki-portal-timeline \{[\s\S]*box-shadow:/, 'homepage timelines avoid wide promotional-card effects');
assert.match(styles, /\.wiki-portal-news-preview \{[\s\S]*grid-template-columns: 80px minmax\(0, 1fr\);[\s\S]*margin-top: 8px;[\s\S]*padding-top: 8px;/, 'collapsed Latest Updates previews the newest dated item');
assert.match(styles, /\.wiki-portal-news\[open\] \.wiki-portal-news-preview \{[\s\S]*display: none;/, 'expanded Latest Updates replaces the preview with the full feed');
assert.match(styles, /\.wiki-portal-updates-window \{[\s\S]*height: var\(--portal-updates-window-height, 316px\);[\s\S]*overflow-y: auto;[\s\S]*overscroll-behavior: contain;[\s\S]*scrollbar-gutter: stable;/, 'expanded Latest Updates uses a stable scroll window');
assert.match(styles, /\.wiki-portal-news-list \{[\s\S]*grid-template-columns: 1fr;[\s\S]*padding: 0 12px 4px;/, 'homepage updates use one compact reading column at every breakpoint');
assert.match(styles, /\.wiki-portal-news-list li \{[\s\S]*grid-template-columns: 80px minmax\(0, 1fr\);[\s\S]*align-items: start;[\s\S]*gap: 10px;[\s\S]*padding: 7px 0;/, 'homepage update dates and headlines share a compact stable first-line alignment');
assert.match(styles, /\.wiki-portal-news-list time \{[\s\S]*padding-top: 2px;[\s\S]*font-size: 11px;[\s\S]*line-height: 1\.35;[\s\S]*\}[\s\S]*\.wiki-portal-news-list a \{[\s\S]*display: block;[\s\S]*font-size: 14px;[\s\S]*line-height: 1\.35;[\s\S]*text-wrap: balance;[\s\S]*\}[\s\S]*\.wiki-portal-news-list p \{[\s\S]*font-size: 12\.5px;[\s\S]*line-height: 1\.4;[\s\S]*text-wrap: balance;/, 'homepage updates retain readable typography and avoid orphaned short final lines');
assert.match(styles, /\.wiki-portal-directory \{[\s\S]*width: 100%;[\s\S]*\}[\s\S]*\.wiki-portal-directory summary \{[\s\S]*width: min\(100%, 620px\);[\s\S]*margin-inline: auto;/, 'homepage Browse restores a 920px expanded directory while retaining its original centered 620px summary');
assert.match(styles, /@media \(max-width: 720px\) \{[\s\S]*\.wiki-portal-timeline \{[\s\S]*width: 100%;[\s\S]*margin-inline: 0;/, 'homepage timelines use the available width on small screens instead of inheriting narrow desktop search controls');
assert.match(homepagePortal, /const \[browseOpen, setBrowseOpen\] = useState\(false\);/, 'homepage browse directory is collapsed by default');
assert.match(homepagePortal, /const \[newsOpen, setNewsOpen\] = useState\(false\);/, 'homepage News is collapsed by default');
assert.match(homepagePortal, /const collapsibleSections = \{ browse: browseOpen, news: newsOpen \};[\s\S]*const allSectionsClosed = Object\.values\(collapsibleSections\)\.every\(\(open\) => !open\);[\s\S]*wiki-portal-collapsed/, 'homepage computes collapsed state across both peer disclosures');
assert.match(homepagePortal, /const expandAllSections = \(\) => \{[\s\S]*setBrowseOpen\(true\);[\s\S]*setNewsOpen\(true\);[\s\S]*\};[\s\S]*const collapseAllSections = \(\) => \{[\s\S]*setBrowseOpen\(false\);[\s\S]*setNewsOpen\(false\);[\s\S]*\};/, 'homepage signature button expands or collapses Updates and Browse together');
assert.match(homepagePortal, /useLayoutEffect\(\(\) => \{[\s\S]*slice\(0, 5\)[\s\S]*--portal-updates-window-height[\s\S]*ResizeObserver[\s\S]*\}, \[language, newsOpen\]\);/, 'homepage measures the first five updates to size the scroll window responsively');
assert.match(homepagePortal, /className="wiki-portal-updates-window"[\s\S]*ref=\{updatesWindowRef\}[\s\S]*role="region"[\s\S]*tabIndex=\{0\}/, 'homepage update archive is a labeled keyboard-focusable scroll region');
assert.match(homepagePortal, /className="wiki-portal-name-button"[\s\S]*onClick=\{toggleAllSections\}[\s\S]*onDoubleClick=\{collapseAllSections\}/, 'homepage signature button click toggles expansion while double-click still collapses');
assert.doesNotMatch(homepagePortal, /onKeyDown=\{|handleSignatureKeyDown|KeyboardEvent/, 'homepage signature button uses native button activation instead of custom keyboard handling');
assert.match(homepagePortal, /<details[\s\S]*className="wiki-portal-directory"[\s\S]*id="portal-directory"[\s\S]*open=\{browseOpen\}[\s\S]*<summary[\s\S]*event\.preventDefault\(\);[\s\S]*setBrowseOpen\(\(open\) => !open\);[\s\S]*browseLabels\[language\]/, 'homepage Browse uses native disclosure semantics with race-free controlled state');
assert.match(homepagePortal, /<details[\s\S]*className="wiki-portal-news wiki-portal-timeline"[\s\S]*id="portal-news"[\s\S]*open=\{newsOpen\}[\s\S]*<summary[\s\S]*event\.preventDefault\(\);[\s\S]*setNewsOpen\(\(open\) => !open\);/, 'homepage Updates uses native disclosure semantics with race-free controlled state');
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
assert.match(infobox, /type InfoboxLanguage = 'en' \| 'zh'/, 'infobox supports explicit route language');
assert.match(infobox, /rowLabels = language === 'zh' \? zhLabels : labels/, 'infobox chooses row labels from the route language');
assert.match(infobox, /occupation: '职业'[\s\S]*education: '教育经历'/, 'infobox includes Chinese labels for occupation and education');
assert.match(infobox, /item\.url\.startsWith\('mailto:'\) \? \(language === 'zh' \? '邮箱' : 'Email'\)/, 'infobox localizes the email row label');
assert.match(infobox, /toChineseSlug\(slug\)[\s\S]*toEnglishSlug\(slug\)/, 'infobox localizes internal wiki links in frontmatter rows');
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
const allPublicText = `${allMarkdown}\n${homePage}\n${homepagePortal}\n${fs.readFileSync(path.join(root, 'public/okf/index.md'), 'utf8')}\n${JSON.stringify(okfPageIndex)}`;
assert.doesNotMatch(allPublicText, /Community Service|community service|社区服务/, 'public homepage and wiki content use academic service, not community service');
assert.doesNotMatch(allPublicText, /Transactions on Neural Networks and Learning Systems/, 'public content keeps reviewer venue labels abbreviated as IEEE TNNLS');
assert.match(allPublicText, /IEEE TNNLS/, 'public content retains the abbreviated IEEE TNNLS reviewer label');
assert.match(read('Xinbao_Qiao.md'), /## Academic service[\s\S]*- \*\*2026\*\*: reviewer for ICML, NeurIPS, and AAAI\.[\s\S]*- \*\*2025\*\*: reviewer for NeurIPS, ICLR, AAAI, and IEEE TNNLS\./, 'English homepage lists academic service by year');
assert.match(read('Qiao_Xinbao_zh.md'), /## 学术服务[\s\S]*- \*\*2026 年\*\*：担任 ICML、NeurIPS 和 AAAI 审稿人。[\s\S]*- \*\*2025 年\*\*：担任 NeurIPS、ICLR、AAAI 和 IEEE TNNLS 审稿人。/, 'Chinese homepage lists academic service by year');
assert.doesNotMatch(allPublicText, /reviewer for ICML 2026, NeurIPS 2025 and 2026|担任 ICML 2026、NeurIPS 2025 和 2026/, 'public content no longer compresses academic service into one mixed-year sentence');
assert.doesNotMatch(allChineseMarkdown, /ZXQ|XQ0|当_ 抽样|软件_ Weightd|学习什么 内容|首尔首尔|大赦国际|高山模型|秋奥|\[\[\[/, 'Chinese markdown pages avoid broken machine-translation artifacts');
assert.match(read('When_Sample_Selection_Bias_Precipitates_Model_Collapse.md'), /Data filtering is not automatically protective/, 'model-collapse page presents a high-level filtering takeaway');
assert.match(read('Hessian_Free_Online_Certified_Unlearning.md'), /Unlearning needs an operational model/, 'Hessian-free page presents a high-level lifecycle takeaway');
assert.match(read('DynFrs.md'), /Exact unlearning can be a data-structure problem/, 'DynFrs page presents a high-level data-structure takeaway');
assert.match(read('Soft_Weighted_Machine_Unlearning.md'), /Not every correction should be a deletion/, 'soft-weighted page presents a high-level correction takeaway');
assert.match(read('When_Sample_Selection_Bias_Precipitates_Model_Collapse_zh.md'), /尾部覆盖/, 'Chinese model-collapse page presents a high-level tail-coverage takeaway');
assert.match(read('Hessian_Free_Online_Certified_Unlearning_zh.md'), /模型生命周期准备/, 'Chinese Hessian-free page presents a high-level lifecycle takeaway');
assert.match(read('DynFrs_zh.md'), /数据结构问题/, 'Chinese DynFrs page presents a high-level data-structure takeaway');
assert.match(read('Soft_Weighted_Machine_Unlearning_zh.md'), /数据影响应当像旋钮/, 'Chinese soft-weighted page presents a high-level influence-control takeaway');
assert.doesNotMatch(allMarkdown, /backup\/old-homepage/, 'wiki no longer depends on backup-branch image URLs');
assert.doesNotMatch(allMarkdown, /withheld\s+LLM\s+manuscript/i, 'withheld manuscript notes are not public content');

for (const page of ['Xinbao_Qiao.md', 'Qiao_Xinbao_zh.md', 'Publications.md']) {
  assert.doesNotMatch(read(page), /!\[/, `${page} remains text-only in the article body`);
}

const cvTex = fs.readFileSync(path.join(root, 'CV.tex'), 'utf8');
assert.match(cvTex, /xinbaoqiao@cuhk\.edu\.hk/, 'CV uses current CUHK email');
assert.doesNotMatch(cvTex, /xinbaoqiao@zju\.edu\.cn/, 'CV removes old Zhejiang email');
assert.match(cvTex, /The Chinese University of Hong Kong/, 'CV includes current PhD affiliation');
assert.match(cvTex, /M\.Eng\. in Artificial Intelligence/, 'CV PDF source records the ZJU AI degree as M.Eng.');
assert.doesNotMatch(cvTex, /M\.Sc\. in Artificial Intelligence/, 'CV PDF source avoids the incorrect ZJU M.Sc. wording');
assert.match(cvTex, /Open-Source Contributions and Academic Service/, 'CV PDF source labels service as academic service');
assert.doesNotMatch(cvTex, /Open-Source Contributions and Services|Peer-Reviewing/, 'CV PDF source avoids vague service and peer-reviewing labels');
assert.match(cvTex, /Academic service, 2026\}\{reviewer for ICML, NeurIPS, and AAAI\.\}/, 'CV PDF source lists 2026 academic service by year');
assert.match(cvTex, /Academic service, 2025\}\{reviewer for NeurIPS, ICLR, AAAI, and IEEE TNNLS\.\}/, 'CV PDF source lists 2025 academic service by year');
assert.match(cvTex, /When[\s\S]*Sample Selection Bias[\s\S]*Model Collapse[\s\S]*ICML,? 2026/, 'CV updates model-collapse paper status');
assert.doesNotMatch(cvTex, /withheld\s+LLM\s+manuscript/i, 'CV omits withheld manuscript notes');
assert.match(cvTex, /arxiv\.org\/abs\/2606\.13732/, 'CV PDF source links Paper #1 arXiv page');
assert.match(cvTex, /ojs\.aaai\.org\/index\.php\/AAAI\/article\/view\/39681/, 'CV PDF source links Paper #2 AAAI article page');
assert.match(cvTex, /github\.com\/XinbaoQiao\/Soft-Weighted-Machine-Unlearning/, 'CV PDF source links Paper #2 code');
assert.match(cvTex, /\\newcommand\{\\corrauthor\}\{\\textsuperscript\{\\textdagger\}\}/, 'CV defines one consistent corresponding-author dagger macro');
assert.match(cvTex, /Asterisks \(\*\) denote co-first authorship; daggers \(\\textdagger\) denote corresponding authors\./, 'CV note defines co-first and corresponding-author symbols');
assert.doesNotMatch(cvTex, /Accepted papers are listed before under-review manuscripts\./, 'CV removes the accepted-paper ordering sentence');
assert.match(cvTex, /\\textbf\{Xinbao Qiao\}\\corrauthor, Xianglong Du, Wei Liu, Jingqi Zhang, Peihua Mai, Meng Zhang\\corrauthor, Yan Pang\\corrauthor/, 'CV Paper #1 marks Xinbao Qiao, Meng Zhang, and Yan Pang as corresponding authors');
assert.match(cvTex, /\\textbf\{Xinbao Qiao\}, Ningning Ding, Yushi Cheng, Meng Zhang\\corrauthor/, 'CV Paper #2 marks Meng Zhang as corresponding author');
assert.match(cvTex, /\\textbf\{Xinbao Qiao\}, Meng Zhang\\corrauthor, Ming Tang, Ermin Wei/, 'CV Paper #3 marks Meng Zhang as corresponding author');
assert.match(cvTex, /Shurong Wang, Zhuoyang Shen, \\textbf\{Xinbao Qiao\}, Tongning Zhang, Meng Zhang\\corrauthor/, 'CV Paper #4 marks Meng Zhang as corresponding author');
assert.match(cvTex, /\\textbf\{Xinbao Qiao\}, Wenjing Yan\\corrauthor, Ying-Jun Angela Zhang/, 'CV Paper #5 marks Wenjing Yan as corresponding author');
assert.match(cvTex, /Peihua Mai, Zhuoyan Shao, \\textbf\{Xinbao Qiao\}, Meng Zhang, Xinyue Zhou\\corrauthor, Yan Pang\\corrauthor/, 'CV Paper #6 marks Xinyue Zhou and Yan Pang as corresponding authors');
assert.match(cvTex, /scholar\.google\.com\/citations\?view_op=search_authors\\&mauthors=Xinbao\+Qiao/, 'CV PDF source links Google Scholar without exposing the author ID');
const cvPublicationBlock = cvTex.slice(cvTex.indexOf('\\cvsection{Selected Publications}'));
assert.doesNotMatch(cvPublicationBlock, /icml\.cc|iclr\.cc|underline\.io|Distributed_Wasserstein_Barycenter|LLM_Reliability/, 'CV publication icons only link arXiv, GitHub, OpenReview, or official paper pages');
assert.match(read('CV.md'), /\[résumé\]\(\/files\/XinbaoQiao_CV\.pdf\)/, 'English CV page labels the PDF link as résumé');
assert.match(read('CV_zh.md'), /\[résumé\]\(\/files\/XinbaoQiao_CV\.pdf\)/, 'Chinese CV page labels the PDF link as résumé');
assert.match(read('CV.md'), /M\.Eng\. in Artificial Intelligence/, 'English CV page records the ZJU AI degree as M.Eng.');
assert.match(read('CV_zh.md'), /人工智能工学硕士/, 'Chinese CV page records the ZJU AI degree as 工学硕士');
assert.match(read('CV.md'), /Asterisks \(\*\) denote co-first authorship; daggers \(†\) denote corresponding authors\./, 'English wiki CV explains corresponding-author daggers');
assert.match(read('CV_zh.md'), /星号（\*）表示共同第一作者；剑号（†）表示通讯作者。/, 'Chinese wiki CV explains corresponding-author daggers');
assert.match(read('CV.md'), /\*\*Xinbao Qiao\*\*†, Xianglong Du, Wei Liu, Jingqi Zhang, Peihua Mai, Meng Zhang†, Yan Pang†/, 'English wiki CV marks Paper #1 corresponding authors');
assert.match(read('CV.md'), /Wenjing Yan†, Ying-Jun Angela Zhang[\s\S]*Xinyue Zhou†, Yan Pang†/, 'English wiki CV marks Papers #5 and #6 corresponding authors');
assert.match(read('CV_zh.md'), /\*\*乔鑫宝\*\*†、Xianglong Du、Wei Liu、Jingqi Zhang、Peihua Mai、张萌†、Yan Pang†/, 'Chinese wiki CV marks Paper #1 corresponding authors');
assert.match(read('CV_zh.md'), /Wenjing Yan†、Ying-Jun Angela Zhang[\s\S]*Xinyue Zhou†、Yan Pang†/, 'Chinese wiki CV marks Papers #5 and #6 corresponding authors');
assert.match(fs.readFileSync(path.join(root, 'public/okf/concepts/CV.md'), 'utf8'), /\[résumé\]\(\/files\/XinbaoQiao_CV\.pdf\)/, 'English OKF CV concept labels the PDF link as résumé');
assert.match(fs.readFileSync(path.join(root, 'public/okf/concepts/CV_zh.md'), 'utf8'), /\[résumé\]\(\/files\/XinbaoQiao_CV\.pdf\)/, 'Chinese OKF CV concept labels the PDF link as résumé');
assert.match(read('CV.md'), /Open-Source Contributions and Academic Service/, 'English CV labels reviewing as academic service');
assert.doesNotMatch(read('CV.md'), /Open-Source Contributions and Services/, 'English CV no longer uses vague service wording');
assert.match(read('CV_zh.md'), /研究代码发布[\s\S]*学术审稿/, 'Chinese CV localizes contribution and reviewing labels');
assert.match(read('CV.md'), /\*\*Academic service, 2026\*\*: reviewer for ICML, NeurIPS, and AAAI\.[\s\S]*\*\*Academic service, 2025\*\*: reviewer for NeurIPS, ICLR, AAAI, and IEEE TNNLS\./, 'English CV lists academic service by year');
assert.match(read('CV_zh.md'), /\*\*学术审稿，2026 年\*\*：担任 ICML、NeurIPS 和 AAAI 审稿人。[\s\S]*\*\*学术审稿，2025 年\*\*：担任 NeurIPS、ICLR、AAAI 和 IEEE TNNLS 审稿人。/, 'Chinese CV lists academic service by year');
assert.doesNotMatch(read('CV_zh.md'), /Research on Data-Centric ML Systems|Research on Trustworthy LLM systems|Research code releases|Peer-reviewing/, 'Chinese CV avoids English section labels inside the Chinese summary');
assert.doesNotMatch(read('CV.md'), /\[XinbaoQiao_CV\.pdf\]\(\/files\/XinbaoQiao_CV\.pdf\)/, 'English CV page avoids exposing the PDF filename as link text');
assert.doesNotMatch(read('CV_zh.md'), /\[XinbaoQiao_CV\.pdf\]\(\/files\/XinbaoQiao_CV\.pdf\)/, 'Chinese CV page avoids exposing the PDF filename as link text');
assert.match(read('CV.md'), /Soft-Weighted-Machine-Unlearning/, 'English CV page links Paper #2 code');
assert.match(read('CV_zh.md'), /Soft-Weighted-Machine-Unlearning/, 'Chinese CV page links Paper #2 code');
assert.match(read('CV.md'), /2606\.13732[\s\S]*39681/, 'English CV page links Paper #1 arXiv and Paper #2 AAAI article');
assert.match(read('CV_zh.md'), /2606\.13732[\s\S]*39681/, 'Chinese CV page links Paper #1 arXiv and Paper #2 AAAI article');
assert.match(read('When_Sample_Selection_Bias_Precipitates_Model_Collapse.md'), /label: arXiv[\s\S]*2606\.13732/, 'Paper #1 English page metadata links arXiv');
assert.match(read('When_Sample_Selection_Bias_Precipitates_Model_Collapse_zh.md'), /label: arXiv[\s\S]*2606\.13732/, 'Paper #1 Chinese page metadata links arXiv');
assert.match(read('Soft_Weighted_Machine_Unlearning.md'), /label: AAAI article[\s\S]*39681[\s\S]*label: Code[\s\S]*Soft-Weighted-Machine-Unlearning/, 'Paper #2 English page metadata links AAAI article and code');
assert.match(read('Soft_Weighted_Machine_Unlearning_zh.md'), /label: AAAI article[\s\S]*39681[\s\S]*label: Code[\s\S]*Soft-Weighted-Machine-Unlearning/, 'Paper #2 Chinese page metadata links AAAI article and code');
assert.match(fs.readFileSync(path.join(root, 'public/okf/concepts/CV.md'), 'utf8'), /Soft-Weighted-Machine-Unlearning/, 'English OKF CV concept links Paper #2 code');
assert.match(fs.readFileSync(path.join(root, 'public/okf/concepts/CV_zh.md'), 'utf8'), /Soft-Weighted-Machine-Unlearning/, 'Chinese OKF CV concept links Paper #2 code');
assert.match(fs.readFileSync(path.join(root, 'public/okf/concepts/CV.md'), 'utf8'), /2606\.13732[\s\S]*39681/, 'English OKF CV concept links Paper #1 arXiv and Paper #2 AAAI article');
assert.match(fs.readFileSync(path.join(root, 'public/okf/concepts/CV_zh.md'), 'utf8'), /2606\.13732[\s\S]*39681/, 'Chinese OKF CV concept links Paper #1 arXiv and Paper #2 AAAI article');
assert.doesNotMatch(read('CV.md'), /citations\?user=nhC_OfEAAAAJ/, 'English CV page avoids exposing the Google Scholar author ID');
assert.doesNotMatch(read('CV_zh.md'), /citations\?user=nhC_OfEAAAAJ/, 'Chinese CV page avoids exposing the Google Scholar author ID');
const cvTexUris = sortedUrls([...cvTex.matchAll(/\\(?:blackhref|linkish|iconlink)\{([^{}]+)\}/g)].map((match) => match[1]));
const cvPdfUriOutput = execFileSync('mutool', ['show', 'public/files/XinbaoQiao_CV.pdf', 'grep', 'URI'], { cwd: root, encoding: 'utf8' });
const cvPdfUris = sortedUrls([...cvPdfUriOutput.matchAll(/\/URI\(([^)]*)\)/g)].map((match) => match[1]));
assert.deepEqual(cvPdfUris, cvTexUris, 'CV PDF URI annotations match CV.tex hyperlink targets');

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
  'public/site-logos/wordmark/xinbao-qiao-blue.png',
  'public/site-logos/wordmark/xinbao-qiao-gold.png',
  'public/site-logos/wordmark/xinbao-qiao-green.png',
  'public/site-logos/wordmark/xinbao-qiao-charcoal.png',
  'public/files/XinbaoQiao_CV.pdf',
  'public/papers/model-collapse/poster.png',
  'public/papers/model-collapse/teaser.png',
  'public/papers/hessian-free/poster.png',
  'public/papers/soft-weighted/poster.png',
  'public/papers/soft-weighted/framework.png',
  'public/papers/dynfrs/lazy-tags.png',
  'public/papers/dynfrs/poster.png'
]) {
  assertFile(file);
}
for (const removedImage of [
  'public/papers/model-collapse/fid-trends-combined.png',
  'public/papers/model-collapse/barycenter-methodology.png',
  'public/papers/model-collapse/class-proportions-trend.png',
  'public/papers/hessian-free/mia-tradeoff.png',
  'public/papers/hessian-free/ours.png',
  'public/papers/soft-weighted/sec-5-1-1.png',
]) {
  assert.ok(!fs.existsSync(path.join(root, removedImage)), `${removedImage} is removed from the publication image set`);
}

console.log('Wiki data tests passed.');
