'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
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

type Props = {
  language: Language;
  onClose: () => void;
  open: boolean;
  restoreRequest: number;
};

const MAX_INPUT_LENGTH = 1000;
const CLIENT_REQUEST_TIMEOUT_MS = 15_000;

const copy = {
  en: {
    close: 'Close',
    minimize: 'Minimize',
    restore: 'Restore Chat with Xinbao',
    greeting: 'Hey, you made it 👋 Pull up a chair. Here for the paper lore, a project rabbit hole, or whatever Xinbao is cooking up lately? I’ll bring the receipts when I have them—and keep it real when I don’t.',
    inputLabel: 'Message Chat with Xinbao',
    placeholder: 'Ask about Xinbao, research, papers, projects...',
    send: 'Send',
    cancel: 'Cancel',
    retry: 'Retry',
    sources: 'Sources',
    genericError: 'Xinbao AI is temporarily unavailable. Please try again later.',
    networkError: 'Network connection failed. Check your connection and retry.',
    timeoutError: 'Chat with Xinbao took too long to respond. Please retry.',
    cancelledError: 'Request cancelled. Your question is ready to retry.',
    typing: [
      'Checking Xinbaopedia notes',
      'Looking through public pages',
      'Tracing the research thread',
      'Sorting papers and projects',
      'Checking the CV context',
      'Drafting a grounded answer',
      'Keeping unsupported claims out',
      'Almost there'
    ],
    quotaUnknown: '10 messages/day',
    quota: (remaining: number, limit: number) => `${remaining}/${limit} messages left today`,
    empty: 'Please enter a question.',
    tooLong: `Please keep the message within ${MAX_INPUT_LENGTH} characters.`
  },
  zh: {
    close: '关闭',
    minimize: '最小化',
    restore: '恢复 Chat with Xinbao',
    greeting: '嗨，来都来了，先坐会儿 👋 想聊论文、项目，还是看看鑫宝最近又在折腾什么？有一说一，能查到的我认真说，查不到的咱也不硬编。',
    inputLabel: '向 Chat with Xinbao 发送消息',
    placeholder: '询问研究方向、论文、项目、联系方式...',
    send: '发送',
    cancel: '取消',
    retry: '重试',
    sources: '参考页面',
    genericError: 'Xinbao AI 暂时不可用，请稍后重试。',
    networkError: '网络连接失败，请检查连接后重试。',
    timeoutError: 'Chat with Xinbao 响应超时，请重试。',
    cancelledError: '请求已取消，当前问题可以直接重试。',
    typing: [
      '正在查公开资料',
      '正在整理相关页面',
      '正在串一下论文和项目',
      '正在核对简历信息',
      '先看资料，不硬编',
      '正在组织成好读的回答',
      '马上整理好'
    ],
    quotaUnknown: '每天 10 条消息',
    quota: (remaining: number, limit: number) => `今天还剩 ${remaining}/${limit} 条消息`,
    empty: '请输入一个问题。',
    tooLong: `请将消息控制在 ${MAX_INPUT_LENGTH} 个字符以内。`
  }
};

function chatEndpoint() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  return `${basePath}/api/chat-with-xinbao/`;
}

function randomTypingMessage(options: string[]) {
  return options[Math.floor(Math.random() * options.length)] ?? options[0] ?? '';
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
                  <a href={source.href}>
                    {source.title}{source.section ? ` — ${source.section}` : ''}
                  </a>
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

export function ChatWithXinbaoPanel({ language, onClose, open, restoreRequest }: Props) {
  const strings = copy[language];
  const initialMessages = useMemo<Message[]>(() => [{ role: 'assistant', content: strings.greeting }], [strings.greeting]);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [typingMessage, setTypingMessage] = useState(() => randomTypingMessage(strings.typing));
  const [error, setError] = useState('');
  const [retryRequest, setRetryRequest] = useState<RetryRequest | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [limit, setLimit] = useState(10);
  const [mounted, setMounted] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const activeRequestRef = useRef<AbortController | null>(null);

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
    setMessages((current) => {
      if (current.length > 1) return current;
      return initialMessages;
    });
  }, [initialMessages]);

  useEffect(() => {
    if (!open || minimized) return;
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, loading, open, minimized]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function refreshQuota() {
      try {
        const response = await fetch(chatEndpoint(), { method: 'GET' });
        const data = await response.json().catch(() => null) as { remaining?: unknown; limit?: unknown } | null;
        if (cancelled || !response.ok) return;
        if (typeof data?.limit === 'number') setLimit(data.limit);
        if (typeof data?.remaining === 'number') setRemaining(data.remaining);
      } catch {
        // Keep the neutral quota label if the quota endpoint is temporarily unavailable.
      }
    }

    void refreshQuota();
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function sendMessage(message: string, language: Language, appendUserMessage: boolean) {
    setError('');
    setRetryRequest(null);
    setInput('');
    setTypingMessage(randomTypingMessage(strings.typing));
    setLoading(true);
    if (appendUserMessage) {
      setMessages((current) => [...current, { role: 'user', content: message }]);
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
        body: JSON.stringify({ message, language }),
        signal: controller.signal
      });
      const data = await response.json().catch(() => null) as
        | { reply?: unknown; error?: unknown; remaining?: unknown; limit?: unknown; sources?: unknown }
        | null;

      if (typeof data?.limit === 'number') setLimit(data.limit);
      if (typeof data?.remaining === 'number') setRemaining(data.remaining);

      if (!response.ok) {
        const visibleError = response.status === 429 && typeof data?.error === 'string' ? data.error : strings.genericError;
        setRetryRequest({ message, language });
        setError(visibleError);
        return;
      }

      const reply = typeof data?.reply === 'string' ? data.reply.trim() : '';
      if (!reply) {
        setRetryRequest({ message, language });
        setError(strings.genericError);
        return;
      }

      setMessages((current) => [...current, {
        role: 'assistant',
        content: reply,
        sources: sanitizeSources(data?.sources)
      }]);
    } catch (requestError) {
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
    if (!retryRequest || loading) return;
    void sendMessage(retryRequest.message, retryRequest.language, false);
  }

  if (!mounted) return null;

  return createPortal(
    <>
      {open && minimized && (
        <button
          aria-label={strings.restore}
          className="chat-xinbao-minimized"
          onClick={() => setMinimized(false)}
          type="button"
        >
          Chat with Xinbao
        </button>
      )}
      {open && !minimized && (
        <section aria-label="Chat with Xinbao" className="chat-xinbao-shell">
          <header className="chat-xinbao-header">
            <div>
              <h2><span aria-hidden="true" className="chat-xinbao-mark">AI</span>Chat with Xinbao</h2>
              <p>{remaining === null ? strings.quotaUnknown : strings.quota(remaining, limit)}</p>
            </div>
            <div className="chat-xinbao-actions">
              <button aria-label={strings.minimize} onClick={() => setMinimized(true)} type="button">-</button>
              <button aria-label={strings.close} onClick={onClose} type="button">×</button>
            </div>
          </header>
          <div className="chat-xinbao-messages">
            {messages.map((message, index) => (
              <div className={`chat-xinbao-message ${message.role}`} key={`${message.role}-${index}`}>
                <ChatMessageContent message={message} sourcesLabel={strings.sources} />
              </div>
            ))}
            {loading && (
              <div className="chat-xinbao-typing" role="status">
                <span>{typingMessage}</span>
                <i />
                <i />
                <i />
              </div>
            )}
            <div ref={endRef} />
          </div>
          {error && (
            <div className="chat-xinbao-error" role="alert">
              <span>{error}</span>
              {retryRequest && (
                <button className="chat-xinbao-retry" disabled={loading} onClick={retryLastRequest} type="button">
                  {strings.retry}
                </button>
              )}
            </div>
          )}
          <form className="chat-xinbao-composer" onSubmit={submit}>
            <label className="sr-only" htmlFor="chat-with-xinbao-input">{strings.inputLabel}</label>
            <textarea
              disabled={loading}
              id="chat-with-xinbao-input"
              maxLength={MAX_INPUT_LENGTH}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder={strings.placeholder}
              rows={3}
              value={input}
            />
            <div className="chat-xinbao-composer-footer">
              <span>{MAX_INPUT_LENGTH - input.length}</span>
              {loading ? (
                <button className="chat-xinbao-cancel" onClick={cancelRequest} type="button">{strings.cancel}</button>
              ) : (
                <button disabled={!input.trim()} type="submit">{strings.send}</button>
              )}
            </div>
          </form>
        </section>
      )}
    </>,
    document.body
  );
}
