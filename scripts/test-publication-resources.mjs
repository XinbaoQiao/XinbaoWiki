import fs from 'node:fs';
import assert from 'node:assert/strict';
import matter from 'gray-matter';

const read = file => fs.readFileSync(file, 'utf8');
function kind(link) {
  if (link.public === false) return undefined;
  let u; try { u = new URL(link.url); } catch { return undefined; }
  if (u.protocol !== 'https:') return undefined;
  if (u.hostname === 'openreview.net' && u.pathname === '/forum' && u.searchParams.get('id')) return 'OpenReview';
  if (u.hostname === 'arxiv.org' && /^\/(abs|pdf)\/\d{4}\.\d{4,5}/.test(u.pathname)) return 'arXiv';
  if (u.hostname === 'github.com' && u.pathname.split('/').filter(Boolean).length === 2) return 'Code';
  if (u.hostname === 'ojs.aaai.org' && u.pathname.includes('/article/view/')) return 'Publisher';
  return undefined;
}
// The metadata retains supplementary downloads and conference sources. Only
// distinct paper resource types occupy the three CV/index icon slots.
function selected(links) {
  return ['OpenReview', 'arXiv', 'Code', 'Publisher'].flatMap(type => {
    const candidates = links.filter(link => kind(link) === type);
    const resource = candidates.find(link => !link.url.includes('/pdf/')) || candidates[0];
    return resource ? [resource] : [];
  }).slice(0, 3);
}
const example = [
  {label:'Publisher',url:'https://ojs.aaai.org/index.php/AAAI/article/view/39681'},
  {label:'PDF',url:'https://arxiv.org/pdf/2505.18783'},
  {label:'arXiv',url:'https://arxiv.org/abs/2505.18783'},
  {label:'Code',url:'https://github.com/public-owner/reproducible-paper'},
  {label:'OpenReview',url:'https://openreview.net/forum?id=paper'},
  {label:'conference',url:'https://aaai.org/conference/aaai/aaai-26/'},
];
assert.deepEqual(selected(example).map(kind), ['OpenReview','arXiv','Code'], 'OpenReview wins over Publisher when four resource types exist');
assert.deepEqual(selected(example.filter(link => link.label !== 'Code')).map(kind), ['OpenReview','arXiv','Publisher'], 'Publisher fills a real third type when Code is absent');
assert.equal(selected(example.filter(link => ['PDF','arXiv','conference'].includes(link.label))).length, 1, 'Duplicate arXiv downloads and venue homepages cannot fill slots');
assert.equal(kind({label:'Code',url:'https://github.com/owner/private-repository',public:false}), undefined, 'A private repository is not a public icon target');
assert.equal(selected([]).length, 0, 'Missing public resources stay missing');
assert.equal(kind({label:'GitHub',url:'https://github.com/owner'}), undefined, 'Author profiles are not code releases');

function urls(text) { return [...text.matchAll(/https:\/\/[^\s{}\])]+/g)].map(match => match[0]); }
function texArgs(text) {
  const entries=[]; let cursor=0;
  while ((cursor=text.indexOf('\\pubentry{',cursor)) >= 0) {
    cursor += '\\pubentry'.length; const args=[];
    for(let n=0;n<5;n++) {
      while (/\s/.test(text[cursor])) cursor++;
      assert.equal(text[cursor], '{'); const start=++cursor; let depth=1;
      while(depth && cursor<text.length) { if(text[cursor]==='{')depth++;if(text[cursor]==='}')depth--;cursor++; }
      assert.equal(depth,0);args.push(text.slice(start,cursor-1));
    }
    entries.push(args);
  }
  return entries;
}
const tex=texArgs(read('CV.tex').split('\\cvsection{Selected Publications}')[1]);
const plainTitle=title=>title.replace(/\\red\{([^}]+)\}/g,'$1');
for(const suffix of ['', '_zh']) {
  const cv=read(`wiki/CV${suffix}.md`); const index=read(`wiki/Publications${suffix}.md`);
  const rows=index.split('\n').filter(line=>line.startsWith('| **[['));
  assert.equal(rows.length,5,'All five published papers have a resource audit');
  for(const row of rows) {
    const slug=row.match(/^\| \*\*\[\[([^|\]]+)/)[1];
    const data=matter(read(`wiki/${slug}${suffix}.md`)).data;
    const metadata=selected(data.links || []);const expected=metadata.map(link=>link.url).sort();
    assert.equal(expected.length,3,`${slug}: three available public resource types must be present`);
    assert.equal(new Set(metadata.map(kind)).size,3,`${slug}: no duplicate resource types`);
    assert.deepEqual(urls(row.split(' | ')[0]).sort(),expected,`${slug}: publication list follows resource selection and precedence`);
    const englishTitle=matter(read(`wiki/${slug}.md`)).data.title;
    const start=cv.indexOf(englishTitle);assert.ok(start>=0,`${slug}: numbered CV title exists`);
    const end=cv.indexOf('\n- **Paper #',start);
    assert.deepEqual(urls(cv.slice(start,end<0?cv.length:end)).sort(),expected,`${slug}: bilingual CV matches paper resources`);
    const entry=tex.find(args=>plainTitle(args[0])===englishTitle);assert.ok(entry,`${slug}: PDF source entry exists`);
    assert.deepEqual(urls(entry[3]).sort(),expected,`${slug}: PDF icon targets agree with canonical resources`);
    const pair=matter(read(`wiki/${slug}${suffix?'':'_zh'}.md`)).data;
    assert.deepEqual(selected(pair.links).map(link=>link.url).sort(),expected,`${slug}: bilingual detail metadata agrees`);
    assert.ok(!expected.some(url=>new URL(url).searchParams.has('referrer')),`${slug}: omit tracking parameters`);
  }
}
for(const entry of tex.filter(args=>args[4]==='Under review.')) assert.equal(urls(entry[3]).length,0,'Do not expose private code or invent unverified manuscript resources');
assert.equal(tex.filter(args=>args[4]==='Under review.').length,2);
assert.ok(read('wiki/Illusory_Pattern_Perception_Drives_Spurious_Inference_in_Large_Language_Models.md').includes('https://arxiv.org/pdf/2610.07791'),'Paper detail retains the supplementary PDF');
assert.ok(!read('wiki/Soft_Weighted_Machine_Unlearning.md').includes('NusIoraPrivacy/illusory'),'Illusory code cannot be assigned to Beyond Binary');
console.log('Publication resources: five bilingual published papers have three distinct consistent icon targets; two manuscripts have no verified public targets. OpenReview precedence and private/duplicate exclusions passed.');
