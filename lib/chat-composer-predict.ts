export const COMPOSER_PREDICT_MAX_INPUT_LENGTH = 1000;
export const COMPOSER_PREDICT_MAX_SUFFIX_LENGTH = 80;
export const COMPOSER_PREDICT_MAX_TURNS = 4;
export const COMPOSER_PREDICT_TURN_CHARS = 220;

export type ComposerPredictRole = 'user' | 'assistant';

export type ComposerPredictTurn = {
  role: ComposerPredictRole;
  content: string;
};

export type ComposerPredictGateInput = {
  draft: string;
  caretAtEnd: boolean;
  composing: boolean;
  disabled: boolean;
  maxLength?: number;
};

export function normalizeComposerPredictDraft(draft: string): string {
  return draft.trim() ? draft : '';
}

export function canFlushComposerPredict(input: ComposerPredictGateInput): boolean {
  const maxLength = input.maxLength ?? COMPOSER_PREDICT_MAX_INPUT_LENGTH;
  if (input.disabled || input.composing || !input.caretAtEnd) return false;
  if (normalizeComposerPredictDraft(input.draft).length >= maxLength) return false;
  return true;
}

export function trimComposerSuggestion(
  previousDraft: string,
  previousSuggestion: string,
  nextDraft: string,
  caretAtEnd: boolean
): string {
  if (!caretAtEnd || !previousSuggestion) return '';
  if (nextDraft === previousDraft) return previousSuggestion;
  if (nextDraft.startsWith(previousDraft)) {
    const typed = nextDraft.slice(previousDraft.length);
    return previousSuggestion.startsWith(typed) ? previousSuggestion.slice(typed.length) : '';
  }
  return '';
}

function longestOverlap(draft: string, suffix: string): number {
  const max = Math.min(draft.length, suffix.length);
  for (let count = max; count > 0; count -= 1) {
    if (draft.slice(-count) === suffix.slice(0, count)) return count;
  }
  return 0;
}

function stripWrappingQuotes(text: string): string {
  if (text.length < 2) return text;
  const pairs: Array<[string, string]> = [['"', '"'], ["'", "'"], ['\u201c', '\u201d'], ['\u2018', '\u2019'], ['\u300c', '\u300d']];
  for (const [start, end] of pairs) {
    if (text.startsWith(start) && text.endsWith(end)) return text.slice(start.length, -end.length).trim();
  }
  return text;
}

function firstVisibleLine(text: string): string {
  const stripped = text.replace(/```[\s\S]*?```/g, ' ').replace(/`+/g, '');
  const line = stripped.split(/\n+/)[0] ?? '';
  return line.replace(/\s+/g, ' ').trim();
}

function stripProposalLabel(text: string): string {
  return text.replace(/^(?:next message|draft|user|visitor|message)\s*:\s*/i, '').trim();
}

function maybeLeadSpace(draft: string, suffix: string, overlap: number): string {
  if (!suffix || overlap > 0 || !draft) return suffix;
  if (/\s$/.test(draft) || /^\s/.test(suffix) || /^[\p{P}\p{S}]/u.test(suffix)) return suffix;
  if (/[A-Za-z0-9]$/.test(draft) && /^[A-Za-z0-9]/.test(suffix)) return ` ${suffix}`;
  return suffix;
}

function clipSuggestion(text: string, remaining: number): string {
  if (remaining <= 0) return '';
  if (text.length <= remaining) return text;
  const clipped = text.slice(0, remaining);
  const boundary = clipped.lastIndexOf(' ');
  if (boundary >= 16) return clipped.slice(0, boundary);
  return clipped;
}

export function sanitizePredictedSuffix(
  draft: string,
  raw: string,
  maxLength = COMPOSER_PREDICT_MAX_INPUT_LENGTH
): string {
  if (draft.length >= maxLength) return '';
  const normalizedDraft = normalizeComposerPredictDraft(draft);
  if (draft && !normalizedDraft) return '';
  let text = String(raw ?? '').replace(/\r\n/g, '\n');
  if (!text.trim()) return '';
  text = stripProposalLabel(stripWrappingQuotes(text.trim()));
  if (!normalizedDraft) {
    text = firstVisibleLine(text);
    return text ? clipSuggestion(text, Math.min(COMPOSER_PREDICT_MAX_SUFFIX_LENGTH, maxLength)) : '';
  }
  if (text.startsWith(draft)) text = text.slice(draft.length);
  else {
    const trimmedDraft = draft.trimEnd();
    if (trimmedDraft && text.startsWith(trimmedDraft)) text = text.slice(trimmedDraft.length);
  }
  const overlap = longestOverlap(draft, text);
  if (overlap > 0) text = text.slice(overlap);
  text = firstVisibleLine(text);
  if (!text) return '';
  text = maybeLeadSpace(draft, text, overlap);
  return clipSuggestion(text, Math.min(COMPOSER_PREDICT_MAX_SUFFIX_LENGTH, maxLength - draft.length));
}

export function alignArrivedSuggestion(
  requestDraft: string,
  currentDraft: string,
  raw: string,
  maxLength = COMPOSER_PREDICT_MAX_INPUT_LENGTH
): string {
  const requestNormalized = normalizeComposerPredictDraft(requestDraft);
  const currentNormalized = normalizeComposerPredictDraft(currentDraft);
  const suffixFromRequest = sanitizePredictedSuffix(requestNormalized, raw, maxLength);
  const full = `${requestNormalized}${suffixFromRequest}`;
  if (!currentNormalized) {
    return sanitizePredictedSuffix('', full || raw, maxLength);
  }
  if (full.startsWith(currentDraft)) {
    return clipSuggestion(full.slice(currentDraft.length), Math.min(COMPOSER_PREDICT_MAX_SUFFIX_LENGTH, maxLength - currentDraft.length));
  }
  if (full.startsWith(currentNormalized)) {
    return clipSuggestion(full.slice(currentNormalized.length), Math.min(COMPOSER_PREDICT_MAX_SUFFIX_LENGTH, maxLength - currentDraft.length));
  }
  return '';
}

export function contextTurnsForPredict(
  messages: Array<{ role: string; content: string }>,
  maxTurns = COMPOSER_PREDICT_MAX_TURNS,
  maxChars = COMPOSER_PREDICT_TURN_CHARS
): ComposerPredictTurn[] {
  return messages
    .filter((message): message is { role: ComposerPredictRole; content: string } => (
      (message.role === 'user' || message.role === 'assistant')
      && typeof message.content === 'string'
      && Boolean(message.content.trim())
    ))
    .slice(-maxTurns)
    .map((message) => ({
      role: message.role,
      content: message.content.replace(/\s+/g, ' ').trim().slice(0, maxChars)
    }));
}

export function composerPredictContextKey(
  draft: string,
  language: string,
  pagePath: string,
  turns: ComposerPredictTurn[]
): string {
  return JSON.stringify({
    draft,
    language,
    pagePath,
    turns: turns.map((turn) => `${turn.role}:${turn.content}`)
  });
}

export type ParsedComposerPredictBody =
  | { ok: true; draft: string; language: 'en' | 'zh'; pagePath: string; recentTurns: ComposerPredictTurn[] }
  | { ok: false; error: 'invalid' | 'empty' | 'too-long' };

function sanitizePagePath(value: unknown): string {
  if (typeof value !== 'string' || !value) return '';
  const path = value.split(/[?#]/)[0] ?? '';
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return '';
  return path.slice(0, 180);
}

export function parseComposerPredictBody(value: unknown, maxLength = COMPOSER_PREDICT_MAX_INPUT_LENGTH): ParsedComposerPredictBody {
  if (!value || typeof value !== 'object') return { ok: false, error: 'invalid' };
  const body = value as Record<string, unknown>;
  if ('messages' in body && !('recentTurns' in body)) return { ok: false, error: 'invalid' };
  if (typeof body.prompt === 'string' || typeof body.system === 'string' || typeof body.history === 'string') {
    return { ok: false, error: 'invalid' };
  }
  if (typeof body.draft !== 'string') return { ok: false, error: 'invalid' };
  const draft = body.draft;
  if (draft.length > maxLength) return { ok: false, error: 'too-long' };
  if (draft.length > 0 && !draft.trim()) return { ok: false, error: 'empty' };
  if (draft.length >= maxLength) return { ok: false, error: 'too-long' };
  const language = body.language === 'zh' ? 'zh' : body.language === 'en' ? 'en' : null;
  if (!language) return { ok: false, error: 'invalid' };
  const recentTurns = contextTurnsForPredict(
    Array.isArray(body.recentTurns) ? body.recentTurns as Array<{ role: string; content: string }> : []
  );
  if (Array.isArray(body.recentTurns) && body.recentTurns.length > COMPOSER_PREDICT_MAX_TURNS + 2) {
    return { ok: false, error: 'invalid' };
  }
  return {
    ok: true,
    draft,
    language,
    pagePath: sanitizePagePath(body.pagePath),
    recentTurns
  };
}

export function buildComposerPredictPrompt(input: {
  draft: string;
  language: 'en' | 'zh';
  pagePath: string;
  recentTurns: ComposerPredictTurn[];
}): string {
  const preferred = input.language === 'zh' ? 'Chinese' : 'English';
  const turns = input.recentTurns.length > 0
    ? input.recentTurns.map((turn) => `${turn.role}: ${turn.content}`).join('\n')
    : '(none)';
  const emptyDraft = !input.draft;
  const task = emptyDraft
    ? [
        "Propose the visitor's likely next message in the Xinbaopedia chat composer.",
        'Output only that next user message. Do not answer as Xinbao or as an assistant. Do not write a chatbot reply.',
        'Do not use quotation marks, markdown, labels, preambles, or explanations.',
        'Keep it short: one phrase or a short sentence in the preferred language.',
        'Use the recent conversation only to make the visitor\u2019s next message plausible.'
      ]
    : [
        "You complete a visitor's unfinished draft in the Xinbaopedia chat composer.",
        'Output only the missing suffix that should appear immediately after the draft.',
        'Do not repeat the draft. Do not answer as Xinbao or as an assistant. Do not write a chatbot reply.',
        'Do not use quotation marks, markdown, labels, preambles, or explanations.',
        'Keep the continuation short: one phrase or a short sentence in the draft language and style.',
        'Use the recent conversation only to make the visitor\u2019s next message plausible.'
      ];
  return [
    ...task,
    '',
    `Preferred language: ${preferred}`,
    `Current page: ${input.pagePath || '/'}`,
    'Recent conversation:',
    turns,
    '',
    emptyDraft ? 'The composer draft is empty. Propose the next user message.' : `Draft:\n${input.draft}`
  ].join('\n');
}

export function createComposerPredictSession(options: {
  request: (input: { draft: string; signal: AbortSignal }) => Promise<string>;
  createController?: () => AbortController;
  maxLength?: number;
}) {
  const maxLength = options.maxLength ?? COMPOSER_PREDICT_MAX_INPUT_LENGTH;
  const createController = options.createController ?? (() => new AbortController());
  let suggestion = '';
  let previousDraft = '';
  let controller: AbortController | null = null;
  let spendId = 0;
  let pendingSpendId = 0;
  let consumedSpendId = 0;
  let requestDraft = '';
  let currentDraft = '';

  function abortRequest() {
    controller?.abort();
    controller = null;
  }

  function setSuggestionValue(value: string) {
    suggestion = value;
    return suggestion;
  }

  function consumePending() {
    if (pendingSpendId) consumedSpendId = pendingSpendId;
    pendingSpendId = 0;
  }

  function noteQuotaSpend() {
    abortRequest();
    setSuggestionValue('');
    previousDraft = '';
    spendId += 1;
    pendingSpendId = spendId;
    requestDraft = '';
    return spendId;
  }

  function dismiss() {
    abortRequest();
    consumePending();
    previousDraft = currentDraft;
    return setSuggestionValue('');
  }

  function cancel() {
    return dismiss();
  }

  function accept(draft: string): string {
    if (!suggestion) return draft;
    const next = `${draft}${suggestion}`.slice(0, maxLength);
    abortRequest();
    consumePending();
    currentDraft = next;
    previousDraft = next;
    setSuggestionValue('');
    return next;
  }

  function updateDraft(input: { draft: string; caretAtEnd: boolean }): string {
    currentDraft = input.draft;
    const nextSuggestion = trimComposerSuggestion(previousDraft, suggestion, input.draft, input.caretAtEnd);
    previousDraft = input.draft;
    if (!input.caretAtEnd) {
      abortRequest();
      consumePending();
      return setSuggestionValue('');
    }
    return setSuggestionValue(nextSuggestion);
  }

  function flush(input: ComposerPredictGateInput): string {
    currentDraft = input.draft;
    previousDraft = input.draft;
    if (!pendingSpendId || pendingSpendId === consumedSpendId) return suggestion;
    if (input.composing) return suggestion;
    if (!canFlushComposerPredict(input)) {
      dismiss();
      return '';
    }
    const id = pendingSpendId;
    consumePending();
    consumedSpendId = id;
    abortRequest();
    const nextController = createController();
    controller = nextController;
    requestDraft = normalizeComposerPredictDraft(input.draft);
    void options.request({ draft: requestDraft, signal: nextController.signal })
      .then((value) => {
        if (controller !== nextController) return;
        setSuggestionValue(alignArrivedSuggestion(requestDraft, currentDraft, value, maxLength));
        previousDraft = currentDraft;
      })
      .catch(() => {
        if (controller === nextController) setSuggestionValue('');
      });
    return suggestion;
  }

  return {
    noteQuotaSpend,
    flush,
    updateDraft,
    accept,
    dismiss,
    cancel,
    getSuggestion: () => suggestion,
    hasPendingSpend: () => pendingSpendId !== 0 && pendingSpendId !== consumedSpendId
  };
}
