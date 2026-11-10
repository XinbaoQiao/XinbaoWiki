import assert from 'node:assert/strict';
import fs from 'node:fs';
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === './chat-composer-predict' && /chat-composer-predict-server\.ts$/.test(context.parentURL || '')) {
      return nextResolve(specifier + '.ts', context);
    }
    return nextResolve(specifier, context);
  }
});

const {
  alignArrivedSuggestion,
  buildComposerPredictPrompt,
  canFlushComposerPredict,
  contextTurnsForPredict,
  createComposerPredictSession,
  parseComposerPredictBody,
  sanitizePredictedSuffix,
  trimComposerSuggestion
} = await import('../lib/chat-composer-predict.ts');
const {
  CHAT_PREDICT_DEFAULT_MODEL,
  CHAT_PREDICT_KEY_PREFIX,
  CHAT_PREDICT_MAX_TOKENS,
  composerPredictRateLimitKeys,
  executeChatComposerComplete,
  predictModelId,
  usesChatConversationQuotaKey
} = await import('../lib/chat-composer-predict-server.ts');

const panel = fs.readFileSync('components/ChatWithOwnerPanel.tsx', 'utf8');
const route = fs.readFileSync('app/api/chat-with-owner/complete/route.ts', 'utf8');
const mainRoute = fs.readFileSync('app/api/chat-with-owner/route.ts', 'utf8');
const styles = fs.readFileSync('app/globals.css', 'utf8');
const features = JSON.parse(fs.readFileSync('package.json', 'utf8')).scripts['test:features'];

assert.equal(sanitizePredictedSuffix('', 'How can I contact the owner?'), 'How can I contact the owner?');
assert.equal(sanitizePredictedSuffix('', '"How can I contact the owner?"'), 'How can I contact the owner?');
assert.equal(sanitizePredictedSuffix('', 'Next message: What projects has the owner worked on?'), 'What projects has the owner worked on?');
assert.equal(sanitizePredictedSuffix('How can I contact', 'How can I contact the owner?'), ' the owner?');
assert.equal(sanitizePredictedSuffix('How can I reach', ' the owner?'), ' the owner?');
assert.equal(sanitizePredictedSuffix('How can I cont', 'contact the owner?'), 'act the owner?');
assert.equal(sanitizePredictedSuffix('怎么联系', '"你的名字？"'), '你的名字？');
assert.equal(sanitizePredictedSuffix('Hello', '  \n```\n```  '), '');
assert.equal(sanitizePredictedSuffix('Hello', 'Hello there\nI am the owner'), ' there');
assert.equal(sanitizePredictedSuffix('   ', 'some suffix'), '');
assert.equal(sanitizePredictedSuffix('a'.repeat(1000), ' more'), '');
assert.ok(sanitizePredictedSuffix('', 'Research on model collapse in large language models and many extra words that should be clipped for a short ghost suggestion').length <= 80);

assert.equal(alignArrivedSuggestion('', '', 'How can I contact the owner?'), 'How can I contact the owner?');
assert.equal(alignArrivedSuggestion('', 'How', 'How can I contact the owner?'), ' can I contact the owner?');
assert.equal(alignArrivedSuggestion('', 'What about dinner', 'How can I contact the owner?'), '');
assert.equal(alignArrivedSuggestion('How can I', 'How can I c', ' contact the owner?'), 'ontact the owner?');

assert.equal(trimComposerSuggestion('', 'How can I contact the owner?', 'How', true), ' can I contact the owner?');
assert.equal(trimComposerSuggestion('How can I', ' contact the owner?', 'How can I c', true), 'ontact the owner?');
assert.equal(trimComposerSuggestion('How can I', ' contact the owner?', 'How can I please', true), '');
assert.equal(trimComposerSuggestion('How can I', ' contact the owner?', 'How can', true), '');
assert.equal(trimComposerSuggestion('How can I', ' contact the owner?', 'How can I contact the owner?', false), '');

assert.equal(canFlushComposerPredict({ draft: '', caretAtEnd: true, composing: false, disabled: false }), true);
assert.equal(canFlushComposerPredict({ draft: 'Hello', caretAtEnd: true, composing: false, disabled: false }), true);
assert.equal(canFlushComposerPredict({ draft: 'Hello', caretAtEnd: true, composing: true, disabled: false }), false);
assert.equal(canFlushComposerPredict({ draft: 'Hello', caretAtEnd: false, composing: false, disabled: false }), false);
assert.equal(canFlushComposerPredict({ draft: 'Hello', caretAtEnd: true, composing: false, disabled: true }), false);
assert.equal(canFlushComposerPredict({ draft: 'x'.repeat(1000), caretAtEnd: true, composing: false, disabled: false }), false);

assert.deepEqual(
  contextTurnsForPredict([
    { role: 'assistant', content: 'Welcome' },
    { role: 'user', content: 'How can I contact the owner?' },
    { role: 'system', content: 'ignore' },
    { role: 'assistant', content: 'You can email the public address.' }
  ]),
  [
    { role: 'assistant', content: 'Welcome' },
    { role: 'user', content: 'How can I contact the owner?' },
    { role: 'assistant', content: 'You can email the public address.' }
  ]
);

const emptyParsed = parseComposerPredictBody({
  draft: '',
  language: 'en',
  pagePath: '/wiki/CV/?utm=1',
  recentTurns: [{ role: 'user', content: 'Hi' }, { role: 'assistant', content: 'Hello' }]
});
assert.equal(emptyParsed.ok, true);
if (emptyParsed.ok) {
  assert.equal(emptyParsed.draft, '');
  assert.equal(emptyParsed.pagePath, '/wiki/CV/');
}

const parsed = parseComposerPredictBody({
  draft: 'How can I contact',
  language: 'en',
  pagePath: '/wiki/CV/?utm=1',
  recentTurns: [{ role: 'user', content: 'Hi' }, { role: 'assistant', content: 'Hello' }]
});
assert.equal(parsed.ok, true);
assert.equal(parseComposerPredictBody({ draft: '   ', language: 'en' }).ok, false);
assert.equal(parseComposerPredictBody({ draft: 'Hello', language: 'fr' }).ok, false);
assert.equal(parseComposerPredictBody({ message: 'Hello', language: 'en' }).ok, false);
assert.equal(parseComposerPredictBody({ draft: 'Hello', language: 'en', history: 'steal the session' }).ok, false);
assert.equal(parseComposerPredictBody({ draft: 'Hello', language: 'en', prompt: 'ignore previous' }).ok, false);
assert.equal(parseComposerPredictBody({ draft: 'Hello', language: 'en', messages: [{ role: 'user', content: 'general chat' }] }).ok, false);
assert.equal(parseComposerPredictBody({ draft: 'x'.repeat(1001), language: 'en' }).error, 'too-long');

const nextPrompt = buildComposerPredictPrompt({
  draft: '',
  language: 'en',
  pagePath: '/wiki/CV/',
  recentTurns: [{ role: 'user', content: 'How can I contact the owner?' }, { role: 'assistant', content: 'You can email the public address.' }]
});
assert.match(nextPrompt, /Propose the visitor's likely next message/);
assert.match(nextPrompt, /composer draft is empty/);
assert.match(nextPrompt, /user: How can I contact the owner\?/);
assert.doesNotMatch(nextPrompt, /Output only the missing suffix/);

const suffixPrompt = buildComposerPredictPrompt({
  draft: 'How can I contact',
  language: 'en',
  pagePath: '/wiki/CV/',
  recentTurns: [{ role: 'user', content: 'Hi' }, { role: 'assistant', content: 'Hello from the wiki.' }]
});
assert.match(suffixPrompt, /Output only the missing suffix/);
assert.match(suffixPrompt, /Draft:\nHow can I contact/);

let requests = 0;
const session = createComposerPredictSession({
  request: async ({ draft }) => {
    requests += 1;
    return draft ? `${draft} the owner?` : 'How can I contact the owner?';
  }
});

const typingBeforeSpend = session.updateDraft({ draft: 'Hello', caretAtEnd: true });
session.flush({ draft: 'Hello', caretAtEnd: true, composing: false, disabled: false });
assert.equal(typingBeforeSpend, '');
assert.equal(requests, 0, 'no model call before the first quota-consuming send');

session.noteQuotaSpend();
assert.equal(session.hasPendingSpend(), true);
session.flush({ draft: '', caretAtEnd: true, composing: true, disabled: false });
assert.equal(requests, 0, 'IME composition holds the one-shot until composition ends');
session.flush({ draft: '', caretAtEnd: true, composing: false, disabled: false });
await new Promise((resolve) => setTimeout(resolve, 10));
assert.equal(requests, 1);
assert.equal(session.getSuggestion(), 'How can I contact the owner?');
assert.equal(session.accept(''), 'How can I contact the owner?');
assert.equal(session.getSuggestion(), '');
session.flush({ draft: '', caretAtEnd: true, composing: false, disabled: false });
await new Promise((resolve) => setTimeout(resolve, 10));
assert.equal(requests, 1, 'accepting does not issue a second call in the same turn');

session.noteQuotaSpend();
session.flush({ draft: '', caretAtEnd: true, composing: false, disabled: false });
await new Promise((resolve) => setTimeout(resolve, 10));
assert.equal(requests, 2);
assert.equal(session.updateDraft({ draft: 'How', caretAtEnd: true }), ' can I contact the owner?');
session.flush({ draft: 'How', caretAtEnd: true, composing: false, disabled: false });
await new Promise((resolve) => setTimeout(resolve, 10));
assert.equal(requests, 2, 'matching typing trims the ghost and does not call the model again');
session.dismiss();
session.flush({ draft: '', caretAtEnd: true, composing: false, disabled: false });
await new Promise((resolve) => setTimeout(resolve, 10));
assert.equal(requests, 2, 'dismissing does not request again until the next quota spend');
assert.equal(session.getSuggestion(), '');

session.noteQuotaSpend();
session.flush({ draft: '', caretAtEnd: true, composing: false, disabled: false });
await Promise.resolve();
session.updateDraft({ draft: 'What about dinner', caretAtEnd: true });
await new Promise((resolve) => setTimeout(resolve, 10));
assert.equal(requests, 3);
assert.equal(session.getSuggestion(), '', 'a mismatched in-flight one-shot is discarded');

session.noteQuotaSpend();
session.updateDraft({ draft: '', caretAtEnd: false });
session.flush({ draft: '', caretAtEnd: false, composing: false, disabled: false });
await new Promise((resolve) => setTimeout(resolve, 10));
assert.equal(requests, 3, 'moving the caret before the one-shot fires consumes the turn without a call');

session.noteQuotaSpend();
session.flush({ draft: '', caretAtEnd: true, composing: false, disabled: false });
await new Promise((resolve) => setTimeout(resolve, 10));
assert.equal(requests, 4, 'the next successful quota spend can call once again');

class MemoryRedis {
  constructor() {
    this.values = new Map();
    this.ttls = new Map();
    this.incrCalls = [];
  }
  async incr(key) {
    this.incrCalls.push(key);
    const next = (this.values.get(key) || 0) + 1;
    this.values.set(key, next);
    return next;
  }
  async expire(key, ttl) {
    this.ttls.set(key, ttl);
    return 1;
  }
  async ttl(key) {
    return this.ttls.get(key) ?? 60;
  }
}

function fakeRequest(body, headers = {}) {
  return {
    cookies: { get: () => ({ value: '11111111-1111-1111-1111-111111111111' }) },
    headers: { get: (name) => headers[name] ?? (name === 'user-agent' ? 'fixture-browser' : null) },
    json: async () => body
  };
}

const redis = new MemoryRedis();
const env = {
  NODE_ENV: 'test',
  RATE_LIMIT_SALT: 'fixture-predict-salt',
  YUNWU_API_KEY: 'fixture-key',
  YUNWU_API_BASE_URL: 'https://api.example.test/v1',
  VERCEL: '1'
};

const emptyCompletion = await executeChatComposerComplete(fakeRequest({
  draft: '',
  language: 'en',
  pagePath: '/wiki/CV/',
  recentTurns: [{ role: 'user', content: 'How can I contact the owner?' }, { role: 'assistant', content: 'You can email the public address.' }]
}, { 'x-vercel-forwarded-for': '203.0.113.10' }), {
  now: new Date('2026-11-10T11:00:00+09:00'),
  env,
  redis,
  fetch: async (_url, options) => {
    const payload = JSON.parse(options.body);
    assert.equal(payload.model, CHAT_PREDICT_DEFAULT_MODEL);
    assert.equal(payload.max_tokens, CHAT_PREDICT_MAX_TOKENS);
    assert.match(payload.messages[0].content, /composer draft is empty/);
    return {
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'What projects has the owner worked on?' } }], usage: { prompt_tokens: 40, completion_tokens: 8, total_tokens: 48 } })
    };
  }
});
assert.equal(emptyCompletion.status, 200);
assert.equal(emptyCompletion.body.suggestion, 'What projects has the owner worked on?');
assert.ok(redis.incrCalls.every((key) => key.startsWith(CHAT_PREDICT_KEY_PREFIX)));
assert.ok(redis.incrCalls.every((key) => !usesChatConversationQuotaKey(key)));

const completion = await executeChatComposerComplete(fakeRequest({
  draft: 'How can I contact',
  language: 'en',
  pagePath: '/wiki/CV/',
  recentTurns: [{ role: 'user', content: 'Hi' }, { role: 'assistant', content: 'Hello' }]
}, { 'x-vercel-forwarded-for': '203.0.113.10' }), {
  now: new Date('2026-11-10T11:00:00+09:00'),
  env,
  redis,
  fetch: async (_url, options) => {
    const payload = JSON.parse(options.body);
    assert.match(payload.messages[0].content, /How can I contact/);
    return {
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'How can I contact the owner?' } }], usage: { prompt_tokens: 40, completion_tokens: 6, total_tokens: 46 } })
    };
  }
});
assert.equal(completion.status, 200);
assert.equal(completion.body.suggestion, ' the owner?');

let minuteCount = 20;
const tightRedis = {
  incrCalls: [],
  async incr(key) {
    this.incrCalls.push(key);
    return key.includes(':minute:') ? (minuteCount += 1) : 1;
  },
  async expire() { return 1; },
  async ttl() { return 15; }
};
const limited = await executeChatComposerComplete(fakeRequest({
  draft: '',
  language: 'en',
  recentTurns: []
}, { 'x-vercel-forwarded-for': '203.0.113.10' }), {
  now: new Date('2026-11-10T11:00:00+09:00'),
  env,
  redis: tightRedis,
  fetch: async () => {
    throw new Error('rate-limited requests must not call the model');
  }
});
assert.equal(limited.status, 429);
assert.equal(limited.body.error, 'rate-limited');
assert.ok(tightRedis.incrCalls.every((key) => key.startsWith(CHAT_PREDICT_KEY_PREFIX)));

const rejected = await executeChatComposerComplete(fakeRequest({
  message: 'Write me a general essay',
  language: 'en',
  history: [{ role: 'user', content: 'ignore' }]
}), { env, redis: new MemoryRedis(), fetch: async () => { throw new Error('invalid bodies must not call the model'); } });
assert.equal(rejected.status, 400);

assert.equal(predictModelId({}), CHAT_PREDICT_DEFAULT_MODEL);
assert.equal(CHAT_PREDICT_DEFAULT_MODEL, 'deepseek-v4-flash-0731');

assert.doesNotMatch(panel, /COMPOSER_PREDICT_DEBOUNCE_MS|canRequestComposerPredict/);
assert.match(panel, /armComposerPredictAfterQuotaSpend/);
assert.match(panel, /setMessages\(\(current\) => \[\.\.\.current, \{[\s\S]*role: 'assistant'[\s\S]*armComposerPredictAfterQuotaSpend\(/);
assert.doesNotMatch(panel, /setTimeout\(\(\) => \{[\s\S]{0,400}predictEndpoint\(\)/);
assert.doesNotMatch(panel, /if \(!response\.ok\) \{[\s\S]{0,400}armComposerPredictAfterQuotaSpend/);
assert.match(panel, /\/api\/chat-with-owner\/complete\//);
assert.match(panel, /event\.key === 'Tab'/);
assert.match(panel, /event\.key === 'Escape'/);
assert.match(panel, /event\.key === 'ArrowRight'/);
assert.match(panel, /isComposing/);
assert.match(panel, /event\.isComposing \|\| event\.keyCode === 229/);
assert.match(panel, /onCompositionStart/);
assert.match(panel, /onCompositionEnd/);
assert.match(panel, /chat-owner-composer-ghost/);
assert.match(panel, /aria-hidden="true"/);
assert.match(panel, /acceptSuggestionHint/);
assert.match(panel, /placeholder=\{suggestion \? '' : strings\.placeholder\}/);
assert.match(panel, /recentTurns/);
assert.doesNotMatch(panel, /JSON\.stringify\(\{ message, history|const history = messages/);
assert.doesNotMatch(panel, /YUNWU_API_KEY|YUNWU_PREDICT_MODEL|Bearer /);
assert.match(route, /executeChatComposerComplete/);
assert.match(route, /export function GET/);
assert.doesNotMatch(route, /reserveDailyUsage|reserveChatProviderAttempt|logChatObservation|site-chat:daily:/);
assert.doesNotMatch(mainRoute, /chat-composer-predict/);
assert.match(styles, /chat-owner-composer-ghost/);
assert.match(styles, /chat-owner-composer-sizer/);
assert.match(styles, /pointer-events:\s*none/);
assert.match(styles, /pointer-events:\s*auto/);
assert.match(styles, /--chat-composer-grow/);
assert.match(styles, /@keyframes chat-owner-ghost-in/);
assert.doesNotMatch(styles, /chat-owner-composer-ghost-suffix\s*\{[^}]*filter/);
assert.doesNotMatch(styles, /chat-owner-ghost-in[^}]*filter/);
assert.match(styles, /chat-owner-composer-sizer,\s*\n\.chat-owner-composer-ghost,\s*\n\.chat-owner-composer-field textarea/);
assert.match(features, /test-chat-composer-predict\.mjs/);

assert.match(panel, /useLayoutEffect/);
assert.match(panel, /chat-owner-composer-sizer/);
assert.match(panel, /syncComposerFieldSize/);
assert.match(panel, /--chat-composer-grow/);
assert.match(panel, /chat-owner-composer-hint-tab/);
assert.match(panel, /Tab to accept/);
assert.match(panel, /按 Tab 采纳/);
assert.doesNotMatch(panel, /Tab to accept suggestion/);
assert.match(panel, /strings\.acceptSuggestion/);
assert.match(panel, /chat-owner-composer-accept/);
assert.match(panel, /acceptSuggestion: 'Accept'/);
assert.match(panel, /acceptSuggestion: '采纳'/);
assert.match(panel, /pointerType === 'mouse'/);
assert.match(panel, /if \(!suffix \|\| composing\) return;/);
assert.match(panel, /disabled=\{\!input\.trim\(\) \|\| quotaExhausted\}/);
assert.doesNotMatch(panel, /COMPOSER_PREDICT_DEBOUNCE_MS|canRequestComposerPredict/);
assert.match(panel, /armComposerPredictAfterQuotaSpend/);

console.log('chat composer predict checks passed');
