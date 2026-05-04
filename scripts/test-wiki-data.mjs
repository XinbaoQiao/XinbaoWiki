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
assertFile('CV.tex');

const bio = frontmatter('Xinbao_Qiao.md');
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
assert.doesNotMatch(affiliation, /NUSRI/, 'affiliation excludes past institutions');
assert.match(bio, /image_caption: "Photograph taken in Singapore"/, 'English portrait caption identifies Singapore');
assert.match(frontmatterSlice(bio, 'education:', 'links:'), /label: "Shandong University"\n\s+url: "\/wiki\/Shandong_University\/"\n\s+detail: "\(BEng, 2022\)"/, 'English education links only school name and keeps degree detail separate');

const zhBio = frontmatter('Qiao_Xinbao_zh.md');
const zhAffiliation = frontmatterSlice(zhBio, 'affiliation:', 'education:');
assert.match(zhAffiliation, /香港中文大学/, 'Chinese affiliation lists current institution');
assert.doesNotMatch(zhAffiliation, /新加坡国立大学重庆研究院/, 'Chinese affiliation excludes past institutions');
assert.match(zhBio, /image_caption: "摄于新加坡"/, 'Chinese portrait caption identifies Singapore');
assert.match(frontmatterSlice(zhBio, 'education:', 'links:'), /label: "山东大学"\n\s+url: "\/wiki\/Shandong_University\/"\n\s+detail: "（工学学士，2022）"/, 'Chinese education links only school name and keeps degree detail separate');

assert.match(home, /\[\[Publications\]\]/, 'home article links to Publications');
assert.match(home, /\[\[Research\]\]/, 'home article links to Research');
assert.match(home, /30 September 2000/, 'home article includes birth date');
assert.match(zhHome, /2000年9月30日/, 'Chinese page includes birth date');
assert.match(read('CV.md'), /\/files\/XinbaoQiao_CV\.pdf/, 'CV page links to local PDF');

const contactCount = (home.match(/mailto:/g) || []).length;
assert.equal(contactCount, 1, 'home infobox contact exposes one email address');
assert.match(bio, /title: "Website"[\s\S]*https:\/\/xinbaoqiao\.github\.io\/XinbaoWiki\//, 'contact includes website');
assert.match(bio, /title: "GitHub"[\s\S]*https:\/\/github\.com\/XinbaoQiao/, 'contact includes GitHub');

const layout = fs.readFileSync(path.join(root, 'app/layout.tsx'), 'utf8');
assertFile('components/LanguageToggle.tsx');
const languageToggle = fs.readFileSync(path.join(root, 'components/LanguageToggle.tsx'), 'utf8');
assert.match(languageToggle, /usePathname/, 'language toggle is route-aware');
assert.match(languageToggle, /Qiao_Xinbao_zh/, 'language toggle links to Chinese version');
assert.match(languageToggle, /Xinbao_Qiao/, 'language toggle links back to English version');
assert.match(languageToggle, /English/, 'Chinese page can switch back to English');
assert.match(layout, /XinbaoWiki\/issues\/new/, 'Talk links to GitHub new issue page');
assert.match(layout, /XinbaoWiki\/commits\/main/, 'History links to GitHub commits');

const sidebar = fs.readFileSync(path.join(root, 'components/Sidebar.tsx'), 'utf8');
assert.doesNotMatch(sidebar, /Notable works/, 'sidebar no longer uses Notable works');

const publications = read('Publications.md');
assert.doesNotMatch(publications, /raw\.githubusercontent\.com/, 'publication index avoids backup-branch image URLs');
assert.doesNotMatch(publications, /!\[/, 'publication index is text-only');

assert.match(read('When_Sample_Selection_Bias_Precipitates_Model_Collapse.md'), /!\[[^\]]+\]\(\/papers\/model-collapse\/fid-trends-combined\.png\)/, 'model-collapse paper page displays a figure');
assert.match(read('Hessian_Free_Online_Certified_Unlearning.md'), /!\[[^\]]+\]\(\/papers\/hessian-free\/ours\.png\)/, 'Hessian-free paper page displays a figure');
assert.match(read('Soft_Weighted_Machine_Unlearning.md'), /!\[[^\]]+\]\(\/papers\/soft-weighted\/sec-5-1-1\.png\)/, 'soft-weighted paper page displays a figure');

const allMarkdown = fs.readdirSync(wikiDir)
  .filter((file) => file.endsWith('.md'))
  .map((file) => read(file))
  .join('\n');
assert.doesNotMatch(allMarkdown, /backup\/old-homepage/, 'wiki no longer depends on backup-branch image URLs');
assert.doesNotMatch(allMarkdown, /withheld\s+LLM\s+manuscript/i, 'withheld manuscript notes are not public content');

for (const page of ['Xinbao_Qiao.md', 'Qiao_Xinbao_zh.md', 'Publications.md']) {
  assert.doesNotMatch(read(page), /!\[/, `${page} remains text-only in the article body`);
}

const cvTex = fs.readFileSync(path.join(root, 'CV.tex'), 'utf8');
assert.match(cvTex, /xinbaoqiao@cuhk\.edu\.hk/, 'CV uses current CUHK email');
assert.doesNotMatch(cvTex, /xinbaoqiao@zju\.edu\.cn/, 'CV removes old Zhejiang email');
assert.match(cvTex, /The Chinese University of Hong Kong/, 'CV includes current PhD affiliation');
assert.match(cvTex, /When Sample Selection Bias Precipitates Model Collapse[\s\S]*ICML, 2026/, 'CV updates model-collapse paper status');
assert.doesNotMatch(cvTex, /withheld\s+LLM\s+manuscript/i, 'CV omits withheld manuscript notes');

const publicImages = fs.readdirSync(path.join(root, 'public/images')).filter((file) => /\.(png|jpe?g|gif|webp|svg|ico)$/i.test(file));
assert.deepEqual(publicImages, ['Portrait.png'], 'public site uses exactly one image');

for (const file of [
  'public/images/Portrait.png',
  'public/files/XinbaoQiao_CV.pdf',
  'public/papers/model-collapse/fid-trends-combined.png',
  'public/papers/model-collapse/barycenter-methodology.png',
  'public/papers/model-collapse/class-proportions-trend.png',
  'public/papers/hessian-free/ours.png',
  'public/papers/hessian-free/mia-tradeoff.png',
  'public/papers/soft-weighted/sec-5-1-1.png'
]) {
  assertFile(file);
}

console.log('Wiki data tests passed.');
