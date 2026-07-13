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

function withBasePath(pathname: string) {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');
  return basePath ? `${basePath}${pathname}` : pathname;
}

export function HomepagePortal({ directorySections, languageEntries, searchIndex }: Props) {
  const [language, setLanguage] = useState<SearchLanguage>('en');
  const [browseOpen, setBrowseOpen] = useState(false);
  const collapsibleSections = { browse: browseOpen };
  const allSectionsClosed = Object.values(collapsibleSections).every((open) => !open);
  const expandAllSections = () => {
    setBrowseOpen(true);
  };
  const collapseAllSections = () => {
    setBrowseOpen(false);
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
                aria-controls="portal-directory"
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
    </article>
  );
}
