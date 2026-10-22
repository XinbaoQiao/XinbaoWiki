'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

type Language = 'en' | 'zh';
type Props = { language: Language };

const ChatWithXinbaoPanel = dynamic(
  () => import('@/components/ChatWithXinbaoPanel').then((module) => module.ChatWithXinbaoPanel),
  { ssr: false }
);

const openLabels: Record<Language, string> = {
  en: 'Open Chat with Xinbao',
  zh: '打开 Chat with Xinbao'
};

function ensureKatexStylesheet() {
  if (typeof document === 'undefined') return;
  if (document.querySelector('link[data-katex-css]')) return;
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `${basePath}/vendor/katex.min.css`;
  link.dataset.katexCss = '';
  document.head.appendChild(link);
}

export function ChatWithXinbao({ language }: Props) {
  const [hasOpened, setHasOpened] = useState(false);
  const [open, setOpen] = useState(false);
  const [restoreRequest, setRestoreRequest] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (hasOpened) ensureKatexStylesheet();
  }, [hasOpened]);

  function closeChat() {
    setOpen(false);
    requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  }

  return (
    <>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={openLabels[language]}
        className="chat-xinbao-trigger"
        onClick={() => {
          setHasOpened(true);
          setOpen(true);
          setRestoreRequest((current) => current + 1);
        }}
        ref={triggerRef}
        type="button"
      >
        <span aria-hidden="true">AI</span>
      </button>
      {hasOpened && (
        <ChatWithXinbaoPanel
          language={language}
          onClose={closeChat}
          open={open}
          restoreRequest={restoreRequest}
        />
      )}
    </>
  );
}
