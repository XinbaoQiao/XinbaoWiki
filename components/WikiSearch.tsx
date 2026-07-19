'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChatWithXinbao } from '@/components/ChatWithXinbao';
import type { SearchIndexItem } from '@/lib/wiki';

type Props = {
  hideOnPortal?: boolean;
  language?: SearchLanguage;
  onLanguageChange?: (language: SearchLanguage) => void;
  showChat?: boolean;
  showLanguageSelect?: boolean;
  variant?: 'topbar' | 'portal';
};

export type SearchLanguage = 'en' | 'zh';
type SearchResult = SearchIndexItem & { score: number };
type PreparedSearchItem = SearchIndexItem & {
  normalizedAliases: string[];
  normalizedSummary: string;
  normalizedText: string;
  normalizedTitle: string;
};

const searchCopy = {
  en: {
    empty: 'No matching pages',
    loading: 'Loading search index...',
    unavailable: 'Search is temporarily unavailable',
    inputAria: 'Search Xinbaopedia',
    languageAria: 'Search language',
    placeholder: 'Search Xinbaopedia',
    submit: 'Search'
  },
  zh: {
    empty: '没有匹配页面',
    loading: '正在加载搜索索引……',
    unavailable: '搜索暂时不可用',
    inputAria: '搜索 Xinbaopedia',
    languageAria: '搜索语言',
    placeholder: '搜索 Xinbaopedia',
    submit: '搜索'
  }
};

let searchIndexPromise: Promise<SearchIndexItem[]> | null = null;

function searchIndexEndpoint() {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');
  return `${basePath}/search-index.json`;
}

function fetchSearchIndex() {
  searchIndexPromise ??= fetch(searchIndexEndpoint(), { cache: 'force-cache' })
    .then(async (response) => {
      if (!response.ok) throw new Error(`Search index request failed with ${response.status}`);
      const payload = await response.json() as unknown;
      if (!Array.isArray(payload)) throw new Error('Search index response is not an array');
      return payload as SearchIndexItem[];
    })
    .catch((error) => {
      searchIndexPromise = null;
      throw error;
    });
  return searchIndexPromise;
}

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

export function WikiSearch({
  hideOnPortal = false,
  language,
  onLanguageChange,
  showChat = true,
  showLanguageSelect = false,
  variant = 'topbar'
}: Props) {
  const pathname = usePathname();
  const generatedId = useId();
  const comboboxId = `${generatedId}-combobox`;
  const listboxId = `${generatedId}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [items, setItems] = useState<SearchIndexItem[]>([]);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  const preferredLanguage: SearchLanguage = pathname?.includes('_zh') || pathname?.includes('/Qiao_Xinbao_zh/') ? 'zh' : 'en';
  const [selectedLanguage, setSelectedLanguage] = useState<SearchLanguage>(preferredLanguage);
  const activeLanguage = showLanguageSelect ? (language ?? selectedLanguage) : preferredLanguage;
  const preparedItems = useMemo(() => items.map(prepareItem), [items]);
  const languageItems = useMemo(
    () => preparedItems.filter((item) => item.language === activeLanguage),
    [activeLanguage, preparedItems]
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
  const showResults = open && Boolean(normalizedQuery);
  const activeResult = showResults && results.length ? results[active] : undefined;
  const activeOptionId = activeResult ? `${generatedId}-option-${activeResult.slug}` : undefined;

  const loadItems = useCallback(async () => {
    if (loadState === 'loading' || loadState === 'ready') return;
    setLoadState('loading');
    try {
      setItems(await fetchSearchIndex());
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }, [loadState]);

  useEffect(() => {
    setActive(0);
  }, [normalizedQuery]);

  useEffect(() => {
    if (active >= results.length) setActive(Math.max(0, results.length - 1));
  }, [active, results.length]);

  useEffect(() => {
    if (language === undefined) setSelectedLanguage(preferredLanguage);
  }, [language, preferredLanguage]);

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
  const copy = searchCopy[activeLanguage];

  const rootClassName = [
    'wiki-search',
    `wiki-search-${variant}`,
    showChat ? '' : 'wiki-search-no-chat'
  ].filter(Boolean).join(' ');

  return (
    <div className={rootClassName} role="search" ref={rootRef}>
      {showChat && <ChatWithXinbao language={activeLanguage} />}
      <form
        className="wiki-search-form"
        onSubmit={(event) => {
          event.preventDefault();
          goTo(results[active] || results[0]);
        }}
      >
        <div className="wiki-search-fields">
          <input
            aria-activedescendant={activeOptionId}
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={showResults}
            aria-label={copy.inputAria}
            autoComplete="off"
            id={comboboxId}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
              void loadItems();
            }}
            onFocus={() => {
              setOpen(true);
              void loadItems();
            }}
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
              if (event.key === 'Enter' && results.length) {
                event.preventDefault();
                goTo(results[active] || results[0]);
              }
            }}
            placeholder={copy.placeholder}
            role="combobox"
            type="search"
            value={query}
          />
          {showLanguageSelect && (
            <select
              aria-label={copy.languageAria}
              className="wiki-search-language-select"
              onChange={(event) => {
                const nextLanguage = event.target.value === 'zh' ? 'zh' : 'en';
                setSelectedLanguage(nextLanguage);
                onLanguageChange?.(nextLanguage);
                setOpen(false);
              }}
              value={activeLanguage}
            >
              <option value="en">English</option>
              <option value="zh">中文</option>
            </select>
          )}
          <button className="wiki-search-submit" type="submit">{copy.submit}</button>
        </div>
      </form>
      {showResults && (
        <div aria-label={copy.inputAria} className="wiki-search-panel" id={listboxId} role="listbox">
          {loadState === 'loading' ? (
            <div className="wiki-search-empty" role="status">{copy.loading}</div>
          ) : loadState === 'error' ? (
            <div className="wiki-search-empty" role="status">{copy.unavailable}</div>
          ) : results.length ? (
            results.map((item, index) => (
              <a
                aria-selected={index === active}
                className="wiki-search-result"
                href={item.href}
                id={`${generatedId}-option-${item.slug}`}
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
            <div className="wiki-search-empty">{copy.empty}</div>
          )}
        </div>
      )}
    </div>
  );
}
