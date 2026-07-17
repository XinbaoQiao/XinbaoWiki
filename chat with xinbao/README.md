# Chat with Xinbao

`Chat with Xinbao` is a same-site conversational assistant for Xinbaopedia. It is implemented as a Next.js client component plus a server-only API route, so the browser never receives the Yunwu API key, the Upstash credentials, or the full persona prompt.

## Recommended project structure

```text
components/ChatWithXinbao.tsx
app/api/chat-with-xinbao/route.ts
app/api/chat-with-xinbao/questions/route.ts
lib/chat-with-xinbao.ts
wiki/*.md
chat with xinbao/
  README.md
  env.example
  persona-prompt.md
  meme-voice-notes.md
wiki/Internet_Slang_2026.md
wiki/Internet_Slang_2026_zh.md
```

## Runtime flow

1. The search bar renders an `AI` icon button before the search input.
2. The client keeps visible conversation history locally and sends only `{ message, language }` to `/api/chat-with-xinbao`. The server ignores any extra client-provided history for backward compatibility: it neither retrieves against it nor forwards it to the provider. The provider prompt contains the server-authored system message and the current user message only.
3. The route validates input, enforces cooldown and daily quotas in Upstash Redis, and retrieves a bounded set of public `wiki/*.md` heading chunks for the current message only.
4. The route has three explicit response modes. Public wiki questions with usable evidence use `model-grounded`; ordinary conversation or general questions without enough wiki evidence use `model-conversational`; only sensitive or hidden-content requests use `deterministic-abstention` before the provider call.
5. Both model modes call Yunwu at `https://api.yunwu.ai/v1/chat/completions`. A grounded answer is accepted only when it contains valid `[n]` citations into the retrieved evidence, after which the server compacts citation numbers and returns only cited sources. A conversational answer must be non-empty, must not contain fabricated numbered wiki citations, and returns an empty source list.
6. Sensitive and hidden-content requests return a localized protected-information refusal with no sources. Weak retrieval by itself is never mapped to the old fixed “public evidence is insufficient” sentence.
7. Accepted questions produce data-minimized, pseudonymous server-side metadata for reliability, retrieval evaluation, and aggregate FAQ demand.
8. The route returns `{ reply, remaining, limit, sources, meta }` or a safe generic error.

## Question logs

`POST /api/chat-with-xinbao` stores metadata for each accepted request in Redis after quota and cooldown checks pass. It records a salted one-way question fingerprint, language, page path, timestamp, message length, pseudonymous one-way visitor/browser/IP hashes, retrieval versions and scores, response mode, protected-block reason, and retrieved source IDs. It does not record raw or normalized question text, chat history, system prompts, model raw errors, API keys, or full IP addresses. These hashes reduce direct identifiability but can still link records produced from the same inputs and server salt, so they are pseudonymous identifiers, not anonymous data.

Stored keys:

```text
xinbao-chat:questions:day:YYYY-MM-DD
xinbao-chat:questions:frequency:zh:YYYY-MM-DD
xinbao-chat:questions:frequency:en:YYYY-MM-DD
```

Each daily list is capped at 2,000 items. Daily logs and frequency buckets use a
fixed absolute expiration at the Tokyo day boundary plus 90 days; later traffic
cannot extend older records. The admin endpoint aggregates only those 90 daily
buckets.

Admin export is available only from the server endpoint with `XINBAO_CHAT_ADMIN_TOKEN`:

```bash
curl -H "Authorization: Bearer $XINBAO_CHAT_ADMIN_TOKEN" \
  "https://xinbaopedia.top/api/chat-with-xinbao/questions?limit=100"

curl -H "Authorization: Bearer $XINBAO_CHAT_ADMIN_TOKEN" \
  "https://xinbaopedia.top/api/chat-with-xinbao/questions?mode=frequency&language=zh&limit=50"
```

Use aggregate fingerprints and retrieval outcomes to identify repeated demand,
then author or review an explicit golden question before improving the wiki or
prompt. The raw question is not retained and the salted one-way fingerprint is
not a recovery mechanism, but it remains pseudonymous telemetry rather than
proof of anonymization. Never republish visitor metadata as evaluation data.

## Voice updates

Internal meme and slang notes are maintained as hidden yearly wiki sources. The 2026 phrase bank lives in `wiki/Internet_Slang_2026.md` and `wiki/Internet_Slang_2026_zh.md`; it is a developer maintenance reference, is excluded from public routes, exports, and runtime factual context, and is not a factual source about Xinbao Qiao. Keep greetings natural, action-oriented, and fact-first; light casual phrasing is optional, not the identity of the assistant.

## Vercel deployment

1. Deploy this repository as a normal Next.js 15 project, not a static export.
2. In Vercel Project Settings, add the variables shown in `env.example`.
3. Keep `NEXT_PUBLIC_BASE_PATH` empty for a root Vercel deployment.
4. Confirm the deployed Network panel shows only calls to `/api/chat-with-xinbao` from the browser.

The release smoke is not only a configuration check. Staged and production
smoke tests send four `POST` canaries through the deployed API: a grounded wiki
question must return valid `[n]` citations and matching sources; a page-context
question sent with a DynFrs wiki `Referer` must cite only DynFrs sources; an
ordinary out-of-domain question must return `responseMode: model-conversational`
with no wiki citations or sources; and a sensitive request must return
`responseMode: deterministic-abstention`, `blockedReason: sensitive-query`, and
an empty source list. Any failure blocks promotion or release.

## Key leak check

Run this before pushing or after `npm run build`:

```bash
rg "YUNWU_API_KEY|sk-|Bearer|api.yunwu|UPSTASH_REDIS_REST_TOKEN" .next app components public "chat with xinbao"
```

Expected public matches are variable names in server files or documentation examples. A real token, a `sk-...` value, or a direct browser request to Yunwu is a blocker.

## Daily limit test

With local test Redis credentials configured:

```bash
CHAT_TEST_VISITOR_ID=test-visitor-a CHAT_TEST_IP=203.0.113.10 npm run dev
```

Send valid POST requests to `/api/chat-with-xinbao`. The 11th daily request for the same visitor should return HTTP `429` with `Daily limit reached. Please come back tomorrow.`. Two valid requests within four seconds should return the cooldown `429`. Change `CHAT_TEST_VISITOR_ID` or `CHAT_TEST_IP` to confirm independent counters.
