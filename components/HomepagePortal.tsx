'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { WikiSearch, type SearchLanguage } from '@/components/WikiSearch';
import type { SearchIndexItem } from '@/lib/wiki';

type LocalizedText = Record<SearchLanguage, string>;
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
type NewsEntry = {
  date: string;
  dateTime: string;
  detail: string;
  href: string;
  title: string;
};

type Props = {
  directorySections: PortalSection[];
  languageEntries: LanguageEntry[];
  searchIndex: SearchIndexItem[];
};

const browseLabels: LocalizedText = {
  en: 'Browse Xinbaopedia',
  zh: '浏览 Xinbaopedia'
};

const entriesLabel: LocalizedText = {
  en: 'Primary academic entries',
  zh: '主要学术条目'
};

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

const updateEntries: Record<SearchLanguage, NewsEntry[]> = {
  en: [
    {
      date: 'Apr 2026',
      dateTime: '2026-04',
      detail: '“When Sample Selection Bias Precipitates Model Collapse”.',
      href: '/wiki/When_Sample_Selection_Bias_Precipitates_Model_Collapse/',
      title: 'ICML 2026 paper accepted'
    },
    {
      date: 'Dec 2025',
      dateTime: '2025-12',
      detail: 'M.Eng. in Artificial Intelligence, Zhejiang University.',
      href: '/wiki/Zhejiang_University/',
      title: 'Completed master’s degree'
    },
    {
      date: 'Nov 2025',
      dateTime: '2025-11',
      detail: '“Beyond Binary Erasure: Soft-Weighted Unlearning for Fairness and Robustness”.',
      href: '/wiki/Soft_Weighted_Machine_Unlearning/',
      title: 'AAAI 2026 paper accepted'
    },
    {
      date: 'Jun 2025',
      dateTime: '2025-06',
      detail: 'Six-month full-time research internship on trustworthy LLMs at NUSRI-CQ.',
      href: '/wiki/NUSRI_CQ/',
      title: 'Started full-time research internship'
    },
    {
      date: 'Jan 2025',
      dateTime: '2025-01',
      detail: '“Hessian-Free Online Certified Unlearning” and “DynFrs”.',
      href: '/wiki/Publications/',
      title: 'Two ICLR 2025 papers accepted'
    },
    {
      date: 'Sep 2022',
      dateTime: '2022-09',
      detail: 'M.Eng. in Artificial Intelligence, Zhejiang University.',
      href: '/wiki/Education/',
      title: 'Started master’s degree'
    },
    {
      date: 'Jul 2022',
      dateTime: '2022-07',
      detail: 'B.Eng. in Communication Engineering, Shandong University.',
      href: '/wiki/Shandong_University/',
      title: 'Completed bachelor’s degree'
    }
  ],
  zh: [
    {
      date: '2026年4月',
      dateTime: '2026-04',
      detail: '《When Sample Selection Bias Precipitates Model Collapse》。',
      href: '/wiki/When_Sample_Selection_Bias_Precipitates_Model_Collapse_zh/',
      title: 'ICML 2026 论文录用'
    },
    {
      date: '2025年12月',
      dateTime: '2025-12',
      detail: '浙江大学人工智能工学硕士。',
      href: '/wiki/Zhejiang_University_zh/',
      title: '完成硕士学位'
    },
    {
      date: '2025年11月',
      dateTime: '2025-11',
      detail: '《Beyond Binary Erasure: Soft-Weighted Unlearning for Fairness and Robustness》。',
      href: '/wiki/Soft_Weighted_Machine_Unlearning_zh/',
      title: 'AAAI 2026 论文录用'
    },
    {
      date: '2025年6月',
      dateTime: '2025-06',
      detail: '在 NUSRI-CQ 开展为期六个月的可信大模型全职研究实习。',
      href: '/wiki/NUSRI_CQ_zh/',
      title: '开始全职研究实习'
    },
    {
      date: '2025年1月',
      dateTime: '2025-01',
      detail: '《Hessian-Free Online Certified Unlearning》和《DynFrs》。',
      href: '/wiki/Publications_zh/',
      title: '两篇 ICLR 2025 论文录用'
    },
    {
      date: '2022年9月',
      dateTime: '2022-09',
      detail: '浙江大学人工智能工学硕士阶段。',
      href: '/wiki/Education_zh/',
      title: '开始硕士阶段'
    },
    {
      date: '2022年7月',
      dateTime: '2022-07',
      detail: '山东大学通信工程工学学士。',
      href: '/wiki/Shandong_University_zh/',
      title: '完成本科学位'
    }
  ]
};

function withBasePath(pathname: string) {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');
  return basePath ? `${basePath}${pathname}` : pathname;
}

export function HomepagePortal({ directorySections, languageEntries, searchIndex }: Props) {
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
  const latestUpdate = updateEntries[language][0];

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
            <h1 className="wiki-portal-name" id="portal-title">
              <button
                type="button"
                aria-controls="portal-news portal-directory"
                aria-expanded={!allSectionsClosed}
                aria-label={allSectionsClosed ? 'Expand homepage sections' : 'Collapse homepage sections'}
                className="wiki-portal-name-button"
                onClick={toggleAllSections}
                onDoubleClick={collapseAllSections}
              >
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
                </span>
                <span className="wiki-portal-name-text">Xinbao Qiao</span>
              </button>
            </h1>
          </div>
        </div>
        <div className="wiki-portal-search">
          <WikiSearch
            items={searchIndex}
            language={language}
            onLanguageChange={setLanguage}
            showLanguageSelect
            variant="portal"
          />
        </div>
        <nav className="wiki-portal-editions" aria-label={entriesLabel[language]}>
          {languageEntries.map((item) => (
            <a className="wiki-portal-edition" href={item.href} key={item.href}>
              <strong>{item.label}</strong>
              <span>{item.detail}</span>
            </a>
          ))}
        </nav>
      </section>

      <div className="wiki-portal-disclosures">
        <details
          className="wiki-portal-news wiki-portal-timeline"
          id="portal-news"
          open={newsOpen}
        >
          <summary
            onClick={(event) => {
              event.preventDefault();
              setNewsOpen((open) => !open);
            }}
          >
            <span className="wiki-portal-timeline-heading">
              <strong>{updateLabels[language].title}</strong>
              <em>{updateEntries[language].length} {language === 'zh' ? '条动态' : 'updates'}</em>
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
              {updateEntries[language].map((item) => (
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
          open={browseOpen}
        >
          <summary
            onClick={(event) => {
              event.preventDefault();
              setBrowseOpen((open) => !open);
            }}
          >
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
