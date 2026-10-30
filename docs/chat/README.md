# Chat with the owner

`Chat with the owner` is a same-site conversational assistant for MyWiki. It is implemented as a Next.js client component plus a server-only API route, so the browser never receives the model-provider API key, the Upstash credentials, or the full persona prompt.

## Recommended project structure

```text
components/ChatWithOwner.tsx
app/api/chat-with-owner/route.ts
app/api/chat-with-owner/questions/route.ts
app/api/chat-with-owner/audit/route.ts
lib/chat-with-owner.ts
wiki/*.md
docs/chat/
  README.md
  env.example
```

## Runtime flow

1. The search bar renders an `AI` icon button before the search input.
2. The client keeps visible conversation history locally and sends `{ message, language, conversationId }` to `/api/chat-with-owner`. The optional UUID groups audit turns and is reset for a new chat or language. Extra client history is ignored and never forwarded to the provider.
3. The route validates input, enforces cooldown and daily quotas in Upstash Redis, and retrieves a bounded set of public `wiki/*.md` heading chunks for the current message only.
4. The route has three explicit response modes. Public wiki questions with usable evidence use `model-grounded`; ordinary conversation or general questions without enough wiki evidence use `model-conversational`; only sensitive or hidden-content requests use `deterministic-abstention` before the provider call.
5. Both model modes call OpenLux at `https://api.openlux.ai/v1/chat/completions` by default. A grounded answer is accepted only when it contains valid `[n]` citations into the retrieved evidence, after which the server compacts citation numbers and returns only cited sources. A conversational answer must be non-empty, must not contain fabricated numbered wiki citations, and returns an empty source list.
6. Sensitive and hidden-content requests return a localized protected-information refusal with no sources. Weak retrieval by itself is never mapped to the old fixed “public evidence is insufficient” sentence.
7. Accepted calls require a durable private audit admission before any provider request, with per-attempt reservations and terminal usage accounting.
8. The route returns `{ reply, remaining, limit, sources, meta }` or a safe generic error.

## Private abuse and cost audit

New requests create maintainer-only audit records for **365 Tokyo calendar days**.
Each bucket expires at Tokyo midnight 365 days after its date; later completions
do not extend its retention. The chat UI does not show a retention disclaimer; audit storage remains maintainer-only.
The audit stores the current question (up to 1,000 characters), delivered reply
(up to 6,000 characters), validated Vercel forwarding IP, approximate region,
bounded user agent, public page path, request ID, optional conversation ID,
model/prompt/retrieval identity, retry outcomes, HTTP status, duration and
per-attempt token usage. Conversation IDs are untrusted grouping hints, not
authentication or proof of a person. Earlier conversation history is not sent
to the server; linking recorded turns does not reconstruct missing old content.

Obvious credential-shaped strings and known server secrets are redacted.
System prompts, private voice notes, cookies, authorization headers, provider
credentials, raw upstream errors and rejected raw model output are never audit
payloads. Redaction is not a guarantee that all personal or sensitive text is
recognized; visitors should not send passwords, secrets or sensitive details.
These records contain personal data and are not anonymous or public.

The accepted bucket admits at most 2,000 records per day without trimming older
records. Audit admission failure or a full accepted bucket blocks provider work.
Rejected/invalid/rate-limited calls have an independent 500-row daily bucket;
further rejections increment an overflow counter. Their logging is best effort
and does not consume accepted-call evidence capacity. An admitted record left
`started` exposes an interrupted or unfinished call; it is not reported as a
completed, free or successful request. A completion-storage failure preserves
the admitted evidence and emits a content-free error.

`CHAT_DAILY_PROVIDER_ATTEMPT_LIMIT` defaults to **200 provider attempts per Tokyo
day**, including retries, failed upstream calls and client cancellations. `0`
disables paid calls; an invalid value fails closed. The existing 10-message
daily/browser allowance, 4-second cooldown, hourly IP cap and 450-output-token
cap remain. This is a request-count ceiling, not an exact monetary or total-token
budget. Usage comes from the provider; missing usage remains unknown, and
`usageComplete: false` means totals include only reported portions.

`GET /api/chat-with-owner/audit/` requires the existing administrator Bearer
credential **before** configuration or store access. It supports `date`,
`kind=accepted|rejected`, `limit=1..200`, `offset` and `snapshot`, with
private/no-store/noindex headers and no public cross-origin access. Continue
with the returned `nextOffset` and the same snapshot. Admission order remains
stable across appends; an in-flight row may acquire its final outcome while
being inspected. `providerAttemptReferences` links each day's allowance to its
request ID, request-start date and attempt number, including requests crossing
Tokyo midnight. Those allowance counters and references are global to the day
even when the selected event bucket is `rejected`. The page path, conversation ID and maintenance user-agent marker
are attribution hints, not verified navigation, authentication or quota exemptions.
Dates cover the current and preceding 364 Tokyo days. Every
record exposes the server request ID used by public response metadata or the
`x-chat-request-id` error-response header.

Use the named credential profile through the local read-only report helper:

```powershell
npm run chat:report -- --date 2026-10-24 --output .cache/chat-audit.json
npm run chat:report -- --date 2026-10-24 --ip 203.0.113.10 --output .cache/chat-ip.json
```

The helper reads both accepted and rejected snapshots completely and filters
locally by optional `--ip`, `--request-id` or `--conversation-id`. `--kind`
can select one bucket. Private JSON output is confined to `.cache`; never
publish it. The administrator token, rate-limit salt and provider credentials
stay inside the credential-scoped child. Old audit data cannot be backfilled
from hashes, and this feature takes effect only after the new code is deployed.

## Legacy question metadata

The compatible question-metadata path records a salted one-way question fingerprint, language, page path, timestamp, message length, pseudonymous visitor/browser/IP hashes, retrieval versions and scores, response mode, protected-block reason, and retrieved source IDs. This older dataset contains no raw questions, replies or full IP addresses; the new private audit above is separate. These hashes can link records and are pseudonymous, not anonymous data.

Stored keys:

```text
site-chat:questions:day:YYYY-MM-DD
site-chat:questions:frequency:zh:YYYY-MM-DD
site-chat:questions:frequency:en:YYYY-MM-DD
```

Each daily list is capped at 2,000 items. Daily logs and frequency buckets use a
fixed absolute expiration at the Tokyo day boundary plus 90 days; later traffic
cannot extend older records. The admin endpoint aggregates only those 90 daily
buckets.

Admin export is available only from the server endpoint with `SITE_CHAT_ADMIN_TOKEN`:

```bash
curl -H "Authorization: Bearer $SITE_CHAT_ADMIN_TOKEN" \
  "https://example.com/api/chat-with-owner/questions?limit=100"

curl -H "Authorization: Bearer $SITE_CHAT_ADMIN_TOKEN" \
  "https://example.com/api/chat-with-owner/questions?mode=frequency&language=zh&limit=50"
```

Use aggregate fingerprints and retrieval outcomes to identify repeated demand,
then author or review an explicit golden question before improving the wiki or
prompt. The raw question is not retained and the salted one-way fingerprint is
not a recovery mechanism, but it remains pseudonymous telemetry rather than
proof of anonymization. Never republish visitor metadata as evaluation data.

## Voice

Optionally set `SITE_CHAT_VOICE_STYLE` (server-only tone note) and `SITE_CHAT_SIGNATURE_EN` / `SITE_CHAT_SIGNATURE_ZH` (casual sign-off). The tone note is never factual evidence.

## Vercel deployment

1. Deploy this repository as a normal Next.js 15 project, not a static export.
2. In Vercel Project Settings, add the variables shown in `env.example`.
   `YUNWU_API_KEY` / `YUNWU_API_BASE_URL` configure any OpenAI-compatible Chat Completions endpoint (the variable names are historical); `CHAT_MODEL` selects the model. Changing Vercel variables requires a new deployment.
3. Keep `NEXT_PUBLIC_BASE_PATH` empty for a root Vercel deployment.
4. Confirm the deployed Network panel shows only calls to `/api/chat-with-owner` from the browser.

## Key leak check

Run this before pushing or after `npm run build`:

```bash
rg "YUNWU_API_KEY|sk-|Bearer|api.openlux|api.yunwu|UPSTASH_REDIS_REST_TOKEN" .next app components public docs/chat
```

Expected public matches are variable names in server files or documentation examples. A real token, a `sk-...` value, or a direct browser request to the model provider is a blocker.

## Daily limit test

With local test Redis credentials configured:

```bash
CHAT_TEST_VISITOR_ID=test-visitor-a CHAT_TEST_IP=203.0.113.10 npm run dev
```

Send valid POST requests to `/api/chat-with-owner`. The 11th daily request for the same visitor should return HTTP `429` with `Daily limit reached. Please come back tomorrow.`. Two valid requests within four seconds should return the cooldown `429`. Change `CHAT_TEST_VISITOR_ID` or `CHAT_TEST_IP` to confirm independent counters.

## Related maintenance

