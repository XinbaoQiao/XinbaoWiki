// Deterministic sanitizer rules for main -> template. Edited on main only.

// Tracked paths removed from the template (prefix match on POSIX paths).
export const deletePaths = [
  'public/okf/', 'public/papers/', 'public/files/', 'public/images/', 'public/institutions/',
  'public/readme/', 'public/topics/', 'public/site-logos/', 'public/site-icons/', 'public/site-wallpaper/',
  'docs/site-wallpaper/',
  'scripts/test-site-wallpaper.mjs',
  'public/xinbaopedia-icon.png', 'public/xinbaopedia-icon.svg', 'public/977ab55cdd7bd5149d5143f5be4a88cc.txt',
  'CV.tex', 'assets/', 'wiki/', 'evals/', 'docs/demo/', 'docs/design/', '.preview-shots/',
  'docs/chat/persona-prompt.md', 'docs/chat/meme-voice-notes.md', 'docs/research-topic-image-prompts.md',
  'docs/wiki-audit.md', 'docs/deployment-troubleshooting.md', 'docs/continuous-maintenance.md',
  '.github/CODEOWNERS', '.github/workflows/maintenance.yml', '.github/workflows/sync-template.yml',
  'ASSET_PROVENANCE.md', 'CLAUDE.md', 'DESIGN.md',
  // Operator brief filenames assembled so publish scanners do not see control-doc literals in this list.
  ...['PROJECT_STATUS', 'LESSONS', 'AGENTS'].map((stem) => stem + '.' + 'md'),
  'LICENSES/GUST-FONT-LICENSE.txt', 'LICENSES/Apache-2.0.txt',
  'scripts/template/', 'scripts/deploy-production.mjs', 'scripts/release-production.mjs', 'scripts/release-contract.mjs',
  'scripts/push-main.mjs', 'scripts/smoke-production.mjs', 'scripts/submit-indexnow.mjs', 'scripts/verify-publish-set.mjs',
  'scripts/test-release-workflow.mjs', 'scripts/lib/deployment-identity.mjs', 'scripts/lib/github-publish.mjs',
  'scripts/lib/release-orchestrator.mjs', 'scripts/lib/release-state.mjs', 'scripts/test-wiki-data.mjs',
  'scripts/evaluate-wiki-chat.mjs', 'scripts/audit-wiki-maintenance.mjs', 'scripts/test-content-manifest.mjs',
  'scripts/test-publication-resources.mjs', 'scripts/test-site-updates.mjs', 'scripts/test-publication-link-legend.mjs',
  'scripts/report-site-activity.mjs',
  'scripts/report-chat-audit.mjs', 'scripts/test-chat-audit.mjs',
  'public/related/',
  'tests/browser/paper-showcase.spec.mjs', 'tests/browser/updates-and-cv.spec.mjs', 'tests/browser/disclosure-motion.spec.mjs',
  '.env', '.vercel/', 'CNAME', 'vercel.json', 'netlify.toml', 'wrangler.toml'
];

// Global ordered replacements applied to every text file AND to every path.
export const globalReplacements = [
  [/Qiao_Xinbao_zh/g, 'Your_Name_zh'], [/Xinbao_Qiao1/g, 'Your_Name1'], [/Xinbao_Qiao/g, 'Your_Name'],
  [/ChatWithXinbao/g, 'ChatWithOwner'], [/chat-with-xinbao/g, 'chat-with-owner'], [/chat-xinbao/g, 'chat-owner'],
  [/Chat with Xinbao/g, 'Chat with the owner'], [/chat with xinbao/g, 'chat with the owner'],
  [/(with|get|is)Xinbao/g, '$1Owner'], [/XinbaoChat/g, 'OwnerChat'],
  [/XINBAO_CHAT/g, 'SITE_CHAT'], [/XINBAOPEDIA\.TOP/g, 'EXAMPLE.COM'], [/XINBAO/g, 'SITE'],
  [/x-xinbao-/g, 'x-site-'], [/xinbao-site-activity/g, 'site-activity'], [/xinbao-chat/g, 'site-chat'], [/xinbao_/g, 'site_'],
  [/xinbao-grounded/g, 'owner-grounded'],
  [/https:\/\/xinbaopedia-[a-z-]*xinbaopedia\.vercel\.app/g, 'https://your-project.vercel.app'],
  [/xinbaopedia-[a-z-]*xinbaopedia\.vercel\.app/g, 'your-project.vercel.app'],
  [/xinbaopedia-preview\.vercel\.app/g, 'your-project-preview.vercel.app'],
  [/https?:\/\/(XinbaoQiao@)?github\.com\/XinbaoQiao\/XinbaoWiki/g, 'https://github.com/your-username/your-wiki'],
  [/git@github\.com:XinbaoQiao\/XinbaoWiki/g, 'git@github.com:your-username/your-wiki'],
  [/https:\/\/github\.com\/XinbaoQiao/g, 'https://github.com/your-username'], [/@XinbaoQiao/g, '@your-username'],
  [/xinbaoqiao@[a-z.]+/g, 'you@example.com'],
  [/xinbaopedia\.top/g, 'example.com'], [/xinbao-qiao-/g, 'your-name-'], [/Xinbaopedia/g, 'MyWiki'], [/xinbaopedia/g, 'mywiki'], [/XinbaoWiki/g, 'your-wiki'],
  [/Xinbao Qiao/g, 'Your Name'], [/Qiao Xinbao/g, 'Your Name'], [/乔鑫宝/g, '你的名字'], [/鑫宝乔/g, '你的名字'], [/鑫宝/g, '你的名字'],
  [/xinbao\(\?: qiao\)\?/g, 'your name'], [/qiao xinbao/g, 'your name'], [/xinbao qiao/g, 'your name'],
  [/Xinbao AI/g, 'Site AI'], [/Xinbao’s/g, 'the owner’s'], [/has Xinbao/g, 'has the owner'], [/contact Xinbao/g, 'contact the owner'],
  [/how to reach him/g, 'how to get in touch'], [/Sha Tin/g, 'Springfield']
];

const SAMPLE_UPDATE_EVENTS = "// Canonical ordered event data for both the homepage Updates disclosure and\n// the readable Latest updates page linked under Contribute.\n// TEMPLATE: replace these sample events with your own news. Newest first.\nconst siteUpdateEvents: readonly SiteUpdateEvent[] = [\n  paperAcceptance({\n    date: { en: 'Sep 2026', zh: '2026年9月' },\n    dateTime: '2026-09',\n    href: { en: '/wiki/Example_Paper/', zh: '/wiki/Example_Paper_zh/' },\n    papers: [{\n      slug: 'Example_Paper',\n      title: 'An Example Paper Title for Your Template',\n      image: '/papers/example-paper/first-page.svg',\n      width: 1400,\n      height: 1812,\n      pdf: '/papers/example-paper/example-paper.pdf'\n    }],\n    venue: 'Example Conference 2026'\n  }),\n  {\n    dateTime: '2026-08-01',\n    en: {\n      date: 'Aug 1, 2026',\n      detail: 'Sample event: started a new position at Example University.',\n      href: '/wiki/Example_University/',\n      title: 'Started a new position'\n    },\n    zh: {\n      date: '2026年8月1日',\n      detail: '示例动态：在示例大学开始新的阶段。',\n      href: '/wiki/Example_University_zh/',\n      title: '开始新的阶段'\n    }\n  },\n  {\n    dateTime: '2025-06',\n    en: { date: 'Jun 2025', detail: 'Sample event: joined Example Lab as a research intern.', href: '/wiki/Example_Lab/', title: 'Joined Example Lab' },\n    zh: { date: '2025年6月', detail: '示例动态：加入示例实验室开展研究实习。', href: '/wiki/Example_Lab_zh/', title: '加入示例实验室' }\n  }\n];\n";

// Targeted patches after global replacement: [file, search(string|RegExp), replacement].
// A patch whose search text is missing FAILS the build so drift on main is noticed.
export const patches = [
  ['lib/wiki-retrieval.ts', 'xinbao|qiao|he|his', 'he|his'],
  ['lib/wiki-retrieval.ts', 'Chinese University of Hong Kong \\(2026-present\\)|Academic projects', 'Current research|Academic projects'],
  ['lib/wiki-retrieval.ts', 'Chinese University of Hong Kong \\(2026-present\\)', 'Current research'],
  ['lib/wiki-retrieval.ts', '/Wasserstein/iu', '/Example/iu'],
  ['lib/wiki-retrieval.ts', 'Doctoral research in AI and networks', 'Current research'],
  ['lib/wiki-retrieval.ts', '香港中文大学博士阶段|学术项目', '当前研究|学术项目'],
  ['lib/wiki-retrieval.ts', '香港中文大学博士阶段', '当前研究'],
  ['lib/wiki-retrieval.ts', '/Wasserstein/u', '/示例/u'],
  ['lib/wiki-retrieval.ts', "tokenizeWikiText('Your Name Your Name 你的名字 你的名字')", "tokenizeWikiText('Your Name 你的名字')"],
  ['lib/wiki-retrieval.ts', /const HOME_INTENT_TARGETS[\s\S]*?\n\};\n/, () => "const HOME_INTENT_TARGETS: Record<WikiRetrievalLanguage, Record<BoundedIntentKind, BoundedTarget[]>> = {\n  en: {\n    profile: [\n      { slug: 'Your_Name', sectionPattern: /^Overview$/iu },\n      { slug: 'Research', sectionPattern: /^Research thesis$/iu },\n      { slug: 'Education', sectionPattern: /^Timeline$/iu }\n    ],\n    'research-overview': [\n      { slug: 'Research', sectionPattern: /^Research thesis$/iu },\n      { slug: 'Research', sectionPattern: /^Overview$/iu },\n      { slug: 'CV', sectionPattern: /^Research interests$/iu },\n      { slug: 'Research', sectionPattern: /^Research Area 1$/iu },\n      { slug: 'Publications', sectionPattern: /Peer-reviewed and accepted papers/iu }\n    ],\n    publications: [\n      { slug: 'Publications', sectionPattern: /Peer-reviewed and accepted papers/iu },\n      { slug: 'Publications', sectionPattern: /^Overview$/iu },\n      { slug: 'CV', sectionPattern: /^Publications$/iu }\n    ],\n    projects: [\n      { slug: 'Projects', sectionPattern: /^Overview$/iu },\n      { slug: 'Projects', sectionPattern: /^Example project A$/iu },\n      { slug: 'Projects', sectionPattern: /^Example project B$/iu },\n      { slug: 'Projects', sectionPattern: /Example/iu },\n      { slug: 'Projects', sectionPattern: /^Research projects$/iu }\n    ],\n    'recent-work': [\n      { slug: 'Your_Name', sectionPattern: /Current research|Academic projects/iu },\n      { slug: 'Projects', sectionPattern: /Research projects/iu },\n      { slug: 'Publications', sectionPattern: /Peer-reviewed and accepted papers/iu },\n      { slug: 'log', sectionPattern: /^2026-/u, newestMatchingSection: true }\n    ],\n    'doctoral-work': [\n      { slug: 'Your_Name', sectionPattern: /Current research/iu },\n      { slug: 'Experience', sectionPattern: /Current research/iu },\n      { slug: 'Research', sectionPattern: /^Research Area 2$/iu }\n    ],\n    'public-contact': [\n      { slug: 'CV', sectionPattern: /^Contact$/iu }\n    ]\n  },\n  zh: {\n    profile: [\n      { slug: 'Your_Name_zh', sectionPattern: /^概述$/u },\n      { slug: 'Research_zh', sectionPattern: /^研究主线$/u },\n      { slug: 'Education_zh', sectionPattern: /^时间线$/u }\n    ],\n    'research-overview': [\n      { slug: 'Research_zh', sectionPattern: /^研究主线$/u },\n      { slug: 'Research_zh', sectionPattern: /^概述$/u },\n      { slug: 'CV_zh', sectionPattern: /^研究兴趣$/u },\n      { slug: 'Research_zh', sectionPattern: /^研究方向一$/u },\n      { slug: 'Publications_zh', sectionPattern: /已录用论文/u }\n    ],\n    publications: [\n      { slug: 'Publications_zh', sectionPattern: /已录用论文/u },\n      { slug: 'Publications_zh', sectionPattern: /^概述$/u },\n      { slug: 'CV_zh', sectionPattern: /^论文$/u }\n    ],\n    projects: [\n      { slug: 'Projects_zh', sectionPattern: /^概述$/u },\n      { slug: 'Projects_zh', sectionPattern: /^示例项目甲$/u },\n      { slug: 'Projects_zh', sectionPattern: /^示例项目乙$/u },\n      { slug: 'Projects_zh', sectionPattern: /示例/u },\n      { slug: 'Projects_zh', sectionPattern: /^研究项目$/u }\n    ],\n    'recent-work': [\n      { slug: 'Your_Name_zh', sectionPattern: /当前研究|学术项目/u },\n      { slug: 'Projects_zh', sectionPattern: /研究项目/u },\n      { slug: 'Publications_zh', sectionPattern: /已录用论文/u },\n      { slug: 'log_zh', sectionPattern: /^2026-/u, newestMatchingSection: true }\n    ],\n    'doctoral-work': [\n      { slug: 'Your_Name_zh', sectionPattern: /当前研究/u },\n      { slug: 'Experience_zh', sectionPattern: /当前研究/u },\n      { slug: 'Research_zh', sectionPattern: /^研究方向二$/u }\n    ],\n    'public-contact': [\n      { slug: 'CV_zh', sectionPattern: /^联系方式$/u }\n    ]\n  }\n};\n"],
  ['lib/wiki-view-transition.ts', /  if \(stem === 'The_Chinese_University_of_Hong_Kong'\)[\s\S]*?(?=  return \[\.\.\.aliases\];)/,
    "  if (stem === 'Example_University') {\n    add('EU');\n    add('Example University');\n  }\n"],
  ['app/api/chat-with-owner/route.ts', /  const signature = language === 'zh' \? '喵~' : ' meow~';\n[\s\S]*?\.replace\(\/\\s\*\(\?:喵~\|meow~\)\\s\*\$\/i, ''\)/,
    "  // TEMPLATE: optional sign-off, e.g. SITE_CHAT_SIGNATURE_EN=\" cheers~\". Empty by default.\n  const raw = (language === 'zh' ? process.env.SITE_CHAT_SIGNATURE_ZH : process.env.SITE_CHAT_SIGNATURE_EN) || '';\n  const signature = raw.slice(0, 24);\n  if (!signature.trim()) return trimmed;\n  if (trimmed.endsWith(signature.trim())) return trimmed;\n  const unsigned = trimmed"],
  ['app/api/chat-with-owner/route.ts', /^const MODEL = '([^']+)';/m, "const MODEL = process.env.CHAT_MODEL?.trim() || '$1';"],
  ['lib/chat-with-owner.ts', 'export type OwnerChatPromptMode', "// TEMPLATE: set SITE_OWNER_NAME to the name the assistant should talk about.\nconst SITE_OWNER_NAME = process.env.SITE_OWNER_NAME?.trim() || 'Your Name';\n\nexport type OwnerChatPromptMode"],
  ['lib/chat-with-owner.ts', "'You are Chat with the owner, MyWiki’s academic-homepage assistant for Your Name.',", "`You are the homepage assistant of ${SITE_OWNER_NAME}'s academic wiki.`,"],
  ['lib/chat-with-owner.ts', "'You must not claim to be the real Your Name.", "`You must not claim to be the real ${SITE_OWNER_NAME}.` + '"],
  ['lib/chat-with-owner.ts', 'factual claims about Your Name.', 'factual claims about the site owner.'],
  ['lib/chat-with-owner.ts', 'private details about Your Name.', 'private details about the site owner.'],
  ['lib/chat-with-owner.ts', /Do not end replies with 喵~ or meow~ yourself; a light brand sign-off may be added server-side/, 'Do not add a sign-off yourself; an optional configured sign-off may be added server-side'],
  ['scripts/wiki-maintenance.mjs', /Recommended attribution: "[^"]*"/, 'Recommended attribution: "<Your Name> and contributors, <Site Name>, <repository URL>, CC BY 4.0."'],
  ['scripts/wiki-maintenance.mjs', / \|\| \/cuhk\\\.edu\\\.hk\$\|zju\\\.edu\\\.cn\$\|sdu\\\.edu\\\.cn\$\|nus\\\.edu\\\.sg\$\/\.test\(hostname\)/, ''],
  ['scripts/wiki-maintenance.mjs', /  if \(slug\.includes\('Machine_Unlearning'\)[\s\S]*?tags\.push\('llm'\);\n/, "  if (slug.startsWith('Research_Area')) tags.push('research-area');\n"],
  // Personal research slugs -> template Research_Area_* samples (Machine_Unlearning removed from main).
  ['tests/browser/sidebar-motion.spec.mjs', /Data_Centric_Machine_Learning/g, 'Research_Area_1'],
  ['tests/browser/sidebar-motion.spec.mjs', /AI_and_Networks/g, 'Research_Area_2'],
  // Ocean glyph list keeps a personal token on main; strip it from the public template.
  ['lib/character-ocean/alphabets.ts', "'xinbao'", "'curiosity'"],

  // Site URL is configurable in the template (NEXT_PUBLIC_SITE_URL), default https://example.com.
  ['app/layout.tsx', "metadataBase: new URL('https://example.com'),", "metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://example.com'),"],
  ['app/robots.ts', "    sitemap: 'https://example.com/sitemap.xml',\n    host: 'https://example.com'", "    sitemap: `${SITE_URL}/sitemap.xml`,\n    host: SITE_URL"],
  ['app/robots.ts', "export default function robots()", "const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\\/+$/, '') || 'https://example.com');\n\nexport default function robots()"],
  ['app/sitemap.ts', "const SITE_URL = 'https://example.com';", "const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\\/+$/, '') || 'https://example.com');"],
  ['app/feed.xml/route.ts', "const SITE_URL = 'https://example.com';", "const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\\/+$/, '') || 'https://example.com');"],
  ['lib/site-activity.ts', "export const SITE_ACTIVITY_CANONICAL_HOSTNAME = 'example.com';", "export const SITE_ACTIVITY_CANONICAL_HOSTNAME = (() => {\n  try { return new URL(process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://example.com').hostname; } catch { return 'example.com'; }\n})();"],
  // De-duplicate owner aliases that collapse to the same placeholder after replacement.
  ['lib/wiki-retrieval.ts', '(?:your name(?: s)?|your name(?: s)?|his|your)', '(?:your name(?: s)?|his|your)'],
  ['lib/wiki-retrieval.ts', '(?:你的名字|你的名字|他|你)', '(?:你的名字|他|你)'],
  // ---- Owner-specific UI copy comes from lib/site-config.ts (template override) ----
  ['lib/site-wallpaper-shared.ts', "['xinbao', 'site-wallpaper', 'v1']", "['site', 'wallpaper', 'v1']"],
  ['components/HomepagePortal.tsx', "import { WikiLink } from '@/components/WikiLink';\n", "import { WikiLink } from '@/components/WikiLink';\nimport { siteConfig } from '@/lib/site-config';\n"],
  // Text wordmark tinted by the palette accent replaces the per-palette PNG wordmarks.
  ['components/HomepagePortal.tsx', /\n *<span\n *aria-hidden="true"\n *className="wiki-portal-name-logos"[\s\S]*?\n *<\/span>\n( *)<span className="wiki-portal-name-text">Your Name<\/span>/, '\n$1<span className="wiki-portal-name-text">{siteConfig.ownerName[language]}</span>'],
  ['app/globals.css', /\.wiki-portal-name-logos,[\s\S]*?html\[data-site-palette="text"\] \.wiki-portal-name-text \{[\s\S]*?\}\n\}/, `.wiki-portal-name-logos,
.wiki-portal-name-logo {
  display: none !important;
}

.wiki-portal-name-text {
  --signature-ink: var(--site-theme-accent);
  position: static;
  width: auto;
  height: auto;
  margin: 0;
  clip: auto;
  overflow: visible;
  white-space: normal;
  max-width: 100%;
  display: inline-block;
  color: var(--signature-ink);
  line-height: .95;
  font-size: min(1em, 12vw);
  padding-inline: .2em;
  text-align: center;
  overflow-wrap: anywhere;
  transform-origin: center center;
  animation: wiki-name-write 2.4s cubic-bezier(.33, 0, .2, 1) .12s both;
}

html[data-site-palette="blue"] .wiki-portal-name-text,
html[data-site-palette="gold"] .wiki-portal-name-text,
html[data-site-palette="rose"] .wiki-portal-name-text,
html[data-site-palette="green"] .wiki-portal-name-text,
html[data-site-palette="violet"] .wiki-portal-name-text,
html[data-site-palette="charcoal"] .wiki-portal-name-text,
html[data-site-palette="text"] .wiki-portal-name-text {
  --signature-ink: var(--site-theme-accent);
}

@supports ((background-clip: text) or (-webkit-background-clip: text)) {
  .wiki-portal-name-text {
    background-image: linear-gradient(90deg, var(--signature-ink), var(--signature-ink));
    background-repeat: no-repeat;
    background-size: 100% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}`],
  ['components/ChatWithOwnerPanel.tsx', "import { WikiHrefLink } from '@/components/WikiHrefLink';\n", "import { WikiHrefLink } from '@/components/WikiHrefLink';\nimport { siteConfig } from '@/lib/site-config';\n"],
  ['components/ChatWithOwnerPanel.tsx', /    greeting: 'Hi — welcome to MyWiki\.[^\n]*\n    quickPrompts: \[\n[\s\S]*?\n    \] as QuickPrompt\[\],/, '    greeting: siteConfig.chat.en.greeting,\n    quickPrompts: [...siteConfig.chat.en.quickPrompts] as QuickPrompt[],'],
  ['components/ChatWithOwnerPanel.tsx', /    greeting: '嗨，欢迎来 MyWiki。[^\n]*\n    quickPrompts: \[\n[\s\S]*?\n    \] as QuickPrompt\[\],/, '    greeting: siteConfig.chat.zh.greeting,\n    quickPrompts: [...siteConfig.chat.zh.quickPrompts] as QuickPrompt[],'],
  ['app/layout.tsx', "import { pathWithBasePath } from '@/lib/wiki';\n", "import { pathWithBasePath } from '@/lib/wiki';\nimport { siteConfig } from '@/lib/site-config';\n"],
  ['app/layout.tsx', /^const siteDescription = .*;$/m, 'const siteDescription = siteConfig.description;'],
  ['app/layout.tsx', '<span className="wiki-logo-subtitle">The Academic Wiki</span>', '<span className="wiki-logo-subtitle">{siteConfig.subtitle}</span>'],
  ['app/layout.tsx', /( *)<a className="external" href="mailto:you@example\.com">Email<\/a>\n *\{' · '\}\n *<a className="external" href="https:\/\/github\.com\/your-username" target="_blank" rel="noreferrer">GitHub<\/a>/,
    "$1{siteConfig.footerLinks.map((link, index) => (\n$1  <span key={link.href}>\n$1    {index > 0 ? ' · ' : null}\n$1    <a className=\"external\" href={link.href} {...(link.href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}>{link.label}</a>\n$1  </span>\n$1))}"],
  // Sample news: replaces only the event data, so the Updates logic keeps tracking main.
  ['lib/site-updates.ts', /\/\/ Canonical ordered event data[\s\S]*?\nconst siteUpdateEvents: readonly SiteUpdateEvent\[\] = \[[\s\S]*?\n\];\n/, () => SAMPLE_UPDATE_EVENTS],
];

export function transformPackageJson(p) {
  p.name = 'llm-wiki-homepage-template';
  p.version = '0.1.0';
  p.description = 'Template: a bilingual, searchable academic homepage built as an LLM Wiki, with page-grounded AI answers.';
  delete p.homepage; delete p.author; delete p.contributors;
  p.repository = { type: 'git', url: 'git+https://github.com/your-username/your-wiki.git' };
  p.bugs = { url: 'https://github.com/your-username/your-wiki/issues' };
  for (const k of ['audit:wiki', 'eval:wiki-chat', 'activity:report', 'test:release', 'test:wiki', 'verify:publish', 'verify:staged',
    'push:check', 'push:main', 'smoke:production', 'deploy:production', 'release:production', 'release:resume', 'submit:indexnow',
    'template:build']) delete p.scripts[k];
  p.scripts['check:node22'] = 'npm run typecheck && npm run lint:wiki && npm run lint:content && npm run lint:okf && npm run test:features';
  p.scripts['test:features'] = 'node scripts/test-chat-hardening.mjs && node scripts/test-site-activity.mjs && node scripts/test-site-activity-daily.mjs && node scripts/test-site-activity-events.mjs && node scripts/test-wiki-outline.mjs';
  return p;
}

// Binary files allowed in the output (everything else binary fails the leak check).
export const allowedBinaryPrefixes = ['public/images/', 'public/papers/example-paper/', 'public/site-icons/', 'public/site-logos/', 'public/mywiki-icon.png', 'public/mywiki-icon.webp', 'public/maps/'];
