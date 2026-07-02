'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChatWithXinbao } from '@/components/ChatWithXinbao';
import type { SearchIndexItem } from '@/lib/wiki';

type Props = {
  items: SearchIndexItem[];
  hideOnPortal?: boolean;
  showChat?: boolean;
  variant?: 'topbar' | 'portal';
};

type SearchResult = SearchIndexItem & { score: number };
type PreparedSearchItem = SearchIndexItem & {
  normalizedAliases: string[];
  normalizedSummary: string;
  normalizedText: string;
  normalizedTitle: string;
};

function normalize(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function queryTerms(query: string) {
  return normalize(query)
    .split(/[\s,.;:!?()[\]{}"'，。；：！？（）【】「」]+/)
    .filter(Boolean);
}

function prepareItem(item: SearchIndexItem): PreparedSearchItem {
  return {
    ...item,
    normalizedAliases: item.aliases.map(normalize),
    normalizedSummary: normalize(item.summary),
    normalizedText: normalize(item.text),
    normalizedTitle: normalize(item.title)
  };
}

function scoreItem(item: PreparedSearchItem, normalizedQuery: string, terms: string[]) {
  if (!normalizedQuery) return 0;

  let score = 0;
  if (item.normalizedTitle === normalizedQuery) score += 180;
  else if (item.normalizedTitle.startsWith(normalizedQuery)) score += 140;
  else if (item.normalizedTitle.includes(normalizedQuery)) score += 95;

  if (item.normalizedAliases.some((alias) => alias === normalizedQuery)) score += 150;
  else if (item.normalizedAliases.some((alias) => alias.includes(normalizedQuery))) score += 85;

  if (item.normalizedSummary.includes(normalizedQuery)) score += 45;
  if (item.normalizedText.includes(normalizedQuery)) score += 25;

  for (const term of terms) {
    if (item.normalizedTitle.includes(term)) score += 26;
    else if (item.normalizedAliases.some((alias) => alias.includes(term))) score += 22;
    else if (item.normalizedSummary.includes(term)) score += 12;
    else if (item.normalizedText.includes(term)) score += 6;
  }

  if (score > 0 && item.slug === 'Xinbao_Qiao') score += 5;
  if (score > 0 && item.slug === 'Qiao_Xinbao_zh') score += 5;
  return score;
}

function resultExcerpt(item: SearchIndexItem, terms: string[]) {
  if (item.summary) return item.summary;
  const text = item.text.replace(/\s+/g, ' ').trim();
  const normalizedText = normalize(text);
  const firstHit = terms.map((term) => normalizedText.indexOf(term)).filter((index) => index >= 0).sort((a, b) => a - b)[0] ?? 0;
  const start = Math.max(0, firstHit - 42);
  const excerpt = text.slice(start, start + 150).trim();
  return start > 0 ? `... ${excerpt}` : excerpt;
}

function isPortalPath(pathname: string | null) {
  return !decodeURIComponent(pathname || '').split('/').includes('wiki');
}

export function WikiSearch({ items, hideOnPortal = false, showChat = true, variant = 'topbar' }: Props) {
  const pathname = usePathname();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const preferredLanguage = pathname?.includes('_zh') || pathname?.includes('/Qiao_Xinbao_zh/') ? 'zh' : 'en';
  const preparedItems = useMemo(() => items.map(prepareItem), [items]);
  const languageItems = useMemo(
    () => preparedItems.filter((item) => item.language === preferredLanguage),
    [preparedItems, preferredLanguage]
  );
  const normalizedQuery = normalize(query);
  const terms = useMemo(() => queryTerms(query), [query]);
  const results = useMemo<SearchResult[]>(() => {
    if (!normalizedQuery) return [];
    return languageItems
      .map((item) => ({ ...item, score: scoreItem(item, normalizedQuery, terms) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
      .slice(0, 8);
  }, [languageItems, normalizedQuery, terms]);

  useEffect(() => {
    setActive(0);
  }, [normalizedQuery]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  function goTo(item: SearchIndexItem | undefined) {
    if (!item) return;
    window.location.assign(item.href);
  }

  if (hideOnPortal && isPortalPath(pathname)) return null;

  const rootClassName = [
    'wiki-search',
    `wiki-search-${variant}`,
    showChat ? '' : 'wiki-search-no-chat'
  ].filter(Boolean).join(' ');

  return (
    <div className={rootClassName} role="search" ref={rootRef}>
      {showChat && <ChatWithXinbao language={preferredLanguage} />}
      <form
        className="wiki-search-form"
        onSubmit={(event) => {
          event.preventDefault();
          goTo(results[active] || results[0]);
        }}
      >
        <div className="wiki-search-fields">
          <input
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={open && normalizedQuery ? 'true' : 'false'}
            aria-label="Search Xinbaopedia"
            autoComplete="off"
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setOpen(false);
                return;
              }
              if (!results.length) return;
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setOpen(true);
                setActive((index) => (index + 1) % results.length);
              }
              if (event.key === 'ArrowUp') {
                event.preventDefault();
                setOpen(true);
                setActive((index) => (index - 1 + results.length) % results.length);
              }
            }}
            placeholder="Search Xinbaopedia"
            type="search"
            value={query}
          />
          <button className="wiki-search-submit" type="submit">Search</button>
        </div>
      </form>
      {open && normalizedQuery && (
        <div className="wiki-search-panel" id={listboxId} role="listbox">
          {results.length ? (
            results.map((item, index) => (
              <a
                aria-selected={index === active}
                className="wiki-search-result"
                href={item.href}
                key={item.slug}
                onMouseEnter={() => setActive(index)}
                role="option"
              >
                <span className="wiki-search-result-title">{item.title}</span>
                <span className="wiki-search-result-meta">
                  <span>{item.language === 'zh' ? '中文' : 'English'}</span>
                  <span>{item.type}</span>
                </span>
                <span className="wiki-search-result-excerpt">{resultExcerpt(item, terms)}</span>
              </a>
            ))
          ) : (
            <div className="wiki-search-empty">No matching pages</div>
          )}
        </div>
      )}
    </div>
  );
}
