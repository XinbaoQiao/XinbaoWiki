import assert from 'node:assert/strict';
import fs from 'node:fs';
import sharp from 'sharp';
import matter from 'gray-matter';
import { getRecentSiteUpdates, siteUpdates } from '../lib/site-updates.ts';

const current = new Date('2026-10-19T03:00:00Z');
for (const language of ['en', 'zh']) {
  const recent = getRecentSiteUpdates(language, current);
  assert.equal(recent.length, 8);
  assert.equal(siteUpdates[language].length, 10, 'The full archive retains both 2022 milestones');
  assert.ok(!recent.some(item => item.dateTime.startsWith('2022-')));
  assert.ok(siteUpdates[language].some(item => item.dateTime === '2022-09'));
  assert.ok(getRecentSiteUpdates(language, new Date('2026-09-30T03:00:00Z')).some(item => item.dateTime === '2022-09'), 'A month-only event is retained while its month overlaps the window');
  assert.ok(!getRecentSiteUpdates(language, new Date('2026-10-01T03:00:00Z')).some(item => item.dateTime === '2022-09'), 'The same event leaves Latest Updates at the month boundary');
  assert.ok(getRecentSiteUpdates(language, new Date('2030-08-01T03:00:00Z')).some(item => item.dateTime === '2026-08-01'), 'An exact date is included on its fourth anniversary');
  assert.ok(!getRecentSiteUpdates(language, new Date('2030-08-02T03:00:00Z')).some(item => item.dateTime === '2026-08-01'), 'An exact date expires after its fourth anniversary');
  assert.deepEqual(getRecentSiteUpdates(language, new Date('2031-01-01T03:00:00Z')), [], 'A future empty window is supported');
  assert.ok(getRecentSiteUpdates(language, new Date('2025-01-01T03:00:00Z')).every(item => item.dateTime <= '2025-01-01'), 'Future events are excluded');
}
assert.deepEqual(getRecentSiteUpdates('en', current).map(item => item.dateTime), getRecentSiteUpdates('zh', current).map(item => item.dateTime));

const papers = siteUpdates.en.flatMap(item => item.papers || []);
assert.equal(papers.length, 5);
const iclr = siteUpdates.en.find(item => item.dateTime === '2025-01');
assert.deepEqual(iclr.papers.map(paper => paper.slug), ['Hessian_Free_Online_Certified_Unlearning', 'DynFrs'], 'Shared acceptances retain the specified left-to-right paper order');
for (const paper of papers) {
  assert.ok(new URL(paper.pdf).protocol === 'https:');
  const image = fs.readFileSync(`public${paper.image}`);
  const metadata = await sharp(image).metadata();
  assert.equal(metadata.format, 'webp');
  assert.equal(metadata.width, paper.width);
  assert.equal(metadata.height, paper.height);
  assert.ok(metadata.width >= 1200, 'A full-page preview remains readable when enlarged');
  assert.ok(fs.existsSync(`wiki/${paper.slug}.md`) && fs.existsSync(`wiki/${paper.slug}_zh.md`));
  let englishImage;
  for (const language of ['en', 'zh']) {
    const slug = language === 'zh' ? `${paper.slug}_zh` : paper.slug;
    const { data } = matter(fs.readFileSync(`wiki/${slug}.md`, 'utf8'));
    const highlight = data.paper_highlight;
    assert.ok(highlight?.tldr?.length >= 60, `${slug}: a substantive canonical TL;DR is required`);
    assert.ok(highlight.image.startsWith('/papers/') && highlight.image_alt);
    assert.equal(highlight.figures.length, 3, 'Every detailed card has three source-backed supporting images');
    assert.ok(!highlight.image_caption, 'Redundant teaser descriptions are omitted');
    const figure = await sharp(`public${highlight.image}`).metadata();
    assert.equal(figure.width, highlight.width);
    assert.equal(figure.height, highlight.height);
    assert.equal(figure.format, 'webp');
    assert.ok(figure.width >= 1000, 'Paper diagrams stay readable when opened at full size');
    for (const image of [...highlight.figures, ...(highlight.poster ? [highlight.poster] : [])]) {
      assert.ok(image.image.startsWith('/papers/') && image.image_alt);
      const media = await sharp(`public${image.image}`).metadata();
      assert.equal(media.width, image.width);
      assert.equal(media.height, image.height);
      assert.equal(media.format, 'webp');
      assert.ok(media.width >= 800, 'Supporting figures retain original labels for in-page enlargement');
    }
    assert.equal(Boolean(highlight.poster), !paper.slug.startsWith('Illusory_') && paper.slug !== 'Soft_Weighted_Machine_Unlearning', 'Use approved posters; NeurIPS and Soft-Weighted use framework fallbacks');
    if (language === 'en') englishImage = highlight.image;
    else assert.equal(highlight.image, englishImage, 'Both languages use the same authoritative figure');
  }
}
console.log('Updates: rolling four-year boundaries, full bilingual archive, five full-page assets and shared-acceptance order passed.');
