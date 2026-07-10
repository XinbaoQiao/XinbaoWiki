'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { createPortal } from 'react-dom';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

type Language = 'en' | 'zh';
type MessageRole = 'user' | 'assistant';
type Message = { role: MessageRole; content: string };

type Props = { language: Language };

const MAX_INPUT_LENGTH = 1000;
const GENERIC_ERROR = 'Xinbao AI is temporarily unavailable. Please try again later.';

const copy = {
  en: {
    ariaOpen: 'Open Chat with Xinbao',
    close: 'Close',
    minimize: 'Minimize',
    restore: 'Restore Chat with Xinbao',
    greeting: 'Hi, I’m the Xinbaopedia chat assistant. Ask me about Xinbao Qiao’s research, papers, projects, CV/résumé, or contact info; I’ll keep it short, grounded, and clear when the wiki does not have enough evidence.',
    inputLabel: 'Message Chat with Xinbao',
    placeholder: 'Ask about Xinbao, research, papers, projects...',
    send: 'Send',
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
    logNotice: 'Questions may be logged to improve answers.',
    empty: 'Please enter a question.',
    tooLong: `Please keep the message within ${MAX_INPUT_LENGTH} characters.`
  },
  zh: {
    ariaOpen: '打开 Chat with Xinbao',
    close: '关闭',
    minimize: '最小化',
    restore: '恢复 Chat with Xinbao',
    greeting: '嗨，想快速了解乔鑫宝的话，可以直接问我。研究方向、论文、项目、简历和联系方式都行；我会尽量说人话、给准信息，不确定的地方不硬编。',
    inputLabel: '向 Chat with Xinbao 发送消息',
    placeholder: '询问研究方向、论文、项目、联系方式...',
    send: '发送',
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
    logNotice: '问题可能会被记录，用于改进回答。',
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

function ChatMessageContent({ message }: { message: Message }) {
  if (message.role === 'assistant') {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {message.content}
      </ReactMarkdown>
    );
  }

  return message.content;
}

export function ChatWithXinbao({ language }: Props) {
  const strings = copy[language];
  const initialMessages = useMemo<Message[]>(() => [{ role: 'assistant', content: strings.greeting }], [strings.greeting]);
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [typingMessage, setTypingMessage] = useState(() => randomTypingMessage(strings.typing));
  const [error, setError] = useState('');
  const [remaining, setRemaining] = useState<number | null>(null);
  const [limit, setLimit] = useState(10);
  const [mounted, setMounted] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

    const history = messages
      .filter((item) => item.role === 'user' || item.role === 'assistant')
      .slice(-6)
      .map((item) => ({ role: item.role, content: item.content.slice(0, MAX_INPUT_LENGTH) }));

    setError('');
    setInput('');
    setTypingMessage(randomTypingMessage(strings.typing));
    setLoading(true);
    setMessages((current) => [...current, { role: 'user', content: message }]);

    try {
      const response = await fetch(chatEndpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history })
      });
      const data = await response.json().catch(() => null) as
        | { reply?: unknown; error?: unknown; remaining?: unknown; limit?: unknown }
        | null;

      if (typeof data?.limit === 'number') setLimit(data.limit);
      if (typeof data?.remaining === 'number') setRemaining(data.remaining);

      if (!response.ok) {
        const visibleError = response.status === 429 && typeof data?.error === 'string' ? data.error : GENERIC_ERROR;
        setError(visibleError);
        return;
      }

      const reply = typeof data?.reply === 'string' ? data.reply.trim() : '';
      if (!reply) {
        setError(GENERIC_ERROR);
        return;
      }

      setMessages((current) => [...current, { role: 'assistant', content: reply }]);
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setLoading(false);
    }
  }

  const chatLayer = (
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
              <h2>Chat with Xinbao</h2>
              <p>{remaining === null ? strings.quotaUnknown : strings.quota(remaining, limit)}</p>
              <p>{strings.logNotice}</p>
            </div>
            <div className="chat-xinbao-actions">
              <button aria-label={strings.minimize} onClick={() => setMinimized(true)} type="button">-</button>
              <button
                aria-label={strings.close}
                onClick={() => {
                  setOpen(false);
                  setMinimized(false);
                }}
                type="button"
              >
                ×
              </button>
            </div>
          </header>
          <div className="chat-xinbao-messages">
            {messages.map((message, index) => (
              <div className={`chat-xinbao-message ${message.role}`} key={`${message.role}-${index}`}>
                <ChatMessageContent message={message} />
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
          {error && <div className="chat-xinbao-error" role="alert">{error}</div>}
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
              <button disabled={loading || !input.trim()} type="submit">{strings.send}</button>
            </div>
          </form>
        </section>
      )}
    </>
  );

  return (
    <>
      <button
        aria-label={strings.ariaOpen}
        className="chat-xinbao-trigger"
        onClick={() => {
          setOpen(true);
          setMinimized(false);
        }}
        type="button"
      >
        <span aria-hidden="true">AI</span>
      </button>
      {mounted && createPortal(chatLayer, document.body)}
    </>
  );
}
