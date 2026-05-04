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

for (const file of ['Xinbao_Qiao.md', 'Qiao_Xinbao_zh.md', 'index.md', 'log.md', 'CV.md']) {
  assertFile(`wiki/${file}`);
}

const bio = frontmatter('Xinbao_Qiao.md');
for (const field of ['name:', 'residence:', 'occupation:', 'education:', 'links:']) {
  assert.ok(bio.includes(field), `Xinbao_Qiao.md frontmatter includes ${field}`);
}

assert.match(read('Xinbao_Qiao.md'), /\[\[Publications\]\]/, 'home article links to Publications');
assert.match(read('Xinbao_Qiao.md'), /\[\[Research\]\]/, 'home article links to Research');
assert.match(read('Xinbao_Qiao.md'), /30 September 2000/, 'home article includes birth date');
assert.match(read('Qiao_Xinbao_zh.md'), /2000年9月30日/, 'Chinese page includes birth date');
assert.match(read('CV.md'), /\/files\/XinbaoQiao_CV\.pdf/, 'CV page links to local PDF');

const contactCount = (read('Xinbao_Qiao.md').match(/mailto:/g) || []).length;
assert.equal(contactCount, 1, 'home infobox contact exposes one email address');

const layout = fs.readFileSync(path.join(root, 'app/layout.tsx'), 'utf8');
assert.match(layout, /\/wiki\/Qiao_Xinbao_zh\//, 'topbar links to Chinese version');
assert.match(layout, /XinbaoWiki\/issues/, 'Talk links to GitHub Issues');

const sidebar = fs.readFileSync(path.join(root, 'components/Sidebar.tsx'), 'utf8');
assert.doesNotMatch(sidebar, /Notable works/, 'sidebar no longer uses Notable works');

const publications = read('Publications.md');
assert.doesNotMatch(publications, /raw\.githubusercontent\.com/, 'publication index avoids backup-branch image URLs');
assert.doesNotMatch(publications, /!\[/, 'publication index is text-only');

const allMarkdown = fs.readdirSync(wikiDir)
  .filter((file) => file.endsWith('.md'))
  .map((file) => read(file))
  .join('\n');
assert.doesNotMatch(allMarkdown, /backup\/old-homepage/, 'wiki no longer depends on backup-branch image URLs');
assert.doesNotMatch(allMarkdown, /\/papers\//, 'wiki does not display paper figures');
assert.doesNotMatch(allMarkdown, /!\[/, 'wiki markdown does not display inline images');
assert.doesNotMatch(allMarkdown, /LLMs_Are_More_Prone_Than_Humans/, 'withheld LLM manuscript is not public-linked');

const publicImages = fs.readdirSync(path.join(root, 'public/images')).filter((file) => /\.(png|jpe?g|gif|webp|svg|ico)$/i.test(file));
assert.deepEqual(publicImages, ['Portrait.png'], 'public site uses exactly one image');

for (const file of [
  'public/images/Portrait.png',
  'public/files/XinbaoQiao_CV.pdf'
]) {
  assertFile(file);
}

console.log('Wiki data tests passed.');
