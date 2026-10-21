# Template sanitizer (main only)

Generates the public, de-personalized `template` branch from main.

```bash
node scripts/template/build-template.mjs [--out <dir>] [--ref HEAD]   # default out: .tmp/template-build (gitignored)
node scripts/template/build-template.mjs --update-lock                # after porting a main change into a whole-file override
node scripts/template/build-template.mjs --refresh-overrides          # after editing template-overrides/wiki/*.md
```

Delete the output after local checks: main's tsconfig includes `**/*.ts`, so a leftover tree is type-checked by main.

## Pipeline

1. Copies the **committed** tree of `HEAD` (never uncommitted files) into an emptied output directory.
2. Drops personal paths (`rules.mjs` -> `deletePaths`).
3. Applies ordered string replacements to file contents and paths (`globalReplacements`), then targeted code
   patches (`patches`). A patch whose search text no longer exists **fails the build**, so a change on main that
   needs a new rule is noticed instead of silently leaking or breaking.
4. Overlays example content from `template-overrides/` (sample wiki, placeholder images, template README, docs,
   navigation). `*.tpl` suffixes are stripped; they keep override sources out of main's TypeScript build.
5. **Override drift check.** A whole-file override replaces a main file entirely, so a later main edit to that file
   would never reach the template. `override-lock.json` pins the git blob hash of every main file that an override
   replaces; if main changes one, the build fails with `override drift: ...`. Port the change into the override
   (if it matters for the template), then run `--update-lock` and commit.
6. Rewrites `package.json` / `package-lock.json` metadata, regenerates `wiki/*.json` and `public/okf/**`.
   `reviewed_at` is stamped deterministically (first instant of the source commit's month, UTC, never earlier than
   the page's `modified`), so rebuilding the same commit gives a byte-identical tree. Override wiki pages must be
   stored already standardized; otherwise the build fails and asks for `--refresh-overrides`.
7. Leak check: fails on any regex in `denylist.txt`, secret patterns, `.env*` files, EXIF in JPEGs, or binary
   assets outside the placeholder allowlist.

Owner-specific UI copy (name/wordmark, taglines, research areas, nav groups, footer links, chat greeting and
quick-starts) is centralised in the override `lib/site-config.ts`; targeted patches point `HomepagePortal`,
`ChatWithOwnerPanel`, `app/layout.tsx` and `globals.css` at it (the PNG wordmarks are replaced by a text wordmark
tinted with the palette accent), and `lib/site-navigation.ts` derives the sidebar and directory from it, skipping
missing pages and hiding empty groups.

Code that differs from main only by data (sample news in `lib/site-updates.ts`, site URL via
`NEXT_PUBLIC_SITE_URL`, chat persona via `SITE_OWNER_NAME` / `CHAT_MODEL` / `SITE_CHAT_SIGNATURE_*`) is handled by
targeted patches, so the surrounding logic keeps tracking main automatically.

## Sync

`.github/workflows/sync-template.yml` runs on **every** push to `main` (and on `workflow_dispatch`). There are **no path filters**, so ordinary content, code, or docs updates on your personal site all re-run the sanitizer. Concurrency group `sync-template` with `cancel-in-progress: false` keeps overlapping pushes from cancelling an in-flight sync.

Pipeline: install ? sanitize + leak check ? `npm ci` + `npm run check:node22` + `npm run build` in the output ? commit the tree to the orphan `template` branch (skipped when nothing changed). Any failure stops the job before the push. `scripts/template/**` and this workflow are excluded from the template output.

**Operator update path:** after local commits on `main`, `node article-credential-run.mjs push direct article (from the local operator helpers dir)` (or `npm run push:main` with `GITHUB_TOKEN`) is what publishes your site and, by pushing `main`, is what triggers this sync. Production deploy (`node article-credential-run.mjs release direct article (from the local operator helpers dir)`) does not itself update `template`; the push to `main` does.

## When main changes

- New personal content in `wiki/` or the personal `public/` folders: nothing to do, they are replaced wholesale.
- New personal strings in code: add them to `denylist.txt` and a replacement or patch to `rules.mjs`.
- CI says `patch drifted`: update the search text of that rule in `rules.mjs`.
- CI says `override drift`: port the change into `template-overrides/`, run `--update-lock`, commit.
