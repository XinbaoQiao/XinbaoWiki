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
2. The client sends `{ message, history }` to `/api/chat-with-xinbao`.
3. The route validates input, enforces cooldown and daily quotas in Upstash Redis, builds a server-only prompt from `wiki/*.md` and optional `project.md`, then calls Yunwu at `https://api.yunwu.ai/v1/chat/completions`.
4. Accepted questions are written to server-side Upstash logs for later FAQ and predicted-answer mining.
5. The route returns `{ reply, remaining, limit }` or a safe generic error.

## Question logs

`POST /api/chat-with-xinbao` stores each accepted question in Redis after quota and cooldown checks pass. It records the trimmed question text, normalized text, language, page path, timestamp, message length, and anonymous visitor/browser/IP hashes. It does not record chat history, system prompts, model raw errors, API keys, or full IP addresses.

Stored keys:

```text
xinbao-chat:questions:recent
xinbao-chat:questions:day:YYYY-MM-DD
xinbao-chat:questions:frequency:zh
xinbao-chat:questions:frequency:en
```

The recent list is capped at 2,000 items. Daily logs expire after 90 days.

Admin export is available only from the server endpoint with `XINBAO_CHAT_ADMIN_TOKEN`:

```bash
curl -H "Authorization: Bearer $XINBAO_CHAT_ADMIN_TOKEN" \
  "https://xinbaopedia.top/api/chat-with-xinbao/questions?limit=100"

curl -H "Authorization: Bearer $XINBAO_CHAT_ADMIN_TOKEN" \
  "https://xinbaopedia.top/api/chat-with-xinbao/questions?mode=frequency&language=zh&limit=50"
```

Use these logs to identify repeated questions and then improve grounded answers in the wiki or prompt. Do not publish raw visitor questions without review.

## Voice updates

Public meme and slang notes are maintained as yearly wiki pages. The 2026 phrase bank lives in `wiki/Internet_Slang_2026.md` and `wiki/Internet_Slang_2026_zh.md`; it is included only as tone guidance, not as a factual source about Xinbao Qiao. Keep greetings natural, action-oriented, and fact-first; light casual phrasing is optional, not the identity of the assistant.

## Vercel deployment

1. Deploy this repository as a normal Next.js 15 project, not a static export.
2. In Vercel Project Settings, add the variables shown in `env.example`.
3. Keep `NEXT_PUBLIC_BASE_PATH` empty for a root Vercel deployment.
4. Confirm the deployed Network panel shows only calls to `/api/chat-with-xinbao` from the browser.

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
