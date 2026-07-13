'use client';

import { useState } from 'react';
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

const newsLabels = {
  en: {
    count: '6 updates',
    eyebrow: 'Latest updates',
    title: 'News from Xinbaopedia'
  },
  zh: {
    count: '6 条动态',
    eyebrow: '最新消息',
    title: 'Xinbaopedia 最新动态'
  }
} satisfies Record<SearchLanguage, { count: string; eyebrow: string; title: string }>;

const newsEntries: Record<SearchLanguage, NewsEntry[]> = {
  en: [
    {
      date: '2026',
      detail: 'Work on selection bias and model collapse was accepted to ICML 2026.',
      href: '/wiki/When_Sample_Selection_Bias_Precipitates_Model_Collapse/',
      title: 'ICML 2026 paper accepted'
    },
    {
      date: '2026',
      detail: 'Soft-weighted unlearning for fairness and robustness was accepted to AAAI 2026.',
      href: '/wiki/Soft_Weighted_Machine_Unlearning/',
      title: 'AAAI 2026 paper accepted'
    },
    {
      date: '2026',
      detail: 'Started doctoral study in Information Engineering at The Chinese University of Hong Kong.',
      href: '/wiki/The_Chinese_University_of_Hong_Kong/',
      title: 'Joined CUHK as a PhD student'
    },
    {
      date: '2025',
      detail: 'Two machine-unlearning papers appeared at ICLR 2025.',
      href: '/wiki/Publications/',
      title: 'Two papers at ICLR 2025'
    },
    {
      date: '2025–2026',
      detail: 'Code is publicly available for accepted work on certified unlearning, soft-weighted unlearning, and model collapse.',
      href: '/wiki/CV/',
      title: 'Research code released'
    },
    {
      date: '2026',
      detail: 'Serving as a reviewer for ICML, NeurIPS, and AAAI.',
      href: '/wiki/CV/',
      title: 'Academic service'
    }
  ],
  zh: [
    {
      date: '2026',
      detail: '关于样本选择偏差与模型坍缩的工作被 ICML 2026 录用。',
      href: '/wiki/When_Sample_Selection_Bias_Precipitates_Model_Collapse_zh/',
      title: 'ICML 2026 论文录用'
    },
    {
      date: '2026',
      detail: '面向公平性与鲁棒性的软加权机器遗忘工作被 AAAI 2026 录用。',
      href: '/wiki/Soft_Weighted_Machine_Unlearning_zh/',
      title: 'AAAI 2026 论文录用'
    },
    {
      date: '2026',
      detail: '开始在香港中文大学信息工程学系攻读博士学位。',
      href: '/wiki/The_Chinese_University_of_Hong_Kong_zh/',
      title: '加入香港中文大学攻读博士'
    },
    {
      date: '2025',
      detail: '两篇机器遗忘论文发表于 ICLR 2025。',
      href: '/wiki/Publications_zh/',
      title: '两篇论文入选 ICLR 2025'
    },
    {
      date: '2025–2026',
      detail: '认证遗忘、软加权遗忘和模型坍缩等已录用工作均已公开代码。',
      href: '/wiki/CV_zh/',
      title: '研究代码公开'
    },
    {
      date: '2026',
      detail: '担任 ICML、NeurIPS 和 AAAI 审稿人。',
      href: '/wiki/CV_zh/',
      title: '学术服务'
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
          className="wiki-portal-news"
          id="portal-news"
          open={newsOpen}
        >
          <summary
            onClick={(event) => {
              event.preventDefault();
              setNewsOpen((open) => !open);
            }}
          >
            <span>
              <small>{newsLabels[language].eyebrow}</small>
              <strong>{newsLabels[language].title}</strong>
              <em>{newsLabels[language].count}</em>
            </span>
          </summary>
          <ol className="wiki-portal-news-list">
            {newsEntries[language].slice(0, 6).map((item) => (
              <li key={`${item.date}-${item.title}`}>
                <time>{item.date}</time>
                <div>
                  <a href={withBasePath(item.href)}>{item.title}</a>
                  <p>{item.detail}</p>
                </div>
              </li>
            ))}
          </ol>
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
