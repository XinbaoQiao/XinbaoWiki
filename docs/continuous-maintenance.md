# Continuous Wiki Maintenance

This document is the operating procedure for keeping Xinbaopedia accurate,
retrievable, bilingual, and publishable over time. The process is intentionally
Git-native: automation reports or blocks problems but never edits canonical
content, commits, or deploys on its own.

## Maintenance Loop

```text
authoritative source change
          ↓
wiki edit with citation and translation impact
          ↓
deterministic maintenance + source/review audit
          ↓
production retrieval golden set
          ↓
human review → merge → normal release workflow
          ↑                         ↓
review queue ← weekly reports ← production questions and source drift
```

The loop has two independent freshness claims:

1. **Artifact freshness:** generated pages, graph, schema, source registry, OKF
   bundle, and retrieval metadata match `wiki/*.md`.
2. **Evidence freshness:** a human or scheduled source check has confirmed that
   the underlying public evidence remains current.

A content hash proves only the first claim.

The completed 2026 lifecycle migration bootstrapped `reviewed_at` from the
latest Git or source timestamp so existing pages had a review schedule. Those
values are migration baselines, not evidence that a human rechecked every claim
or that a remote source was reachable. The fallback is now disabled: new pages
remain invalid until a maintainer explicitly supplies `reviewed_at`, and only a
maintainer may advance it after later edits. Each link-audit report is
point-in-time evidence for remote availability during that run; it does not
rewrite the registry or establish a persistent verified status.

## Canonical and Generated Files

- Edit `wiki/*.md` for knowledge changes.
- Do not hand-edit `wiki/pages.json`, `wiki/graph.json`,
  `wiki/maintenance-schema.json`, `wiki/quality-report.json`,
  `wiki/source-registry.json`, or files under `public/okf/`.
- `evals/wiki-chat-golden.json` is a reviewed behavioral contract. Change it
  only when the wiki's intended answer boundary changes, not merely to make a
  regression pass.
- The reports written under `artifacts/` are runtime evidence and must not be
  committed.

## When Content Changes

1. Verify the claim against an authoritative public source. Prefer the
   publisher, venue, institution, ORCID/OpenReview profile, or owner-approved
   primary material over aggregators.
2. Add or update the citation in the canonical page. If no public source
   exists, keep the claim narrowly scoped and do not create a placeholder URL
   to inflate source coverage.
3. Check the paired language page. Translate the claim and evidence meaning,
   not merely the sentence surface.
4. Review incoming and outgoing WikiLinks plus typed relations. Use typed
   relations only when their semantics are stable.
5. Capture the content revision and regenerate deterministic artifacts:

   ```bash
   npm run maintain:wiki
   ```

   A substantive edit intentionally makes this first run fail with
   `content changed after reviewed_at`. Review the newly hashed revision and
   its evidence, set `reviewed_at` to a timestamp strictly later than the
   generated `modified`, then rerun `npm run maintain:wiki`. The maintenance
   script never reuses an older review to approve a new content hash.

6. Inspect the diff. A content edit should not silently expose hidden pages,
   remove a citation, reset review provenance, or rewrite unrelated generated
   concepts.
7. Run the full local gate:

   ```bash
   npm run check
   npm run audit:wiki -- --check-links --output artifacts/wiki-maintenance-audit.json
   npm run eval:wiki-chat -- --output artifacts/wiki-chat-evaluation.json
   npm run build
   ```

8. Inspect both JSON reports before review. Passing aggregate metrics do not
   excuse a failed high-risk case or an unexplained source change.
9. Merge and publish through the repository's normal release workflow only
   after human approval.

## Weekly Automated Audit

`.github/workflows/maintenance.yml` runs every Sunday at 11:17 Asia/Shanghai
and can also be started with `workflow_dispatch`. It performs only read-only
operations:

- validates WikiLinks, source freshness artifacts, OKF conformance, and wiki
  tests;
- audits the source registry, pending/overdue reviews, and external HTTP(S)
  links;
- runs the bilingual production retrieval golden set;
- uploads `wiki-maintenance-audit.json` and `wiki-chat-evaluation.json` for 30
  days;
- fails clearly when a gate fails.

It never runs `maintain:wiki`, changes Markdown, opens a pull request, commits,
pushes, or deploys. A maintainer interprets the report and makes the smallest
reviewed source change. The uploaded audit records the observed HTTP outcome
for that workflow run only. Generated registry entries remain declarations
with `not-checked` status; they must not be described as continuously or
persistently verified.

## Triage Rules

| Signal | Required action |
| --- | --- |
| HTTP 400, 404, or 410 | Confirm in a browser or authoritative replacement, then repair or remove the citation |
| Blocked, rate-limited, timeout, or 5xx | Treat as indeterminate; retry once later or verify manually before changing content |
| Overdue page review | Re-check all material claims and sources, update review metadata through the maintenance pipeline |
| Pending initial review | Establish evidence provenance; do not mark current merely because the text builds |
| Source or citation coverage decreases | Explain the removal in the change review or restore the missing evidence |
| Retrieval recall decreases | Inspect tokenization, chunk boundaries, graph expansion, language filtering, and stable IDs |
| Citation validity below 1.0 | Block release; retrieval is returning a missing, hidden, malformed, or stale source |
| Abstention failure | Block release; the evidence gate may answer a private, unsupported, or out-of-domain question |
| Indeterminate link volume spikes | Suspect network/provider failure; do not mass-delete citations |

## Retrieval Evaluation Contract

The golden set contains English and Chinese cases for profile facts, research,
publications, source citation, multi-page synthesis, and abstention. The
evaluator imports the same `lib/wiki-retrieval.ts` implementation used by the
chat API. It does not maintain a second retrieval algorithm.

The enforced metrics are:

- `retrievalRecallAtK`: expected page targets found in the top-k sources;
- `fullCaseRecallAtK`: cases for which every expected page was found;
- `evidencePatternRecall`: expected public evidence present in retrieved
  context;
- `citationValidity`: for every source-bearing retrieval, returned chunk IDs,
  hashes, slugs, titles, sections, languages, and wiki URLs exactly match the
  production index, and returned sources exactly match injected prompt
  evidence. This is a deterministic pre-generation integrity gate, not a claim
  that every provider response used citations well;
- `answerabilityAccuracy`: supported golden questions are not incorrectly sent
  through the abstention path;
- `abstentionAccuracy`: unsupported or out-of-domain questions produce no wiki
  evidence, while protected questions additionally carry the expected
  `blockedReason`. Retrieval abstention is a routing signal, not automatically
  a user-facing refusal;
- `indexCoverage`: public OKF pages represented in the retrieval index;
- `publicIndexPurity`: no hidden or otherwise non-public page is indexed;
- `languagePurity`: retrieved sources match the requested language.

Threshold changes require a reviewed rationale. Do not weaken a threshold to
accept a regression. If a renamed page intentionally changes a case, update the
canonical page, generated artifacts, and golden target in the same review.

This is an offline retrieval and grounding gate. It does not call the model
provider and therefore does not by itself prove tone, fluency, or provider
availability. The chat API adds three runtime modes: usable public evidence
uses a cited `model-grounded` reply; ordinary questions without enough wiki
evidence use an uncited `model-conversational` reply with no wiki sources; and
only an explicit protected `blockedReason` returns a deterministic response
before the provider call. Grounded answers must contain at least one in-range
`[n]` citation. The server compacts those citations and returns only the cited
source records; missing or invalid citations fail closed. Client-provided
history is untrusted compatibility data: it is neither used for retrieval nor
sent to the provider, so an earlier assistant message cannot become factual
evidence. Release smoke complements the offline evaluator with a real
answerable request through the configured provider, a Referer-backed current-page
request that must remain on DynFrs, a normal conversational canary, and a protected
sensitive-request canary. Periodic human answer review should still supplement
both.

## Feedback and Privacy

New accepted production requests store a salted one-way question fingerprint,
message length, page/language, pseudonymous one-way visitor/browser/IP hashes,
retrieved chunk IDs, retrieval versions and scores, provider/model versions,
latency, token counts, and outcome. They do not store raw question text, chat
history, the system prompt, private voice notes, raw IP addresses, or API keys.
These hashes reduce direct identifiability but can link records derived from the
same inputs and server salt, so they are not anonymous data. The question
fingerprint supports duplicate-rate and regression-volume analysis; it is not
a mechanism for recovering or republishing the raw question.

Golden cases therefore come from explicit maintainer input, consented feedback,
or a manually written paraphrase—not from reconstructing telemetry. Never copy
private facts or visitor identifiers into the wiki or golden set. Historical
entries created before the privacy-preserving format follow their existing
retention TTL and must not be republished as evaluation data.

## Failure and Recovery

1. Preserve the failing JSON report and identify whether the failure is source,
   generated-artifact, retrieval, provider, or network related.
2. Reproduce locally with the exact command and golden set from the failed
   commit.
3. Fix the canonical source or implementation. Do not edit a generated artifact
   or report to clear the gate.
4. Re-run the smallest failing gate, then the full check and build.
5. If a published change is factually wrong or exposes hidden material, revert
   through Git and use the normal release workflow. Do not patch production
   separately from the repository.
6. Record material content corrections in the append-only wiki log and explain
   what evidence changed.

The loop is complete when the canonical source, generated knowledge bundle,
retrieval index, offline evidence, and deployed behavior all refer to the same
reviewed revision.
