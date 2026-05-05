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
assert.match(affiliation, /Department of Information Engineering/, 'affiliation includes current department');
assert.doesNotMatch(affiliation, /NUSRI/, 'affiliation excludes past institutions');
assert.doesNotMatch(bio, /^birth_place:/m, 'birthplace is kept in prose rather than the infobox');
assert.match(bio, /occupation:\n\s+- "PhD candidate"/, 'occupation uses PhD candidate');
assert.match(bio, /image_caption: "Photograph taken in Singapore"/, 'English portrait caption identifies Singapore');
const educationBlock = frontmatterSlice(bio, 'education:', 'links:');
assert.match(educationBlock, /label: "The Chinese University of Hong Kong"[\s\S]*label: "Zhejiang University"[\s\S]*label: "Shandong University"/, 'English education is reverse chronological');
assert.match(educationBlock, /label: "Shandong University"\n\s+url: "\/wiki\/Shandong_University\/"\n\s+detail: "\(BEng, 2022\)"/, 'English education links only school name and keeps degree detail separate');
assert.match(bio, /title: "OpenReview"[\s\S]*https:\/\/openreview\.net\/profile\?id=~Xinbao_Qiao1/, 'contact replaces Website with OpenReview');

const zhBio = frontmatter('Qiao_Xinbao_zh.md');
const zhAffiliation = frontmatterSlice(zhBio, 'affiliation:', 'education:');
assert.match(zhAffiliation, /香港中文大学/, 'Chinese affiliation lists current institution');
assert.match(zhAffiliation, /信息工程系/, 'Chinese affiliation includes current department');
assert.doesNotMatch(zhAffiliation, /新加坡国立大学重庆研究院/, 'Chinese affiliation excludes past institutions');
assert.doesNotMatch(zhBio, /^birth_place:/m, 'Chinese birthplace is kept in prose rather than the infobox');
assert.match(zhBio, /image_caption: "摄于新加坡"/, 'Chinese portrait caption identifies Singapore');
const zhEducationBlock = frontmatterSlice(zhBio, 'education:', 'links:');
assert.match(zhEducationBlock, /label: "香港中文大学"[\s\S]*label: "浙江大学"[\s\S]*label: "山东大学"/, 'Chinese education is reverse chronological');
assert.match(zhEducationBlock, /label: "山东大学"\n\s+url: "\/wiki\/Shandong_University\/"\n\s+detail: "（工学学士，2022）"/, 'Chinese education links only school name and keeps degree detail separate');

assert.match(home, /\[\[Publications\]\]/, 'home article links to Publications');
assert.match(home, /\[\[Research\]\]/, 'home article links to Research');
assert.match(home, /30 September 2000/, 'home article includes birth date');
assert.match(zhHome, /2000年9月30日/, 'Chinese page includes birth date');
assert.match(read('CV.md'), /\/files\/XinbaoQiao_CV\.pdf/, 'CV page links to local PDF');

const contactCount = (home.match(/mailto:/g) || []).length;
assert.equal(contactCount, 1, 'home infobox contact exposes one email address');
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
assert.match(sidebar, /'AI_and_Networks': 'AI and Networks'/, 'sidebar labels AI and Networks as a short topic');
assert.match(sidebar, /'Synthetic_Data_and_Model_Collapse': 'Synthetic Data'/, 'sidebar shortens synthetic-data topic');
assert.match(sidebar, /'Data_Centric_Machine_Learning': 'Data Centric ML'/, 'sidebar shortens data-centric topic');
assert.match(sidebar, /const education = \['The_Chinese_University_of_Hong_Kong', 'Zhejiang_University', 'Shandong_University'\]/, 'sidebar education is reverse chronological');
assert.doesNotMatch(sidebar, /Synthetic Data and Model Collapse/, 'sidebar avoids long research-topic labels');
assert.doesNotMatch(sidebar, /Data Centric Machine Learning/, 'sidebar avoids long research-topic labels');

const publications = read('Publications.md');
assert.doesNotMatch(publications, /raw\.githubusercontent\.com/, 'publication index avoids backup-branch image URLs');
assert.doesNotMatch(publications, /!\[/, 'publication index is text-only');
assert.doesNotMatch(publications, /Soft-Weighted Machine Unlearning/, 'publication index uses the final AAAI title');
assert.match(publications, /DynFrs: An Efficient Framework for Machine Unlearning in Random Forest/, 'publication index uses full DynFrs title');

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

assert.match(home, /\[\^xinbao-name\]/, 'home article uses a real footnote for the given name');
assert.match(home, /^\[\^xinbao-name\]:/m, 'home article defines the given-name footnote');
assert.match(home, /\[\^timeline-note\]/, 'home article uses a timeline/status footnote');
assert.match(home, /^\[\^timeline-note\]:/m, 'home article defines the timeline/status footnote');
assert.match(zhHome, /\[\^xinbao-name-zh\]/, 'Chinese home article uses a real footnote');
assert.match(zhHome, /^\[\^xinbao-name-zh\]:/m, 'Chinese home article defines the given-name footnote');

const acceptedPublicationPages = [
  'When_Sample_Selection_Bias_Precipitates_Model_Collapse.md',
  'Soft_Weighted_Machine_Unlearning.md',
  'Hessian_Free_Online_Certified_Unlearning.md',
  'DynFrs.md'
];

for (const page of acceptedPublicationPages) {
  const fm = frontmatter(page);
  const body = read(page);
  assert.doesNotMatch(fm, /^categories:/m, `${page} publication infobox omits categories`);
  assert.match(fm, /^location:/m, `${page} publication infobox includes conference location`);
  for (const section of ['## Overview', '## Method', '## Key formula', '## Results', '## Placement']) {
    assert.match(body, new RegExp(`^${section}$`, 'm'), `${page} has ${section}`);
  }
  assert.match(body, /```text\n[\s\S]*?```/, `${page} includes a readable formula block`);
}

const learnPageFm = frontmatter('Learn_What_Matters_Data_Pruning_for_Efficient_Decentralized_Learning.md');
assert.doesNotMatch(learnPageFm, /^categories:/m, 'under-review manuscript infobox omits categories');

assert.match(read('When_Sample_Selection_Bias_Precipitates_Model_Collapse.md'), /!\[[^\]]+\]\(\/papers\/model-collapse\/fid-trends-combined\.png\)/, 'model-collapse paper page displays a figure');
assert.match(read('Hessian_Free_Online_Certified_Unlearning.md'), /!\[[^\]]+\]\(\/papers\/hessian-free\/ours\.png\)/, 'Hessian-free paper page displays a figure');
assert.match(read('Soft_Weighted_Machine_Unlearning.md'), /!\[[^\]]+\]\(\/papers\/soft-weighted\/sec-5-1-1\.png\)/, 'soft-weighted paper page displays a figure');
assert.match(read('DynFrs.md'), /!\[[^\]]+\]\(\/papers\/dynfrs\/lazy-tags\.png\)/, 'DynFrs paper page displays a figure');
assert.match(read('Hessian_Free_Online_Certified_Unlearning.md'), /!\[[^\]]+\]\(\/papers\/hessian-free\/poster\.png\)/, 'Hessian-free paper page includes poster image');
assert.match(read('DynFrs.md'), /!\[[^\]]+\]\(\/papers\/dynfrs\/poster\.png\)/, 'DynFrs paper page includes poster image');
assert.match(read('Soft_Weighted_Machine_Unlearning.md'), /!\[[^\]]+\]\(\/papers\/soft-weighted\/framework\.png\)/, 'soft-weighted paper page includes framework image');

const infobox = fs.readFileSync(path.join(root, 'components/Infobox.tsx'), 'utf8');
assert.match(infobox, /location: 'Conference location'/, 'infobox labels conference location');
assert.match(infobox, /department: 'Department'/, 'infobox supports institution department rows');
assert.match(infobox, /dates: 'Dates'/, 'infobox supports institution date rows');
assert.match(infobox, /place: 'Location'/, 'infobox supports institution location rows');
assert.doesNotMatch(infobox, /categories: 'Categories'/, 'infobox does not label categories');
assert.doesNotMatch(infobox, /'categories'/, 'infobox does not render categories rows');

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
  assert.match(body, /\[\^[^\]]+\]/, `${page} uses explanatory footnotes`);
  assert.ok(body.split(/\s+/).length >= 180, `${page} is not a placeholder institution page`);
}

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
  assert.match(body, /\[\^[^\]]+\]/, `${page} uses footnotes for background`);
  assert.ok(body.split(/\s+/).length >= 120, `${page} is no longer a one-paragraph placeholder`);
}

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
  'public/institutions/cuhk-emblem.svg',
  'public/institutions/zhejiang-university-logo.png',
  'public/institutions/shandong-university-logo.png',
  'public/institutions/nusri-cq-logo.svg',
  'public/files/XinbaoQiao_CV.pdf',
  'public/papers/model-collapse/fid-trends-combined.png',
  'public/papers/model-collapse/barycenter-methodology.png',
  'public/papers/model-collapse/class-proportions-trend.png',
  'public/papers/hessian-free/ours.png',
  'public/papers/hessian-free/mia-tradeoff.png',
  'public/papers/hessian-free/poster.png',
  'public/papers/soft-weighted/sec-5-1-1.png',
  'public/papers/soft-weighted/framework.png',
  'public/papers/dynfrs/lazy-tags.png',
  'public/papers/dynfrs/poster.png'
]) {
  assertFile(file);
}

console.log('Wiki data tests passed.');
