import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { rehypeWikiOutline } from '../lib/wiki-outline.ts';

function render(markdown, label = 'On this page') {
  return renderToStaticMarkup(createElement(ReactMarkdown, {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [[rehypeWikiOutline, { label }]]
  }, markdown));
}

const fixture = [
  'Intro.[^note]',
  '## **Research** & [evidence](https://example.com)',
  '### A detail',
  '## Research & evidence',
  '## Research & evidence 2',
  '## 研究方向',
  '```md',
  '## Not a heading',
  '```',
  '[^note]: A footnote.'
].join('\n\n');
const html = render(fixture);
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(new Set(ids).size, ids.length, 'formatted and duplicate headings receive unique IDs');
assert.ok(ids.includes('section-research-evidence'));
assert.ok(ids.includes('section-research-evidence-2'));
assert.ok(ids.includes('section-research-evidence-2-2'));
assert.ok(ids.includes('section-研究方向'), 'Chinese headings remain readable');
assert.ok(ids.includes('section-a-detail'), 'subheadings support direct links');
assert.ok(ids.includes('footnote-label'), 'generated footnote accessibility ID is preserved');
const outline = html.slice(html.indexOf('<nav'), html.indexOf('</nav>'));
assert.ok(html.indexOf('<p>Intro.') < html.indexOf('<nav'), 'the introduction precedes section navigation');
assert.ok(html.indexOf('</nav>') < html.indexOf('<h2'), 'navigation introduces the first section');
const targets = [...outline.matchAll(/href="#([^"]+)"/g)].map((match) => decodeURIComponent(match[1]));
assert.equal(targets.length, 5, 'compact outline contains all top-level sections and footnotes');
for (const target of targets) assert.ok(ids.includes(target), `outline target ${target} resolves`);
assert.ok(!outline.includes('Not a heading'), 'fenced code is not mistaken for a heading');
assert.ok(!outline.includes('A detail'), 'subheadings do not crowd the compact outline');
assert.equal(html, render(fixture), 'IDs are deterministic and isolated between renders');
assert.ok(!render('## One section').includes('<nav'), 'short pages omit unnecessary navigation');
assert.match(render('## 一\n\n## 二', '本页目录'), /<nav class="wiki-article-contents" aria-label="本页目录">/);
console.log('Wiki outline rendering tests passed');
