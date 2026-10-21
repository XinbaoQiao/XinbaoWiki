#!/usr/bin/env node
// Builds the de-personalized `template` tree from the committed main tree.
// Default output: <repo>/.tmp/template-build (gitignored). Delete it after local checks:
// main's tsconfig includes **/*.ts, so a leftover output would be type-checked by main.
// Usage: node scripts/template/build-template.mjs [--out <dir>] [--ref HEAD] [--skip-maintenance] [--update-lock]
// --refresh-overrides: write maintenance-standardized frontmatter back into template-overrides/wiki.
// --update-lock: after reviewing a main-side change to a file that template-overrides/ replaces wholesale,
// port the change into the override (if needed) and record the reviewed source hash in override-lock.json.
// Exit code is non-zero if a patch drifted or the leak check finds anything.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { allowedBinaryPrefixes, deletePaths, globalReplacements, patches, transformPackageJson } from './rules.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..');
const argv = process.argv.slice(2);
const opt = (name, fallback) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : fallback; };
const out = path.resolve(opt('--out', path.join(repo, '.tmp', 'template-build')));
const ref = opt('--ref', 'HEAD');
const errors = [];
const manifest = { deleted: [], renamed: [], replacedFiles: [], patched: [], overlaid: [] };

const BINARY = /\.(png|jpe?g|webp|gif|pdf|ico|woff2?|ttf|otf|mp4|mov|webm|zip)$/i;
const applyGlobal = (s) => globalReplacements.reduce((acc, [a, b]) => acc.replace(a, b), s);

// 1. Fresh copy of the committed tree (never the dirty working tree).
// Empty the directory's contents rather than the directory itself, so a shell or server whose cwd is
// the output (common on Windows) cannot leave a half-deleted tree behind.
fs.mkdirSync(out, { recursive: true });
for (const e of fs.readdirSync(out)) fs.rmSync(path.join(out, e), { recursive: true, force: true });
if (fs.readdirSync(out).length) { console.error(`cannot empty ${out}`); process.exit(1); }
const files = execFileSync('git', ['ls-tree', '-r', '-z', '--name-only', ref], { cwd: repo, encoding: 'utf8', maxBuffer: 1 << 28 })
  .split('\0').filter(Boolean);
for (const file of files) {
  if (deletePaths.some((p) => file === p || (p.endsWith('/') && file.startsWith(p)) || file.startsWith(p + '/'))) { manifest.deleted.push(file); continue; }
  const dest = applyGlobal(file);
  if (dest !== file) manifest.renamed.push(`${file} -> ${dest}`);
  const buf = execFileSync('git', ['show', `${ref}:${file}`], { cwd: repo, maxBuffer: 1 << 28 });
  fs.mkdirSync(path.dirname(path.join(out, dest)), { recursive: true });
  if (BINARY.test(file)) { fs.writeFileSync(path.join(out, dest), buf); continue; }
  const text = buf.toString('utf8').replace(/\r\n/g, '\n');
  const next = applyGlobal(text);
  if (next !== text) manifest.replacedFiles.push(dest);
  fs.writeFileSync(path.join(out, dest), next);
}

// 2. Targeted patches.
for (const [file, search, replacement] of patches) {
  const p = path.join(out, file);
  if (!fs.existsSync(p)) { errors.push(`patch target missing: ${file}`); continue; }
  const s = fs.readFileSync(p, 'utf8');
  const found = typeof search === 'string' ? s.includes(search) : new RegExp(search.source, search.flags.replace('g', '')).test(s);
  if (!found) { errors.push(`patch drifted (search text not found) in ${file}: ${String(search).slice(0, 80)}`); continue; }
  fs.writeFileSync(p, typeof search === 'string' ? s.split(search).join(replacement) : s.replace(search, replacement));
  manifest.patched.push(file);
}

// 3. Overlay example content (placeholder wiki, avatar, icons, README, ...).
const overrides = path.join(here, 'template-overrides');
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) { walk(abs); continue; }
    // `.tpl` suffix keeps override sources out of main's TypeScript/Next build.
    const rel = path.relative(overrides, abs).split(path.sep).join('/').replace(/\.tpl$/, '');
    fs.mkdirSync(path.dirname(path.join(out, rel)), { recursive: true });
    // Normalize text overrides to LF so a Windows checkout (autocrlf) builds the same tree as CI.
    if (BINARY.test(rel)) fs.copyFileSync(abs, path.join(out, rel));
    else fs.writeFileSync(path.join(out, rel), fs.readFileSync(abs, 'utf8').replace(/\r\n/g, '\n'));
    manifest.overlaid.push(rel);
  }
})(overrides);

// 3b. Drift check for whole-file overrides: an override replaces a main file entirely, so a later
// edit to that file on main would silently never reach the template. Each such source file's git blob
// hash is pinned in override-lock.json; a mismatch FAILS the build until the override is reviewed.
{
  const lockFile = path.join(here, 'override-lock.json');
  const lock = fs.existsSync(lockFile) ? JSON.parse(fs.readFileSync(lockFile, 'utf8')) : {};
  const tracked = new Set(files);
  const current = {};
  for (const rel of manifest.overlaid) {
    if (!tracked.has(rel) || manifest.deleted.includes(rel)) continue;
    current[rel] = execFileSync('git', ['rev-parse', `${ref}:${rel}`], { cwd: repo, encoding: 'utf8' }).trim();
  }
  if (argv.includes('--update-lock')) {
    fs.writeFileSync(lockFile, JSON.stringify(Object.fromEntries(Object.entries(current).sort()), null, 2) + '\n');
    console.log(`override-lock.json updated (${Object.keys(current).length} files)`);
  } else {
    for (const [rel, hash] of Object.entries(current)) {
      if (lock[rel] !== hash) errors.push(`override drift: main changed ${rel} (whole-file override in template-overrides/). Port the change, then run with --update-lock`);
    }
    for (const rel of Object.keys(lock)) if (!(rel in current)) errors.push(`override-lock.json lists ${rel}, which is no longer overridden or tracked; run with --update-lock`);
  }
}

// 4. package.json metadata.
const pkgPath = path.join(out, 'package.json');
const pkg = transformPackageJson(JSON.parse(fs.readFileSync(pkgPath, 'utf8')));
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
const lockPath = path.join(out, 'package-lock.json');
if (fs.existsSync(lockPath)) {
  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  lock.name = pkg.name; lock.version = pkg.version;
  if (lock.packages?.['']) { lock.packages[''].name = pkg.name; lock.packages[''].version = pkg.version; }
  fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n');
}

// 5. Regenerate derived wiki metadata + OKF export from the example pages.
if (!argv.includes('--skip-maintenance')) {
  const run = (strict) => {
    try { execFileSync(process.execPath, ['scripts/wiki-maintenance.mjs', '--standardize', '--write'], { cwd: out, stdio: strict ? ['ignore', 'ignore', 'inherit'] : 'ignore' }); }
    catch (error) { if (strict) errors.push('wiki-maintenance --standardize failed on the template tree'); }
  };
  run(false); // first pass stamps modified/content_hash on pages that lack them
  // Deterministic review stamp: the first instant of the source commit's month (UTC), never earlier than
  // a page's own modified time. Re-running for the same main commit yields a byte-identical tree, and
  // review_due stays fresh as main moves on (the template changes at most once a month for this).
  const commitDate = new Date(execFileSync('git', ['log', '-1', '--format=%cI', ref], { cwd: repo, encoding: 'utf8' }).trim());
  const monthStart = Date.UTC(commitDate.getUTCFullYear(), commitDate.getUTCMonth(), 1);
  for (const f of fs.readdirSync(path.join(out, 'wiki')).filter((f) => f.endsWith('.md'))) {
    const p = path.join(out, 'wiki', f);
    let s = fs.readFileSync(p, 'utf8');
    const modified = Date.parse((s.match(/^modified: '?([^'\n]+)'?$/m) || [])[1] || '') || 0;
    const stamp = new Date(Math.max(monthStart, Math.ceil((modified + 1000) / 1000) * 1000)).toISOString().replace(/\.\d+Z$/, '.000Z');
    s = /^reviewed_at: .*$/m.test(s) ? s.replace(/^reviewed_at: .*$/m, `reviewed_at: '${stamp}'`)
      : s.replace(/^(content_hash: .*\n)/m, `$1reviewed_at: '${stamp}'\n`);
    fs.writeFileSync(p, s);
  }
  run(true);
  // Overrides must already carry their standardized modified/content_hash, otherwise maintenance would
  // stamp "now" and the output would differ on every run. --refresh-overrides writes them back.
  const owiki = path.join(here, 'template-overrides', 'wiki');
  for (const f of fs.readdirSync(owiki).filter((f) => f.endsWith('.md'))) {
    const src = fs.readFileSync(path.join(owiki, f), 'utf8').replace(/\r\n/g, '\n');
    const outText = fs.readFileSync(path.join(out, 'wiki', f), 'utf8');
    const norm = (s) => s.replace(/^(reviewed_at|review_due): .*\n/gm, '');
    if (argv.includes('--refresh-overrides')) { if (norm(src) !== norm(outText)) fs.writeFileSync(path.join(owiki, f), norm(outText)); }
    else if (norm(src) !== norm(outText)) errors.push(`override wiki/${f} is not standardized (maintenance changed it); run with --refresh-overrides and commit`);
  }
}

// 6. Leak check.
const deny = fs.readFileSync(path.join(here, 'denylist.txt'), 'utf8').split(/\r?\n/)
  .map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => new RegExp(l, 'iu'));
const secrets = [/sk-[A-Za-z0-9]{20,}/, /ghp_[A-Za-z0-9]{30,}/, /github_pat_[A-Za-z0-9_]{30,}/, /AKIA[0-9A-Z]{16}/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /xox[abp]-[A-Za-z0-9-]{10,}/, /UPSTASH_REDIS_REST_TOKEN\s*=\s*["']?[A-Za-z0-9]{20,}/, /(?:G-|UA-)[A-Z0-9]{6,}/];
const leaks = [];
(function scan(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.next') continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) { scan(abs); continue; }
    const rel = path.relative(out, abs).split(path.sep).join('/');
    if (/^\.env/.test(e.name)) leaks.push(`${rel}: env file`);
    if (BINARY.test(rel) && !allowedBinaryPrefixes.some((p) => rel.startsWith(p))) leaks.push(`${rel}: binary asset not in allowlist`);
    const content = fs.readFileSync(abs).toString(BINARY.test(rel) ? 'latin1' : 'utf8');
    if (/\.(jpe?g)$/i.test(rel) && content.includes('Exif')) leaks.push(`${rel}: EXIF metadata`);
    for (const re of [...deny, ...secrets]) {
      const m = content.match(re) || rel.match(re);
      if (m) leaks.push(`${rel}: matches ${re} -> "${m[0].slice(0, 40)}"`);
    }
  }
})(out);

fs.writeFileSync(path.join(out, '..', path.basename(out) + '.manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
for (const e of errors) console.error(`ERROR ${e}`);
for (const l of leaks) console.error(`LEAK ${l}`);
console.log(`template: ${out} | deleted ${manifest.deleted.length}, renamed ${manifest.renamed.length}, rewritten ${manifest.replacedFiles.length}, patched ${manifest.patched.length}, overlaid ${manifest.overlaid.length}`);
if (errors.length || leaks.length) { console.error(`template build FAILED: ${errors.length} error(s), ${leaks.length} leak(s)`); process.exit(1); }
console.log('leak check clean');
