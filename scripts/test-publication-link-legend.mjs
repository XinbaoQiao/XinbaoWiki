import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PublicationLinkLegend, publicationLinkTitle } from '../components/PublicationLinkLegend.ts';

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
console.log('Bilingual publication icon legend and scoped accessible-name tests passed');
