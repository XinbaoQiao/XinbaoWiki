# Wiki maintenance audit

Use the structure-only audit in CI and local checks (fast, no network):

```bash
npm run audit:wiki
```

To periodically verify registered and in-wiki `http(s)` links (slower, network-bound; do **not** enable on every CI run by default):

```bash
node scripts/run-with-node22.mjs node scripts/audit-wiki-maintenance.mjs --check-links
```

`--check-links` classifies links as healthy / broken / indeterminate and writes them into the audit report. Treat broken links as a maintenance follow-up, not a deploy blocker unless you intentionally gate on them.
