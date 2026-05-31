# Project Agent Rules

Scope:
- These rules apply to this repository.
- The canonical content source is `wiki/*.md`; rendered pages and build output are not the knowledge source.

Writing style:
- Use third-person, neutral, objective, Wikipedia-style academic prose.
- Keep biographical claims factual and scoped.
- Prefer concise main text plus footnotes for side context.

Validation:
- Before publishing any completed implementation or content edit, run:
  - `npm run check`
  - `npm run build`
- If validation fails, do not commit, push, or deploy until the failure is fixed or explicitly accepted by the user.

Automatic publish workflow:
- After every completed implementation or content edit, if tracked source changes exist and validation passes:
  1. Stage only files that are directly related to the completed request.
  2. Commit the staged changes with a concise, descriptive message.
  3. Push the commit to `origin main`.
  4. Deploy production with Vercel under the `xinbaopedia` scope.
  5. Verify the canonical site at `https://xinbaopedia.top`.
- Treat this as the repository default. A newer explicit user instruction can override it for a specific turn.

Publishing safety:
- Never commit API keys, tokens, `.env*`, `.secrets/`, local caches, build caches, runtime logs, generated outputs, or browser/system metadata.
- Do not stage broad untracked files with `git add -A` unless the user explicitly asks to publish all visible files.
- Use workspace-provided GitHub and Vercel credentials only ephemerally. Do not put tokens in command output, remotes, tracked docs, source maps, or browser bundles.
- Prefer passing deployment tokens through environment variables rather than command-line arguments.

Deployment:
- The production domain is `https://xinbaopedia.top`.
- The Vercel team/scope is `xinbaopedia`.
- After deployment, verify at least one changed page and the homepage with HTTP requests.
