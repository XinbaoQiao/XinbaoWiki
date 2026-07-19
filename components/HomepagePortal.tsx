'use client';

import type { CSSProperties } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { WikiSearch, type SearchLanguage } from '@/components/WikiSearch';
import { siteUpdates } from '@/lib/site-updates';

type LocalizedText = Record<SearchLanguage, string>;
type PortalPalette = 'text' | 'blue' | 'gold' | 'rose' | 'green' | 'violet' | 'charcoal';
type PortalEntry = { href: string; summary: string; title: string };
type PortalGroup = {
  label: LocalizedText;
  links: Record<SearchLanguage, PortalEntry[]>;
};
type PortalSection = {
  title: LocalizedText;
  groups: PortalGroup[];
};
type LanguageEntry = {
  detail: string;
  href: string;
  label: string;
};
type Props = {
  directorySections: PortalSection[];
  languageEntries: LanguageEntry[];
};

const browseLabels: LocalizedText = {
  en: 'Browse Xinbaopedia',
  zh: '浏览 Xinbaopedia'
};

const entriesLabel: LocalizedText = {
  en: 'Primary academic entries',
  zh: '主要学术条目'
};

const sectionToggleLabels = {
  en: {
    collapse: 'Collapse homepage sections',
    expand: 'Expand homepage sections'
  },
  zh: {
    collapse: '折叠首页板块',
    expand: '展开首页板块'
  }
} satisfies Record<SearchLanguage, { collapse: string; expand: string }>;

const portalPalettes: PortalPalette[] = ['text', 'blue', 'gold', 'rose', 'green', 'violet', 'charcoal'];

const portalTaglines = {
  text: {
    en: 'Q is a lens: search the world, question the model.',
    zh: '以 Q 为镜：探索世界，追问模型。'
  },
  blue: {
    en: 'To see farther, ask better questions.',
    zh: '想看得更远，先问得更好。'
  },
  gold: {
    en: 'Where curiosity meets evidence, discovery begins.',
    zh: '好奇与证据相遇，发现由此开始。'
  },
  rose: {
    en: 'Let the machine learn. Keep the question human.',
    zh: '让机器学习，让问题保有人性。'
  },
  green: {
    en: 'Learn from the world, not just the dataset.',
    zh: '向世界学习，而不只向数据集学习。'
  },
  violet: {
    en: "A model's limits are not the world's limits.",
    zh: '模型的边界，不是世界的边界。'
  },
  charcoal: {
    en: 'In models we question; in evidence we trust.',
    zh: '对模型保持追问，以证据建立信任。'
  }
} satisfies Record<PortalPalette, LocalizedText>;

const updateLabels = {
  en: {
    title: 'Latest Updates',
    window: 'Scrollable latest updates'
  },
  zh: {
    title: '最新动态',
    window: '可滚动的最新动态'
  }
} satisfies Record<SearchLanguage, { title: string; window: string }>;

function withBasePath(pathname: string) {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');
  return basePath ? `${basePath}${pathname}` : pathname;
}

export function HomepagePortal({ directorySections, languageEntries }: Props) {
  const [language, setLanguage] = useState<SearchLanguage>('en');
  const [browseOpen, setBrowseOpen] = useState(false);
  const [newsOpen, setNewsOpen] = useState(false);
  const updatesWindowRef = useRef<HTMLDivElement>(null);
  const collapsibleSections = { browse: browseOpen, news: newsOpen };
  const allSectionsClosed = Object.values(collapsibleSections).every((open) => !open);
  const expandAllSections = () => {
    setBrowseOpen(true);
    setNewsOpen(true);
  };
  const collapseAllSections = () => {
    setBrowseOpen(false);
    setNewsOpen(false);
  };
  const toggleAllSections = () => {
    if (allSectionsClosed) {
      expandAllSections();
      return;
    }
    collapseAllSections();
  };
  const portalClassName = ['wiki-portal', allSectionsClosed ? 'wiki-portal-collapsed' : ''].filter(Boolean).join(' ');
  const latestUpdate = siteUpdates[language][0];

  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  }, [language]);

  useLayoutEffect(() => {
    const viewport = updatesWindowRef.current;
    if (!viewport || !newsOpen) return;
    const list = viewport.querySelector('ol');
    if (!list) return;
    const visibleItems = Array.from(list.children).slice(0, 5) as HTMLElement[];
    if (!visibleItems.length) return;

    const measureWindow = () => {
      const lastItem = visibleItems.at(-1);
      if (!lastItem) return;
      const height = lastItem.getBoundingClientRect().bottom - list.getBoundingClientRect().top;
      viewport.style.setProperty('--portal-updates-window-height', `${Math.ceil(height)}px`);
    };

    viewport.scrollTop = 0;
    const resizeObserver = new ResizeObserver(measureWindow);
    visibleItems.forEach((item) => resizeObserver.observe(item));
    window.addEventListener('resize', measureWindow);
    measureWindow();
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', measureWindow);
    };
  }, [language, newsOpen]);

  return (
    <article className={portalClassName} data-page-slug="Xinbao_Qiao">
      <section className="wiki-portal-hero" aria-labelledby="portal-title">
        <div className="wiki-portal-masthead">
          <div className="wiki-portal-brand">
            <div className="wiki-portal-name-wrap">
              <h1 className="wiki-portal-name" id="portal-title">
                <span className="wiki-portal-name-logos" aria-hidden="true">
                  <img
                    alt=""
                    className="wiki-portal-name-logo wiki-portal-name-logo-blue"
                    decoding="async"
                    height={158}
                    src={withBasePath('/site-logos/wordmark/xinbao-qiao-blue.png')}
                    width={641}
                  />
                  <img
                    alt=""
                    className="wiki-portal-name-logo wiki-portal-name-logo-gold"
                    decoding="async"
                    height={158}
                    src={withBasePath('/site-logos/wordmark/xinbao-qiao-gold.png')}
                    width={641}
                  />
                  <img
                    alt=""
                    className="wiki-portal-name-logo wiki-portal-name-logo-green"
                    decoding="async"
                    height={158}
                    src={withBasePath('/site-logos/wordmark/xinbao-qiao-green.png')}
                    width={641}
                  />
                  <img
                    alt=""
                    className="wiki-portal-name-logo wiki-portal-name-logo-charcoal"
                    decoding="async"
                    height={158}
                    src={withBasePath('/site-logos/wordmark/xinbao-qiao-charcoal.png')}
                    width={641}
                  />
                  <span
                    className="wiki-portal-name-logo wiki-portal-name-logo-tinted"
                    style={{
                      '--portal-wordmark-mask': `url("${withBasePath('/site-logos/wordmark/xinbao-qiao-charcoal.png')}")`
                    } as CSSProperties}
                  />
                </span>
                <span className="wiki-portal-name-text">Xinbao Qiao</span>
              </h1>
              <button
                type="button"
                aria-controls="portal-news portal-directory"
                aria-expanded={!allSectionsClosed}
                aria-label={allSectionsClosed ? sectionToggleLabels[language].expand : sectionToggleLabels[language].collapse}
                className="wiki-portal-name-button"
                onClick={toggleAllSections}
              />
            </div>
          </div>
        </div>
        <p aria-atomic="true" aria-live="polite" className="wiki-portal-tagline">
          {portalPalettes.map((palette) => (
            <span className={`wiki-portal-tagline-copy wiki-portal-tagline-${palette}`} key={palette}>
              {portalTaglines[palette][language]}
            </span>
          ))}
        </p>
        <div className="wiki-portal-search">
          <WikiSearch
            language={language}
            onLanguageChange={setLanguage}
            showLanguageSelect
            variant="portal"
          />
          <nav className="wiki-portal-editions" aria-label={entriesLabel[language]}>
            {languageEntries.map((item) => (
              <a className="wiki-portal-edition" href={item.href} key={item.href}>
                <strong>{item.label}</strong>
                <span>{item.detail}</span>
              </a>
            ))}
          </nav>
        </div>
      </section>

      <div className="wiki-portal-disclosures">
        <details
          className="wiki-portal-news wiki-portal-timeline"
          id="portal-news"
          onToggle={(event) => setNewsOpen(event.currentTarget.open)}
          open={newsOpen}
        >
          <summary>
            <span className="wiki-portal-timeline-heading">
              <strong>{updateLabels[language].title}</strong>
              <em>{siteUpdates[language].length} {language === 'zh' ? '条动态' : 'updates'}</em>
            </span>
            <span className="wiki-portal-news-preview">
              <time dateTime={latestUpdate.dateTime}>{latestUpdate.date}</time>
              <span>
                <b>{latestUpdate.title}</b>
                <small>{latestUpdate.detail}</small>
              </span>
            </span>
          </summary>
          <div
            aria-label={updateLabels[language].window}
            className="wiki-portal-updates-window"
            ref={updatesWindowRef}
            role="region"
            tabIndex={0}
          >
            <ol className="wiki-portal-news-list">
              {siteUpdates[language].map((item) => (
                <li key={`${item.dateTime}-${item.title}`}>
                  <time dateTime={item.dateTime}>{item.date}</time>
                  <div>
                    <a href={withBasePath(item.href)}>{item.title}</a>
                    <p>{item.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </details>

        <details
          className="wiki-portal-directory"
          id="portal-directory"
          onToggle={(event) => setBrowseOpen(event.currentTarget.open)}
          open={browseOpen}
        >
          <summary>
            <span>{browseLabels[language]}</span>
          </summary>
          <div className="wiki-portal-grid">
            {directorySections.map((section) => {
              const sectionTitle = section.title[language];
              const sectionId = `portal-${section.title.en.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
              return (
                <section className="wiki-portal-block" aria-labelledby={sectionId} key={section.title.en}>
                  <h3 id={sectionId}>
                    <span>{sectionTitle}</span>
                  </h3>
                  {section.groups.map((group) => (
                    <div className="wiki-portal-group" key={group.label.en}>
                      <p className="wiki-portal-group-label">{group.label[language]}</p>
                      <ul>
                        {group.links[language].map((item) => (
                          <li key={item.href}>
                            <a href={item.href}>{item.title}</a>
                            {item.summary && <span>{item.summary}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </section>
              );
            })}
          </div>
        </details>
      </div>
    </article>
  );
}
