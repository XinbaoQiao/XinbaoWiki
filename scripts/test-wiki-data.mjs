import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

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

function assertFile(file) {
  assert.ok(fs.existsSync(path.join(root, file)), `${file} exists`);
}

for (const file of ['Xinbao_Qiao.md', 'index.md', 'log.md', 'CV.md']) {
  assertFile(`wiki/${file}`);
}

const bio = frontmatter('Xinbao_Qiao.md');
for (const field of ['name:', 'residence:', 'occupation:', 'education:', 'links:']) {
  assert.ok(bio.includes(field), `Xinbao_Qiao.md frontmatter includes ${field}`);
}

assert.match(read('Xinbao_Qiao.md'), /\[\[Publications\]\]/, 'home article links to Publications');
assert.match(read('Xinbao_Qiao.md'), /\[\[Research\]\]/, 'home article links to Research');
assert.match(read('CV.md'), /\/files\/XinbaoQiao_CV\.pdf/, 'CV page links to local PDF');

const publications = read('Publications.md');
assert.doesNotMatch(publications, /raw\.githubusercontent\.com/, 'publication index uses local images');
assert.match(publications, /\/papers\/model-collapse\/fid-trends-combined\.png/, 'model-collapse visual is local');

const allMarkdown = fs.readdirSync(wikiDir)
  .filter((file) => file.endsWith('.md'))
  .map((file) => read(file))
  .join('\n');
assert.doesNotMatch(allMarkdown, /backup\/old-homepage/, 'wiki no longer depends on backup-branch image URLs');

for (const file of [
  'public/images/Portrait.png',
  'public/images/Portrait-1.png',
  'public/papers/model-collapse/fid-trends-combined.png',
  'public/papers/hessian-free/ours.png',
  'public/papers/soft-weighted/utility-fairness.png',
  'public/files/XinbaoQiao_CV.pdf'
]) {
  assertFile(file);
}

console.log('Wiki data tests passed.');
