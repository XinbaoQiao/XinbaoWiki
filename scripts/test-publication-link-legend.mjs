import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PublicationLinkIcon, PublicationLinkLegend, publicationLinkTitle, publicationLinkKind, isPdfHref, publicationResourceLabel } from '../components/PublicationLinkLegend.ts';

for (const language of ['en', 'zh']) {
  const html = renderToStaticMarkup(createElement(PublicationLinkLegend, { language }));
  assert.equal((html.match(/<svg\b/g) || []).length, 4, 'The legend shows only the four existing icon types');
  assert.equal((html.match(/aria-hidden="true"/g) || []).length, 4, 'Decorative glyphs do not duplicate the readable labels');
  assert.ok(!html.includes('<a '), 'The explanatory row adds no new paper destinations');
  for (const label of ['OpenReview', 'arXiv', language === 'en' ? 'Code (GitHub)' : '代码（GitHub）', language === 'en' ? 'Publisher' : '出版论文页']) assert.ok(html.includes(label), label);
  assert.ok(!html.includes('Project Page'), 'No project-page use is invented');
}
assert.equal(publicationLinkTitle('https://openreview.net/forum?id=VLcmdFfRQc', 'en'), 'Paper on OpenReview');
assert.equal(publicationLinkTitle('https://arxiv.org/abs/2610.07791', 'en'), 'Preprint on arXiv');
assert.equal(publicationLinkTitle('https://arxiv.org/pdf/2610.07791', 'zh'), 'arXiv 论文 PDF');
assert.equal(publicationLinkTitle('https://github.com/XinbaoQiao/DynFrs', 'en'), 'Code on GitHub');
assert.equal(publicationLinkTitle('https://ojs.aaai.org/index.php/AAAI/article/view/39681', 'zh'), '出版论文页（AAAI）');
for (const href of ['https://github.com/XinbaoQiao', 'https://neurips.cc/Conferences/2026', '/files/XinbaoQiao_CV.pdf', 'javascript:alert(1)', 'not a URL']) assert.equal(publicationLinkTitle(href, 'en'), undefined, 'Non-paper targets are not relabeled as code or publisher pages');
for (const [href, kind] of [
  ['https://openreview.net/forum?id=VLcmdFfRQc', 'openreview'],
  ['https://arxiv.org/abs/2610.07791', 'arxiv'],
  ['https://github.com/NusIoraPrivacy/illusory', 'code'],
  ['https://ojs.aaai.org/index.php/AAAI/article/view/39681', 'publisher']
]) {
  const html = renderToStaticMarkup(createElement(PublicationLinkIcon, { href }));
  assert.ok(html.includes(`data-link-icon="${kind}"`));
  assert.ok(html.includes('aria-hidden="true"'), 'The readable link retains its accessible name');
}
assert.equal(renderToStaticMarkup(createElement(PublicationLinkIcon, { href: 'https://github.com/XinbaoQiao' })), '', 'A profile link is not given a paper-code icon');

assert.equal(publicationLinkKind('https://arxiv.org/pdf/2610.07791'), 'arxiv', 'arXiv /pdf/ keeps the arXiv marker, not a generic PDF badge');
assert.equal(publicationLinkKind('https://arxiv.org/abs/2610.07791'), 'arxiv');
assert.equal(publicationLinkKind('https://ojs.aaai.org/index.php/AAAI/article/view/39681/43642'), 'publisher');
assert.equal(publicationLinkKind('https://proceedings.iclr.cc/paper_files/paper/2025/file/50ee6db59fca8643dc625829d4a0eab9-Paper-Conference.pdf'), 'pdf');
assert.equal(publicationLinkKind('/files/XinbaoQiao_CV.pdf'), 'pdf');
assert.equal(isPdfHref('https://arxiv.org/pdf/2610.07791'), false, 'arXiv PDF paths often omit a .pdf suffix');
assert.equal(isPdfHref('/files/XinbaoQiao_CV.pdf'), true);
assert.equal(publicationResourceLabel('https://arxiv.org/pdf/2610.07791', 'en', 'PDF'), 'arXiv');
assert.equal(publicationResourceLabel('https://ojs.aaai.org/index.php/AAAI/article/view/39681/43642', 'en', 'PDF'), 'Publisher');
const pdfIcon = renderToStaticMarkup(createElement(PublicationLinkIcon, { href: '/files/XinbaoQiao_CV.pdf' }));
assert.ok(pdfIcon.includes('data-link-icon="pdf"'), 'Real .pdf assets can use the PDF glyph');
assert.ok(renderToStaticMarkup(createElement(PublicationLinkIcon, { href: 'https://arxiv.org/pdf/2610.07791' })).includes('data-link-icon="arxiv"'));

console.log('Bilingual publication icon legend and scoped accessible-name tests passed');
