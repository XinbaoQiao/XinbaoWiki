'use client';

import { useEffect, useState, type ReactNode } from 'react';

export function ArticleFacts({ children, label }: { children: ReactNode; label: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1101px)');
    const update = () => setOpen(desktop.matches);
    update();
    desktop.addEventListener('change', update);
    return () => desktop.removeEventListener('change', update);
  }, []);

  return (
    <details className="wiki-article-facts" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary>{label}</summary>
      {children}
    </details>
  );
}
