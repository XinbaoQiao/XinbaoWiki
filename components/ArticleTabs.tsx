'use client';

import { usePathname } from 'next/navigation';

const GITHUB_BASE = 'https://github.com/XinbaoQiao/XinbaoWiki';

function activeSlug(pathname: string) {
  const decoded = decodeURIComponent(pathname);
  const parts = decoded.replace(/\/+$/, '').split('/').filter(Boolean);
  const wikiIndex = parts.lastIndexOf('wiki');
  return wikiIndex >= 0 && parts[wikiIndex + 1] ? parts[wikiIndex + 1] : 'Xinbao_Qiao';
}

export function ArticleTabs() {
  const pathname = usePathname() || '';
  if (!decodeURIComponent(pathname).split('/').includes('wiki')) return null;

  const slug = activeSlug(pathname);
  const fileName = `${slug}.md`;
  const talk = `${GITHUB_BASE}/issues/new?title=${encodeURIComponent(`Talk: ${slug}`)}`;
  const source = `${GITHUB_BASE}/edit/main/wiki/${encodeURIComponent(fileName)}`;
  const history = `${GITHUB_BASE}/commits/main/wiki/${encodeURIComponent(fileName)}`;

  return (
    <nav className="wiki-tabs" aria-label="Article tools">
      <div className="wiki-tabs-inner">
        <a href="#" className="active">Article</a>
        <a
          className="external"
          href={talk}
          target="_blank"
          rel="noreferrer"
          title="Open a GitHub issue to discuss this page"
        >
          Talk
        </a>
        <a
          className="external"
          href={source}
          target="_blank"
          rel="noreferrer"
          title="Edit this page on GitHub"
        >
          View source
        </a>
        <a
          className="external"
          href={history}
          target="_blank"
          rel="noreferrer"
          title="View this page's commit history on GitHub"
        >
          History
        </a>
      </div>
    </nav>
  );
}
