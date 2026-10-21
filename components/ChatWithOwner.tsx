'use client';

import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';

type Language = 'en' | 'zh';
type Props = { language: Language };

const ChatWithOwnerPanel = dynamic(
  () => import('@/components/ChatWithOwnerPanel').then((module) => module.ChatWithOwnerPanel),
  { ssr: false }
);

const openLabels: Record<Language, string> = {
  en: 'Open Chat with the owner',
  zh: '打开 Chat with the owner'
};

export function ChatWithOwner({ language }: Props) {
  const [hasOpened, setHasOpened] = useState(false);
  const [open, setOpen] = useState(false);
  const [restoreRequest, setRestoreRequest] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);

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
        className="chat-owner-trigger"
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
        <ChatWithOwnerPanel
          language={language}
          onClose={closeChat}
          open={open}
          restoreRequest={restoreRequest}
        />
      )}
    </>
  );
}
