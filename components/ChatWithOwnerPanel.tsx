'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { WikiHrefLink } from '@/components/WikiHrefLink';
import { siteConfig } from '@/lib/site-config';
import ReactMarkdown from 'react-markdown';
import { createPortal } from 'react-dom';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

type Language = 'en' | 'zh';
type MessageRole = 'user' | 'assistant';
type ChatSource = {
  chunkId: string;
  slug: string;
  title: string;
  section: string;
  href: string;
};
type Message = { role: MessageRole; content: string; sources?: ChatSource[] };
type RetryRequest = { message: string; language: Language };
type QuickPrompt = { id: string; label: string; message: string };

type Props = {
  language: Language;
  onClose: () => void;
  open: boolean;
  restoreRequest: number;
};

const MAX_INPUT_LENGTH = 1000;
const CLIENT_REQUEST_TIMEOUT_MS = 25_000;

const copy = {
  en: {
    close: 'Close',
    minimize: 'Minimize',
    restore: 'Restore Chat with the owner',
    newChat: 'New chat',
    greeting: siteConfig.chat.en.greeting,
    quickPrompts: [...siteConfig.chat.en.quickPrompts] as QuickPrompt[],
    quickPromptsLabel: 'Quick starts',
    inputLabel: 'Message Chat with the owner',
    placeholder: 'Try research, a paper, a project, or contact info...',
    send: 'Send',
    cancel: 'Cancel',
    retry: 'Retry',
    sources: 'Sources',
    genericError: 'Site AI is temporarily unavailable. Please try again later.',
    networkError: 'Network connection failed. Check your connection and retry.',
    timeoutError: 'Chat with the owner took too long to respond. Please retry.',
    cancelledError: 'Request cancelled. Your question is ready to retry.',
    quotaExhausted: 'Daily limit reached. Please come back tomorrow.',
    retryAfter: (seconds: number) => `Please wait ${seconds}s before trying again.`,
    typing: [
      'Checking MyWiki notes',
      'Looking through public pages',
      'Tracing the research thread',
      'Sorting papers and projects',
      'Checking the CV context',
      'Drafting a grounded answer',
      'Keeping unsupported claims out',
      'Almost ready'
    ],
    quotaUnknown: '10 messages/day',
    quota: (remaining: number, limit: number) => `${remaining}/${limit} messages left today`,
    empty: 'Please enter a question.',
    tooLong: `Please keep the message within ${MAX_INPUT_LENGTH} characters.`
  },
  zh: {
    close: '关闭',
    minimize: '最小化',
    restore: '恢复 Chat with the owner',
    newChat: '新对话',
    greeting: siteConfig.chat.zh.greeting,
    quickPrompts: [...siteConfig.chat.zh.quickPrompts] as QuickPrompt[],
    quickPromptsLabel: '快捷提问',
    inputLabel: '向 Chat with the owner 发送消息',
    placeholder: '试试研究方向、论文、项目或联系方式...',
    send: '发送',
    cancel: '取消',
    retry: '重试',
    sources: '参考页面',
    genericError: 'Site AI 暂时不可用，请稍后重试。',
    networkError: '网络连接失败，请检查连接后重试。',
    timeoutError: 'Chat with the owner 响应超时，请重试。',
    cancelledError: '请求已取消，当前问题可以直接重试。',
    quotaExhausted: '今日消息次数已用完，请明天再来。',
    retryAfter: (seconds: number) => `请等待 ${seconds} 秒后再试。`,
    typing: [
      '正在查公开资料',
      '正在整理相关页面',
      '正在串一下论文和项目',
      '正在核对简历信息',
      '先看资料，不硬编',
      '正在组织成好读的回答',
      '马上就好'
    ],
    quotaUnknown: '每天 10 条消息',
    quota: (remaining: number, limit: number) => `今天还剩 ${remaining}/${limit} 条消息`,
    empty: '请输入一个问题。',
    tooLong: `请将消息控制在 ${MAX_INPUT_LENGTH} 个字符以内。`
  }
};

function chatEndpoint() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  return `${basePath}/api/chat-with-owner/`;
}

function randomTypingMessage(options: string[]) {
  return options[Math.floor(Math.random() * options.length)] ?? options[0] ?? '';
}

function parseRetryAfterSeconds(response: Response) {
  const raw = response.headers.get('Retry-After');
  if (!raw) return null;
  const asNumber = Number(raw);
  if (Number.isFinite(asNumber) && asNumber > 0) return Math.min(3600, Math.ceil(asNumber));
  const asDate = Date.parse(raw);
  if (!Number.isFinite(asDate)) return null;
  const seconds = Math.ceil((asDate - Date.now()) / 1000);
  return seconds > 0 ? Math.min(3600, seconds) : null;
}

function sanitizeSources(value: unknown): ChatSource[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap((item): ChatSource[] => {
    if (!item || typeof item !== 'object') return [];
    const source = item as Partial<ChatSource>;
    if (
      typeof source.chunkId !== 'string' ||
      typeof source.slug !== 'string' ||
      typeof source.title !== 'string' ||
      typeof source.section !== 'string' ||
      typeof source.href !== 'string' ||
      !source.href.startsWith('/') ||
      source.href.startsWith('//') ||
      !source.href.includes('/wiki/') ||
      seen.has(source.chunkId)
    ) return [];
    seen.add(source.chunkId);
    return [{
      chunkId: source.chunkId.slice(0, 180),
      slug: source.slug.slice(0, 120),
      title: source.title.slice(0, 180),
      section: source.section.slice(0, 180),
      href: source.href.slice(0, 300)
    }];
  }).slice(0, 8);
}

function ChatMessageContent({ message, sourcesLabel }: { message: Message; sourcesLabel: string }) {
  if (message.role === 'assistant') {
    return (
      <>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {message.content}
        </ReactMarkdown>
        {message.sources && message.sources.length > 0 && (
          <nav aria-label={sourcesLabel}>
            <strong>{sourcesLabel}</strong>
            <ol>
              {message.sources.map((source) => (
                <li key={source.chunkId}>
                  <WikiHrefLink href={source.href}>
                    {source.title}{source.section ? ` — ${source.section}` : ''}
                  </WikiHrefLink>
                </li>
              ))}
            </ol>
          </nav>
        )}
      </>
    );
  }

  return message.content;
}

function getFocusableElements(root: HTMLElement) {
  return [...root.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )].filter((element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true');
}

export function ChatWithOwnerPanel({ language, onClose, open, restoreRequest }: Props) {
  const strings = copy[language];
  const initialMessages = useMemo<Message[]>(() => [{ role: 'assistant', content: strings.greeting }], [strings.greeting]);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [typingMessage, setTypingMessage] = useState(() => randomTypingMessage(strings.typing));
  const [error, setError] = useState('');
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(null);
  const [retryRequest, setRetryRequest] = useState<RetryRequest | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [serviceAvailable, setServiceAvailable] = useState(true);
  const [limit, setLimit] = useState(10);
  const [mounted, setMounted] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const activeRequestRef = useRef<AbortController | null>(null);
  const conversationIdRef = useRef('');
  const dragStartY = useRef<number | null>(null);
  const quotaExhausted = remaining === 0;
  const composerDisabled = loading || quotaExhausted || !serviceAvailable;

  useEffect(() => {
    setMounted(true);
    return () => {
      activeRequestRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (open) setMinimized(false);
  }, [open, restoreRequest]);

  useEffect(() => {
    if (!open) activeRequestRef.current?.abort();
  }, [open]);

  useEffect(() => {
    // Language changes start a fresh localized session so chrome, greeting, and history stay consistent.
    activeRequestRef.current?.abort();
    setLoading(false);
    setInput('');
    setError('');
    setRetryAfterSeconds(null);
    setRetryRequest(null);
    setMessages(initialMessages);
    conversationIdRef.current = crypto.randomUUID();
  }, [initialMessages]);

  useEffect(() => {
    if (!open || minimized) return;
    const scroller = messagesRef.current;
    if (!scroller) return;
    scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, open, minimized]);

  useEffect(() => {
    if (!open || minimized) return;
    const coarse = window.matchMedia('(hover: none), (pointer: coarse), (max-width: 720px)').matches;
    if (coarse) return;
    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open, minimized, restoreRequest]);

  useEffect(() => {
    if (!open || minimized) return;
    const viewport = window.visualViewport;
    if (!viewport) return;

    const apply = () => {
      const shell = shellRef.current;
      if (!shell) return;
      const keyboardInset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      shell.style.setProperty('--chat-keyboard-inset', `${keyboardInset}px`);
    };

    apply();
    viewport.addEventListener('resize', apply);
    viewport.addEventListener('scroll', apply);
    return () => {
      viewport.removeEventListener('resize', apply);
      viewport.removeEventListener('scroll', apply);
      shellRef.current?.style.removeProperty('--chat-keyboard-inset');
    };
  }, [open, minimized]);

  useEffect(() => {
    if (!open || minimized) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !shellRef.current) return;
      const focusable = getFocusableElements(shellRef.current);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, minimized, onClose, messages, loading, error, quotaExhausted]);

  useEffect(() => {
    if (retryAfterSeconds === null || retryAfterSeconds <= 0) return;
    const timer = window.setTimeout(() => {
      setRetryAfterSeconds((current) => {
        if (current === null || current <= 1) return null;
        return current - 1;
      });
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [retryAfterSeconds]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function refreshQuota() {
      try {
        const response = await fetch(chatEndpoint(), { method: 'GET' });
        const data = await response.json().catch(() => null) as {
          remaining?: unknown;
          limit?: unknown;
          meta?: { modelApiConfigured?: unknown };
          error?: unknown;
        } | null;
        if (cancelled) return;
        if (!response.ok) {
          if (response.status === 503) {
            setServiceAvailable(false);
            setError(typeof data?.error === 'string' && data.error.trim() ? data.error : strings.genericError);
          }
          return;
        }
        if (typeof data?.limit === 'number') setLimit(data.limit);
        if (typeof data?.remaining === 'number') setRemaining(data.remaining);
        const configured = data?.meta?.modelApiConfigured;
        if (configured === false) {
          setServiceAvailable(false);
          setError(strings.genericError);
          return;
        }
        if (configured === true) {
          setServiceAvailable(true);
          setError((current) => (current === strings.genericError ? '' : current));
        }
      } catch {
        // Keep the neutral quota label if the quota endpoint is temporarily unavailable.
      }
    }

    void refreshQuota();
    return () => {
      cancelled = true;
    };
  }, [open]);

  function rollbackFailedUserMessage(message: string, appended: boolean) {
    if (!appended) return;
    setMessages((current) => {
      const last = current[current.length - 1];
      if (!last || last.role !== 'user' || last.content !== message) return current;
      return current.slice(0, -1);
    });
  }

  async function sendMessage(message: string, language: Language, appendUserMessage: boolean) {
    if (quotaExhausted) {
      setError(strings.quotaExhausted);
      return;
    }

    setError('');
    setRetryAfterSeconds(null);
    setRetryRequest(null);
    setInput('');
    setTypingMessage(randomTypingMessage(strings.typing));
    setLoading(true);
    let appended = false;
    if (appendUserMessage) {
      setMessages((current) => [...current, { role: 'user', content: message }]);
      appended = true;
    }

    const controller = new AbortController();
    activeRequestRef.current = controller;
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, CLIENT_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(chatEndpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, language, conversationId: conversationIdRef.current || (conversationIdRef.current = crypto.randomUUID()) }),
        signal: controller.signal
      });
      const data = await response.json().catch(() => null) as
        | { reply?: unknown; error?: unknown; remaining?: unknown; limit?: unknown; sources?: unknown }
        | null;

      if (typeof data?.limit === 'number') setLimit(data.limit);
      if (typeof data?.remaining === 'number') setRemaining(data.remaining);

      if (!response.ok) {
        rollbackFailedUserMessage(message, appended);
        const retryAfter = parseRetryAfterSeconds(response);
        if (retryAfter) setRetryAfterSeconds(retryAfter);
        const serverError = typeof data?.error === 'string' ? data.error : '';
        const visibleError = response.status === 429
          ? (serverError || (retryAfter ? strings.retryAfter(retryAfter) : strings.genericError))
          : (serverError || strings.genericError);
        setRetryRequest({ message, language });
        setError(visibleError);
        // A single POST failure is not a health verdict. Keep quick-asks usable when quota remains.
        if (response.status !== 429 && (typeof data?.remaining === 'number' ? data.remaining > 0 : remaining === null || remaining > 0)) {
          setServiceAvailable(true);
        }
        return;
      }

      const reply = typeof data?.reply === 'string' ? data.reply.trim() : '';
      if (!reply) {
        rollbackFailedUserMessage(message, appended);
        setRetryRequest({ message, language });
        setError(strings.genericError);
        return;
      }

      setServiceAvailable(true);
      setMessages((current) => [...current, {
        role: 'assistant',
        content: reply,
        sources: sanitizeSources(data?.sources)
      }]);
    } catch (requestError) {
      rollbackFailedUserMessage(message, appended);
      setInput(message);
      setRetryRequest({ message, language });
      const aborted = requestError instanceof DOMException && requestError.name === 'AbortError';
      setError(aborted ? (timedOut ? strings.timeoutError : strings.cancelledError) : strings.networkError);
    } finally {
      clearTimeout(timeout);
      if (activeRequestRef.current === controller) activeRequestRef.current = null;
      setLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (composerDisabled) return;
    const message = input.trim();
    if (!message) {
      setError(strings.empty);
      return;
    }
    if (message.length > MAX_INPUT_LENGTH) {
      setError(strings.tooLong);
      return;
    }

    await sendMessage(message, language, true);
  }

  function cancelRequest() {
    activeRequestRef.current?.abort();
  }

  function retryLastRequest() {
    if (!retryRequest || loading || quotaExhausted) return;
    void sendMessage(retryRequest.message, retryRequest.language, true);
  }

  function sendQuickPrompt(message: string) {
    const trimmed = message.trim();
    if (!trimmed || composerDisabled) return;
    void sendMessage(trimmed, language, true);
  }

  function startNewChat() {
    conversationIdRef.current = crypto.randomUUID();
    activeRequestRef.current?.abort();
    setLoading(false);
    setInput('');
    setError('');
    setRetryAfterSeconds(null);
    setRetryRequest(null);
    setMessages(initialMessages);
    void (async () => {
      try {
        const response = await fetch(chatEndpoint(), { method: 'GET' });
        const data = await response.json().catch(() => null) as {
          remaining?: unknown;
          limit?: unknown;
          meta?: { modelApiConfigured?: unknown };
        } | null;
        if (!response.ok) return;
        if (typeof data?.limit === 'number') setLimit(data.limit);
        if (typeof data?.remaining === 'number') setRemaining(data.remaining);
        if (data?.meta?.modelApiConfigured === true) setServiceAvailable(true);
        if (data?.meta?.modelApiConfigured === false) setServiceAvailable(false);
      } catch {
        // ignore health refresh failures on new chat
      }
    })();
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  const showQuickPrompts = messages.length === 1 && !loading && !quotaExhausted;
  const waitHint = retryAfterSeconds ? strings.retryAfter(retryAfterSeconds) : '';
  const baseError = error || (quotaExhausted ? strings.quotaExhausted : '');
  const visibleError = baseError && waitHint && !baseError.includes(String(retryAfterSeconds))
    ? `${baseError} ${waitHint}`
    : (baseError || waitHint);

  if (!mounted) return null;

  return createPortal(
    <>
      {open && minimized && (
        <button
          aria-label={strings.restore}
          className="chat-owner-minimized"
          onClick={() => setMinimized(false)}
          type="button"
        >
          Chat with the owner
        </button>
      )}
      {open && !minimized && (
        <>
        <button
          aria-label={strings.close}
          className="chat-owner-backdrop"
          onClick={onClose}
          type="button"
        />
        <section
          aria-busy={loading || undefined}
          aria-label="Chat with the owner"
          aria-modal="true"
          className="chat-owner-shell"
          onPointerDown={(event) => {
            if ((event.target as HTMLElement).closest('.chat-owner-grab')) {
              dragStartY.current = event.clientY;
            }
          }}
          onPointerUp={(event) => {
            if (dragStartY.current === null) return;
            const delta = event.clientY - dragStartY.current;
            dragStartY.current = null;
            if (delta > 72) onClose();
          }}
          ref={shellRef}
          role="dialog"
        >
          <button
            aria-label={strings.close}
            className="chat-owner-grab"
            onClick={onClose}
            type="button"
          >
            <span aria-hidden="true" />
          </button>
          <header className="chat-owner-header">
            <div>
              <h2><span aria-hidden="true" className="chat-owner-mark">AI</span>Chat with the owner</h2>
              <p>{remaining === null ? strings.quotaUnknown : strings.quota(remaining, limit)}</p>
            </div>
            <div className="chat-owner-actions">
              <button aria-label={strings.newChat} className="chat-owner-new-chat" onClick={startNewChat} type="button">{strings.newChat}</button>
              <button aria-label={strings.minimize} onClick={() => setMinimized(true)} type="button">-</button>
              <button aria-label={strings.close} onClick={onClose} type="button">×</button>
            </div>
          </header>
          <div className="chat-owner-messages" ref={messagesRef}>
            {messages.map((message, index) => (
              <div className={`chat-owner-message ${message.role}`} key={`${message.role}-${index}`}>
                <ChatMessageContent message={message} sourcesLabel={strings.sources} />
              </div>
            ))}
            {loading && (
              <div className="chat-owner-typing" role="status">
                <span>{typingMessage}</span>
                <i />
                <i />
                <i />
              </div>
            )}
          </div>
          {visibleError && (
            <div className="chat-owner-error" role="alert">
              <span>{visibleError}</span>
              {retryRequest && !quotaExhausted && (
                <button className="chat-owner-retry" disabled={loading || Boolean(retryAfterSeconds)} onClick={retryLastRequest} type="button">
                  {strings.retry}
                </button>
              )}
            </div>
          )}
          <form className="chat-owner-composer" onSubmit={submit}>
            {showQuickPrompts && (
              <div aria-label={strings.quickPromptsLabel} className="chat-owner-quick-replies" role="group">
                {strings.quickPrompts.map((prompt) => (
                  <button
                    className="chat-owner-quick-reply"
                    disabled={composerDisabled}
                    key={prompt.id}
                    onClick={() => sendQuickPrompt(prompt.message)}
                    type="button"
                  >
                    {prompt.label}
                  </button>
                ))}
              </div>
            )}
            <label className="sr-only" htmlFor="chat-with-owner-input">{strings.inputLabel}</label>
            <div className="chat-owner-composer-row">
              <textarea
                disabled={composerDisabled}
                enterKeyHint="send"
                id="chat-with-owner-input"
                maxLength={MAX_INPUT_LENGTH}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                    const coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;
                    if (coarse) return;
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder={strings.placeholder}
                ref={inputRef}
                rows={1}
                value={input}
              />
              {loading ? (
                <button className="chat-owner-cancel" onClick={cancelRequest} type="button">{strings.cancel}</button>
              ) : (
                <button disabled={!input.trim() || quotaExhausted} type="submit">{strings.send}</button>
              )}
            </div>
            <div className="chat-owner-composer-footer">
              <span>{MAX_INPUT_LENGTH - input.length}</span>
            </div>
          </form>
        </section>
        </>
      )}
    </>,
    document.body
  );
}
