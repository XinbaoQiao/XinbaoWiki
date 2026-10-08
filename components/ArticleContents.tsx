'use client';

import { Children, isValidElement, useEffect, useState, type ReactNode } from 'react';

export function ArticleContents({ children, label }: { children: ReactNode; label: string }) {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 720px)');
    const update = () => setCompact(mobile.matches);
    update();
    mobile.addEventListener('change', update);
    return () => mobile.removeEventListener('change', update);
  }, []);

  const links = Children.toArray(children).filter((child) => (
    !isValidElement<{ className?: string }>(child) || child.props.className !== 'wiki-contents-label'
  ));

  return (
    <nav className="wiki-article-contents" aria-label={label}>
      {compact ? (
        <details className="wiki-contents-mobile">
          <summary>{label}</summary>
          {links}
        </details>
      ) : children}
    </nav>
  );
}
