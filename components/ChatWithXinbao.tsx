'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
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
    greeting: 'Hi, I am a lightweight digital-proxy skill distilled from Xinbao Qiao’s public homepage and research notes. Ask me about his research, publications, projects, academic background, or public contact information; if the source notes have it, I will lock in.',
    inputLabel: 'Message Chat with Xinbao',
    placeholder: 'Ask about Xinbao, research, papers, projects...',
    send: 'Send',
    typing: [
      'Xinbao AI is on the way',
      'Checking Xinbaopedia notes',
      'Distilling the source notes',
      'BRB, fetching the source notes',
      'Locking in the relevant context',
      'Avoiding unsupported claims',
      'Tracing the research thread',
      'Scanning public wiki pages',
      'Composing a concise answer',
      'Looking up the project trail',
      'Aligning with the source notes',
      'Sorting papers and projects',
      'Turning notes into a reply',
      'Calibrating academic mode',
      'Keeping the answer grounded',
      'Gathering the public facts',
      'Loading guestbook-era energy',
      'Doing an old-school context check',
      'Leaving a tiny wiki footprint',
      'Throwback mode is loading',
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
    greeting: '家人们好，我是被乔鑫宝从公开主页和研究资料里顷刻炼化出来的数字分身 skill。你问他的研究方向、论文项目、学术经历和公开联系方式，我尽量给他爆了；查不到的内容我不会硬编，这波主打一个资料稳。',
    inputLabel: '向 Chat with Xinbao 发送消息',
    placeholder: '询问研究方向、论文、项目、联系方式...',
    send: '发送',
    typing: [
      'Xinbao AI 正在赶来的路上',
      '家人们，答案正在路上',
      '886 还早，答案马上到',
      '来踩踩 Xinbaopedia 的公开资料',
      '冒泡检索中',
      '先别急，Xinbao AI 正在检索',
      '这题我会，正在组织语言',
      '正在翻 Xinbaopedia 的公开资料',
      '正在把 source notes 拿捏一下',
      '正在从研究笔记里捞重点',
      '正在把项目线索串起来',
      '正在给上下文做蒸馏',
      '正在检查公开资料，拒绝硬编',
      '正在把 wiki 页压缩成人话',
      '正在论文和项目之间来回穿梭',
      '正在校准哈基米 energy',
      '正在轻轻召唤 citation',
      '正在切换到资料稳模式',
      '沙发先占，答案马上来',
      '路过一下，顺手查个 citation',
      '爷青回模式启动中',
      '正在从 00s 留言板赶来',
      '正在把回答打磨得不啰嗦'
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
  const endRef = useRef<HTMLDivElement>(null);

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
}
