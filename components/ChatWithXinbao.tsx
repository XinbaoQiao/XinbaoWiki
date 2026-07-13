'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

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

export function ChatWithXinbao({ language }: Props) {
  const [hasOpened, setHasOpened] = useState(false);
  const [open, setOpen] = useState(false);
  const [restoreRequest, setRestoreRequest] = useState(0);

  return (
    <>
      <button
        aria-label={openLabels[language]}
        className="chat-xinbao-trigger"
        onClick={() => {
          setHasOpened(true);
          setOpen(true);
          setRestoreRequest((current) => current + 1);
        }}
        type="button"
      >
        <span aria-hidden="true">AI</span>
      </button>
      {hasOpened && (
        <ChatWithXinbaoPanel
          language={language}
          onClose={() => setOpen(false)}
          open={open}
          restoreRequest={restoreRequest}
        />
      )}
    </>
  );
}
