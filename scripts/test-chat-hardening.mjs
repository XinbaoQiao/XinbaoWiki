import assert from 'node:assert/strict';
import fs from 'node:fs';

const panel = fs.readFileSync('components/ChatWithXinbaoPanel.tsx', 'utf8');
const route = fs.readFileSync('app/api/chat-with-xinbao/route.ts', 'utf8');

function hasAll(text, needles, label) {
  let index = -1;
  for (const needle of needles) {
    const next = text.indexOf(needle, index + 1);
    assert.notEqual(next, -1, label + ': missing ' + needle);
    index = next;
  }
}

assert.match(panel, /CLIENT_REQUEST_TIMEOUT_MS = 25_000/, 'client leaves headroom beyond the backend provider deadline');
assert.match(route, /REQUEST_TIMEOUT_MS = 20_000/, 'backend provider deadline accommodates the observed upstream latency');
assert.ok(panel.includes('activeRequestRef = useRef<AbortController | null>(null)'), 'client keeps the active AbortController');
hasAll(panel, ['const controller = new AbortController()', 'signal: controller.signal'], 'client passes AbortController.signal to fetch');
hasAll(panel, ['const timeout = setTimeout(() => {', 'timedOut = true;', 'controller.abort();'], 'client aborts slow requests with timeout state');
hasAll(panel, ['function cancelRequest()', 'activeRequestRef.current?.abort();'], 'client cancel button aborts the active request');
hasAll(panel, ['if (!open) activeRequestRef.current?.abort();', '[open]'], 'closing the panel aborts the active request');
hasAll(panel, ['setInput(message);', 'setRetryRequest({ message, language });'], 'failed requests preserve the current question and retry target');
assert.ok(panel.includes('void sendMessage(retryRequest.message, retryRequest.language, false)'), 'one-click retry resends without duplicating the user bubble');
hasAll(panel, ['networkError:', 'timeoutError:', 'cancelledError:'], 'client distinguishes network, timeout, and cancelled states');
hasAll(panel, ['className="chat-xinbao-retry"', 'className="chat-xinbao-cancel"'], 'client exposes retry and cancel controls');
hasAll(panel, ["typeof data?.limit === 'number'", "typeof data?.remaining === 'number'"], 'client preserves quota updates from all responses');

assert.ok(route.includes("response.headers.set('Retry-After'"), '429 responses can include Retry-After');
hasAll(route, ['export async function GET', 'let dailyUsage: number;', 'dailyUsage = await readDailyUsage', "logServerIssue('daily quota read failed');", 'return genericUnavailable(visitorCookie);', 'const diagnostic'], 'GET fails unavailable when its daily quota read fails');
hasAll(route, ['export async function POST', 'let previousDailyCount: number;', 'previousDailyCount = await readDailyUsage', "logServerIssue('daily quota read failed');", 'return genericUnavailable(visitorCookie);', 'if (previousDailyCount >= DAILY_LIMIT)', 'reserveCooldown(redis, cooldownKey)'], 'POST fails unavailable before reservations when its daily quota read fails');
assert.equal(route.match(/logServerIssue\('daily quota read failed'\)/g)?.length, 2, 'GET and POST each log quota read failures without error details');
const postQuotaReadStart = route.indexOf('let previousDailyCount: number;');
const postQuotaReadEnd = route.indexOf('if (previousDailyCount >= DAILY_LIMIT)', postQuotaReadStart);
assert.ok(postQuotaReadStart !== -1 && postQuotaReadEnd > postQuotaReadStart, 'POST quota-read failure block is present');
const postQuotaReadBlock = route.slice(postQuotaReadStart, postQuotaReadEnd);
assert.ok(!/reserveCooldown|refundDailyUsage|clearCooldown/.test(postQuotaReadBlock), 'POST quota-read failure performs no reservation cleanup before any reservation exists');
hasAll(route, ['previousDailyCount >= DAILY_LIMIT', 'retryAfterSeconds: quotaTtl'], 'daily-limit 429 advertises the daily reset retry window');
hasAll(route, ['reserveCooldown(redis, cooldownKey)', 'if (!cooldown) return genericUnavailable(visitorCookie);', 'retryAfterSeconds: cooldown.retryAfterSeconds'], 'cooldown Redis failures fail unavailable while cooldown 429 advertises the Redis TTL');
assert.ok(route.includes("logServerIssue('cooldown reservation failed')"), 'cooldown Redis exceptions are logged instead of converted to rate limits');
hasAll(route, ['let hourlyIpCount: number;', "logServerIssue('hourly IP reservation failed')", 'await clearCooldown(chatRedis, cooldownKey);', 'return genericUnavailable(visitorCookie);', 'hourlyIpCount > HOURLY_IP_LIMIT', 'retryAfterSeconds:'], 'hourly IP Redis failures clear cooldown and rate-limit rejections still report retry windows');
hasAll(route, ['let dailyCount: number;', "logServerIssue('daily quota reservation failed')", 'await clearCooldown(chatRedis, cooldownKey);', 'return genericUnavailable(visitorCookie);', 'dailyCount > DAILY_LIMIT', 'retryAfterSeconds: quotaTtl'], 'daily quota Redis failures clear cooldown and quota rejections report retry windows');
hasAll(route, ["type ProviderReservationPolicy = 'release' | 'retain'", 'unavailableAfterProvider', "reservationPolicy: ProviderReservationPolicy = 'release'", "if (reservationPolicy === 'release')", 'refundDailyUsage(chatRedis, dailyKeys)', 'clearCooldown(chatRedis, cooldownKey)'], 'provider failure cleanup defaults to releasing quota and cooldown');
hasAll(route, ["retrieval failed'", 'refundDailyUsage(chatRedis, dailyKeys)', 'clearCooldown(chatRedis, cooldownKey)'], 'internal retrieval failures refund quota and clear cooldown');
hasAll(route, ['function requestIp', 'x-vercel-forwarded-for', "process.env.VERCEL === '1'", "CHAT_TRUST_PROXY_HEADERS === 'true'", 'x-forwarded-for', 'x-real-ip', 'anonymous-network'], 'proxy IP headers are trusted only inside explicit deployment or env boundaries');
assert.ok(!route.includes("return forwarded || request.headers.get('x-real-ip') || '0.0.0.0'"), 'route no longer unconditionally trusts generic proxy IP headers');
assert.ok(route.includes('linkedRequestController(request.signal, REQUEST_TIMEOUT_MS)'), 'provider deadline links to the client disconnect signal');
hasAll(route, ["let abortReason: 'client' | 'timeout' | null", 'abortReason ??= reason;', "setTimeout(() => abort('timeout'), timeoutMs)", "return abortReason === 'client'"], 'linked abort controller preserves the first abort reason');
assert.ok(route.includes('client-aborted'), 'client disconnects are observable separately from provider timeouts');
const providerCatchStart = route.indexOf('  } catch (error) {', route.indexOf('linkedRequestController(request.signal, REQUEST_TIMEOUT_MS)'));
const providerCatchEnd = route.indexOf('  } finally {', providerCatchStart);
assert.ok(providerCatchStart !== -1 && providerCatchEnd > providerCatchStart, 'provider catch policy block is present');
const providerCatch = route.slice(providerCatchStart, providerCatchEnd);
hasAll(providerCatch, ["if (aborted && providerAbort.clientAborted)", "unavailableAfterProvider('client-aborted', providerFailureDetails, 'retain')", "providerAbort.timedOut ? 'timeout' : 'request-error'", "unavailableAfterProvider(outcome, providerFailureDetails, 'release')"], 'client aborts retain reservations while timeouts and request failures release them');
assert.ok(!providerCatch.includes('refundDailyUsage') && !providerCatch.includes('clearCooldown'), 'provider catch delegates all cleanup through the explicit reservation policy');
hasAll(route, ['requestCompletion,', 'signal: providerAbort.signal,', 'sources: retrieval.sources'], 'grounded resolver still receives frozen sources and the shared abort signal');
assert.ok(route.includes('stream: false'), 'route keeps non-streaming provider output until citations are validated');
assert.ok(!route.includes('validateAndCompactCitations('), 'route still cannot bypass the grounded citation guard');

console.log('chat hardening structure checks passed');
