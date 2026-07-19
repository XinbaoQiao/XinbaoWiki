import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import matter from 'gray-matter';

const root = process.cwd();
const wikiDir = path.join(root, 'wiki');

function source(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function wikiData(file) {
  return matter(fs.readFileSync(path.join(wikiDir, file), 'utf8')).data;
}

function page(slug) {
  return wikiData(`${slug}.md`);
}

function existsPublic(slug) {
  const file = `${slug}.md`;
  const filePath = path.join(wikiDir, file);
  return fs.existsSync(filePath) && page(slug).hidden !== true;
}

function chineseSlug(slug) {
  if (slug === 'Xinbao_Qiao') return 'Qiao_Xinbao_zh';
  if (slug === 'Qiao_Xinbao_zh' || slug.endsWith('_zh')) return slug;
  return `${slug}_zh`;
}

const manifestSource = source('lib/wiki-manifest.ts');
const metadataSource = source('lib/wiki-metadata.ts');
const wikiSource = source('lib/wiki.ts');
const pageSource = source('app/page.tsx');
const sidebarSource = source('components/Sidebar.tsx');
const sidebarClientSource = source('components/SidebarClient.tsx');
const navigationSource = source('lib/site-navigation.ts');
const feedSource = source('app/feed.xml/route.ts');
const searchRouteSource = source('app/search-index.json/route.ts');

assert.match(manifestSource, /export type WikiManifestEntry = \{[\s\S]*slug: string;[\s\S]*title: string;[\s\S]*summary: string;[\s\S]*language: WikiLanguage;[\s\S]*type: string;[\s\S]*tags: string\[\];[\s\S]*aliases: string\[\];[\s\S]*timestamp\?: string;[\s\S]*updatedAt\?: string;/, 'manifest exposes the public content fields needed by routes and navigation');
assert.match(manifestSource, /if \(data\.hidden === true\) return \[\];/, 'manifest excludes hidden wiki files at the single public-content boundary');
assert.match(metadataSource, /export function isChineseSlug/, 'metadata module owns Chinese slug detection');
assert.match(metadataSource, /export function wikiPageTitle/, 'metadata module owns title resolution');
assert.match(metadataSource, /export function wikiPageSummary/, 'metadata module owns summary resolution');
assert.match(metadataSource, /export function wikiConceptType/, 'metadata module owns concept-type resolution');
assert.match(wikiSource, /export \{ isChineseSlug, toChineseSlug, toEnglishSlug, wikiConceptType, wikiPageSummary, wikiPageTitle \} from '@\/lib\/wiki-metadata';/, 'wiki library re-exports metadata helpers to preserve its public API');
assert.match(manifestSource, /from '@\/lib\/wiki-metadata'/, 'manifest reuses shared metadata helpers instead of duplicating them');
assert.doesNotMatch(manifestSource, /function pageTitle|function pageSummary|function conceptType/, 'manifest does not duplicate wiki metadata resolvers');
assert.match(manifestSource, /language: isChineseSlug\(slug\) \? 'zh' : 'en'/, 'manifest derives language from shared stable slug helper');
assert.match(manifestSource, /const updatedAt = dateString\(data\.modified\)/, 'manifest uses stable frontmatter modification data when available');
assert.doesNotMatch(manifestSource, /mtime|birthtime|git log|git\s+/, 'manifest does not depend on filesystem or git modification time');
assert.match(manifestSource, /entryMap: new Map\(entries\.map/, 'manifest builds a cached slug-to-entry map for O(1) public metadata lookup');
assert.match(manifestSource, /pageMap: new Map\(records\.map/, 'manifest builds a cached slug-to-page map for O(1) public page lookup');
assert.match(manifestSource, /export function getManifestWikiPage\(slug: string\): WikiPage \| null/, 'manifest exposes cached public wiki pages');
assert.match(manifestSource, /return cache\(\)\.entryMap\.get\(slug\) \?\? null;/, 'manifest entry lookup does not copy and linearly scan entries');
assert.match(manifestSource, /return cache\(\)\.pageMap\.get\(slug\) \?\? null;/, 'manifest page lookup uses the cached map');
assert.match(wikiSource, /getPublicManifestSlugs\(\)/, 'public slug listing reuses the manifest');
assert.match(wikiSource, /if \(!options\.includeHidden\) return getManifestWikiPage\(resolved\);/, 'public getWikiPageBySlug reuses cached manifest pages');
assert.match(wikiSource, /getManifestSearchIndex\(\)/, 'search index builder reuses manifest parsing');
assert.doesNotMatch(wikiSource, /function asSearchStrings|function plainText|Delegated manifest search keeps the old invariants/, 'wiki library no longer keeps stale search helpers or test-only comments');
assert.match(searchRouteSource, /getSearchIndex\(\)/, 'search JSON route continues through the shared wiki search function');

for (const slug of ['Internet_Slang_2026', 'Internet_Slang_2026_zh', 'Learn_What_Matters_Data_Pruning_for_Efficient_Decentralized_Learning']) {
  assert.equal(page(slug).hidden, true, `${slug} is a hidden source page fixture`);
  assert.equal(existsPublic(slug), false, `${slug} would not enter the public manifest`);
}
for (const slug of ['Xinbao_Qiao', 'Qiao_Xinbao_zh', 'CV', 'CV_zh', 'When_Sample_Selection_Bias_Precipitates_Model_Collapse']) {
  assert.equal(existsPublic(slug), true, `${slug} is public manifest content`);
  assert.ok(page(slug).timestamp, `${slug} carries a stable timestamp`);
}
assert.equal(page('Qiao_Xinbao_zh').language, undefined, 'Chinese biography still relies on the special Qiao_Xinbao_zh slug fallback');
assert.equal(page('CV_zh').language, 'zh', 'ordinary Chinese pages may also declare language explicitly');

const curatedSlugs = Array.from(navigationSource.matchAll(/'([A-Za-z0-9_]+)'/g), (match) => match[1])
  .filter((slug) => fs.existsSync(path.join(wikiDir, `${slug}.md`)) || fs.existsSync(path.join(wikiDir, `${chineseSlug(slug)}.md`)));
assert.ok(curatedSlugs.includes('AI_and_Networks'), 'curated navigation keeps the existing research-topic entry');
for (const slug of new Set(curatedSlugs.filter((slug) => !slug.endsWith('_zh')))) {
  assert.equal(existsPublic(slug), true, `${slug} exists as a public English navigation target`);
  assert.equal(existsPublic(chineseSlug(slug)), true, `${slug} has a public Chinese navigation target`);
}
assert.match(pageSource, /directorySections, languageEntries.+@\/lib\/site-navigation/s, 'homepage reuses curated shared navigation slugs');
assert.match(pageSource, /getWikiManifestEntry\(slug\)/, 'homepage entries resolve through the public manifest');
assert.doesNotMatch(pageSource, /getWikiPageBySlug/, 'homepage no longer rereads wiki files per curated link');
assert.match(sidebarSource, /getWikiManifestEntry/, 'sidebar server wrapper validates links against the public manifest');
assert.match(sidebarSource, /<SidebarClient sections=\{sidebarManifest\(\)\}/, 'sidebar keeps the layout import stable while passing manifest-derived data to the client');
assert.match(sidebarClientSource, /href=\{withBasePath\('\/feed\.xml'\)\}/, 'sidebar exposes a discoverable feed link without editing SEO files');

assert.match(feedSource, /xmlns="http:\/\/www\.w3\.org\/2005\/Atom"/, 'feed route emits Atom XML');
assert.match(feedSource, /application\/atom\+xml; charset=utf-8/, 'feed route returns an Atom content type');
assert.match(feedSource, /getWikiFeedEntries\(24\)/, 'feed route is backed by stable manifest entries');
assert.match(feedSource, /replaceAll\('&', '&amp;'\)/, 'feed XML escapes text content');
assert.match(feedSource, /rel="self" href="\$\{xml\(FEED_ID\)\}" type="application\/atom\+xml"/, 'feed XML advertises its canonical self link');
assert.doesNotMatch(feedSource, /mtime|birthtime|git log|git\s+/, 'feed route does not derive updates from runtime git or filesystem mtime');
assert.ok(manifestSource.includes('.replace(/[#>*_|~`$\\\\-]+/g'), 'manifest plainText strips LaTeX backslashes like the previous wiki search implementation');
assert.ok(manifestSource.includes("return [...getWikiManifest()]"), "feed sorting copies the cached manifest before sorting");
assert.match(feedSource, /entry\.updatedAt \?\? entry\.timestamp/, 'feed ordering uses stable updatedAt/timestamp fields');

console.log('content manifest tests passed');
