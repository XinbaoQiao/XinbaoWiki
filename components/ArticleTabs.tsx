'use client';

import { usePathname } from 'next/navigation';

const GITHUB_BASE = 'https://github.com/XinbaoQiao/XinbaoWiki';
const labels = {
  en: {
    aria: 'Article tools',
    article: 'Article',
    talk: 'Talk',
    talkTitle: 'Open a GitHub issue to discuss this page',
    source: 'View source',
    sourceTitle: 'View the source repository on GitHub',
    history: 'History',
    historyTitle: "View this page's commit history"
  },
  zh: {
    aria: '条目工具',
    article: '条目',
    talk: '讨论',
    talkTitle: '在 GitHub 上讨论此页面',
    source: '查看源代码',
    sourceTitle: '在 GitHub 上查看源码仓库',
    history: '历史',
    historyTitle: '查看此页面的提交历史'
  }
};

function activeSlug(pathname: string) {
  const decoded = decodeURIComponent(pathname);
  const parts = decoded.replace(/\/+$/, '').split('/').filter(Boolean);
  const wikiIndex = parts.lastIndexOf('wiki');
  return wikiIndex >= 0 && parts[wikiIndex + 1] ? parts[wikiIndex + 1] : 'Xinbao_Qiao';
}

function isChineseSlug(slug: string) {
  return slug === 'Qiao_Xinbao_zh' || slug.endsWith('_zh');
}

export function ArticleTabs() {
  const pathname = usePathname() || '';
  if (!decodeURIComponent(pathname).split('/').includes('wiki')) return null;

  const slug = activeSlug(pathname);
  const language = isChineseSlug(slug) ? 'zh' : 'en';
  const copy = labels[language];
  const fileName = `${slug}.md`;
  const talk = `${GITHUB_BASE}/issues/new?title=${encodeURIComponent(`Talk: ${slug}`)}`;
  const source = GITHUB_BASE;
  const history = `${GITHUB_BASE}/commits/main/wiki/${encodeURIComponent(fileName)}`;

  return (
    <nav className="wiki-tabs" aria-label={copy.aria}>
      <div className="wiki-tabs-inner">
        <div className="wiki-tabs-content">
          <div className="wiki-tabs-primary">
            <a href="#" className="active">{copy.article}</a>
            <a
              className="external"
              href={talk}
              target="_blank"
              rel="noreferrer"
              title={copy.talkTitle}
            >
              {copy.talk}
            </a>
          </div>
          <div className="wiki-tabs-actions">
            <a
              className="external"
              href={source}
              target="_blank"
              rel="noreferrer"
              title={copy.sourceTitle}
            >
              {copy.source}
            </a>
            <a
              className="external"
              href={history}
              target="_blank"
              rel="noreferrer"
              title={copy.historyTitle}
            >
              {copy.history}
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
