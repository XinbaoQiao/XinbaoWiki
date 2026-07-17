import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const wikiDir = path.join(root, 'wiki');
const allowedLanguages = new Set(['en', 'zh']);

function usage(exitCode = 1) {
  const stream = exitCode === 0 ? process.stdout : process.stderr;
  stream.write(`Usage: node scripts/new-wiki-page.mjs --slug <Slug> --title <Title> --type <Type> --language en|zh --description <Text> [--translation-of <Slug>] [--force]\n`);
  process.exit(exitCode);
}

function parseArgs(argv) {
  const options = { force: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') usage(0);
    if (arg === '--force') {
      options.force = true;
      continue;
    }
    if (!arg.startsWith('--')) usage();
    const key = arg.slice(2).replaceAll('-', '_');
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      process.stderr.write(`Missing value for ${arg}\n`);
      usage();
    }
    options[key] = value;
    index += 1;
  }
  return options;
}

function required(options, key) {
  const value = options[key];
  if (typeof value !== 'string' || !value.trim()) {
    process.stderr.write(`Missing required --${key.replaceAll('_', '-')}\n`);
    usage();
  }
  return value.trim();
}

function normalizeSlug(slug) {
  return slug.trim().replace(/\s+/g, '_').replace(/\.md$/, '');
}

function quoteYaml(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

function listYaml(values) {
  return values.map((value) => `  - ${quoteYaml(value)}`).join('\n');
}

function kebab(value) {
  return value
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const options = parseArgs(process.argv.slice(2));
const slug = normalizeSlug(required(options, 'slug'));
const title = required(options, 'title');
const type = required(options, 'type');
const language = required(options, 'language');
const description = required(options, 'description');
const translationOf = typeof options.translation_of === 'string' ? normalizeSlug(options.translation_of) : '';

if (!allowedLanguages.has(language)) {
  process.stderr.write('--language must be either en or zh\n');
  usage();
}

if (!/^[A-Za-z0-9_\-\u4e00-\u9fff]+$/.test(slug)) {
  process.stderr.write('--slug may contain letters, numbers, underscores, hyphens, and CJK characters\n');
  process.exit(1);
}

fs.mkdirSync(wikiDir, { recursive: true });
const filePath = path.join(wikiDir, `${slug}.md`);
if (fs.existsSync(filePath) && !options.force) {
  process.stderr.write(`wiki/${slug}.md already exists; use --force to overwrite intentionally\n`);
  process.exit(1);
}

const tags = [language, kebab(type)].filter(Boolean);
const frontmatter = [
  '---',
  `type: ${quoteYaml(type)}`,
  `title: ${quoteYaml(title)}`,
  `description: ${quoteYaml(description)}`,
  'tags:',
  listYaml(tags),
  `timestamp: ${quoteYaml(new Date().toISOString())}`,
  `language: ${language}`,
  translationOf ? `translation_of: ${translationOf}` : '',
  'relations: []',
  '---'
].filter(Boolean).join('\n');

const body = [
  `# ${title}`,
  '',
  description,
  '',
  '## Role in this wiki',
  '',
  'TODO: Explain why this page belongs in Xinbaopedia.',
  '',
  '## See also',
  '',
  '- TODO'
].join('\n');

fs.writeFileSync(filePath, `${frontmatter}\n${body}\n`);
console.log(`Created wiki/${slug}.md`);
console.log('Review is intentionally incomplete: add reviewed_at only after a maintainer verifies the page; npm run maintain:wiki will fail closed until then.');
