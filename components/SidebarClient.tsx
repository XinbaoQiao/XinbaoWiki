'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { WikiLink } from '@/components/WikiLink';
import { usePathname } from 'next/navigation';
import type { LocalizedText, SiteLanguage } from '@/lib/site-navigation';

export type SidebarNavItem = {
  slug: string;
  localizedSlug: Record<SiteLanguage, string>;
  href: Record<SiteLanguage, string>;
  label: LocalizedText;
  pageTitle: LocalizedText;
};

export type SidebarNavSection = {
  key: string;
  label: LocalizedText;
  links: SidebarNavItem[];
};

type SidebarLanguage = SiteLanguage;

type Props = {
  sections: SidebarNavSection[];
};

const sectionLabels = {
  navigation: { en: 'Navigation', zh: '导航' },
  updates: { en: 'Updates', zh: '更新' },
  feed: { en: 'Latest updates', zh: '最新动态' },
  openNavigation: { en: 'Open navigation', zh: '打开导航' },
  closeNavigation: { en: 'Close navigation', zh: '关闭导航' }
} satisfies Record<string, LocalizedText>;

function withBasePath(pathname: string) {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');
  return basePath && pathname.startsWith('/') ? basePath + pathname : pathname;
}

function isChineseSlug(slug: string) {
  return slug === 'Your_Name_zh' || slug.endsWith('_zh');
}

function activeSlug(pathname: string) {
  const decoded = decodeURIComponent(pathname);
  const parts = decoded.replace(/\/+$/, '').split('/').filter(Boolean);
  const wikiIndex = parts.lastIndexOf('wiki');
  if (wikiIndex >= 0 && parts[wikiIndex + 1]) return parts[wikiIndex + 1];
  return parts.at(-1) === 'updates' ? 'Updates' : 'Your_Name';
}

function SidebarSections({
  currentSlug,
  language,
  onNavigate,
  sections
}: {
  currentSlug: string;
  language: SidebarLanguage;
  onNavigate?: () => void;
  sections: SidebarNavSection[];
}) {
  const currentPage = (item: SidebarNavItem) => item.localizedSlug[language] === currentSlug ? 'page' : undefined;
  const rootRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef<HTMLAnchorElement | null>(null);
  const previousRef = useRef<{ y: number; height: number } | null>(null);
  const align = useCallback((motion: boolean, target?: HTMLAnchorElement | null) => {
    const root = rootRef.current;
    const link = target ?? pendingRef.current ?? root?.querySelector<HTMLAnchorElement>('a[aria-current="page"]');
    if (!root || !link || !link.getClientRects().length) {
      if (root) delete root.dataset.markerReady;
      previousRef.current = null;
      return;
    }
    const box = link.getBoundingClientRect();
    const next = { y: box.top - root.getBoundingClientRect().top + root.scrollTop, height: box.height };
    const previous = previousRef.current;
    if (previous?.y === next.y && previous.height === next.height) return;
    root.style.setProperty('--sidebar-marker-duration', motion && previous ? '320ms' : '0ms');
    root.style.setProperty('--sidebar-marker-y', `${next.y}px`);
    root.style.setProperty('--sidebar-marker-height', `${next.height}px`);
    root.dataset.markerReady = '';
    previousRef.current = next;
  }, []);
  useLayoutEffect(() => { pendingRef.current = null; align(true); }, [currentSlug, language, align]);
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new ResizeObserver(() => align(false));
    observer.observe(root);
    root.querySelectorAll('a').forEach(link => observer.observe(link));
    return () => observer.disconnect();
  }, [align]);

  return (
    <div className="wiki-sidebar-content" ref={rootRef} onClickCapture={(event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a');
      if (!link || !event.currentTarget.contains(link)) return;
      pendingRef.current = link;
      align(true, link);
    }}>
      <span className="wiki-sidebar-current-marker" aria-hidden="true" />
      {sections.map((section) => (
        <div key={section.key}>
          <h4>{section.label[language]}</h4>
          <ul>
            {section.links.map((item) => (
              <li key={item.slug}>
                <WikiLink
                  aria-current={currentPage(item)}
                  href={withBasePath(item.href[language])}
                  onClick={onNavigate}
                  titleMorphSlug={item.localizedSlug[language]}
                  titleMorphDestTitle={item.pageTitle[language]}
                >
                  {item.label[language]}
                </WikiLink>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <h4>{sectionLabels.updates[language]}</h4>
      <ul>
        <li><WikiLink href={withBasePath('/updates/')} aria-current={currentSlug === 'Updates' ? 'page' : undefined} onClick={onNavigate} titleMorphSlug="Updates">{sectionLabels.feed[language]}</WikiLink></li>
      </ul>
    </div>
  );
}

export function SidebarClient({ sections }: Props) {
  const pathname = usePathname() || '';
  const currentSlug = activeSlug(pathname);
  const language: SidebarLanguage = isChineseSlug(currentSlug) ? 'zh' : 'en';
  const [mobileOpen, setMobileOpen] = useState(false);
  // Defer mounting mobile nav links until first open — halves [data-wiki-title-vt]
  // chips that prepareWikiTitleMorph / clearWikiTitleMorphPeers walk on every click.
  const [mobileNavMounted, setMobileNavMounted] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) setMobileNavMounted(true);
  }, [mobileOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (mobileOpen && !dialog.open) dialog.showModal();
    if (!mobileOpen && dialog.open) dialog.close();
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  return (
    <>
      <aside className="wiki-sidebar wiki-sidebar-desktop" aria-label={sectionLabels.navigation[language]}>
        <SidebarSections currentSlug={currentSlug} language={language} sections={sections} />
      </aside>

      <button
        aria-controls="wiki-mobile-navigation"
        aria-expanded={mobileOpen}
        aria-label={sectionLabels.openNavigation[language]}
        className="wiki-mobile-nav-toggle"
        onClick={() => setMobileOpen(true)}
        type="button"
      >
        <span aria-hidden="true">☰</span>
        <span className="wiki-mobile-nav-label">{sectionLabels.navigation[language]}</span>
      </button>

      <dialog
        aria-labelledby="wiki-mobile-navigation-title"
        className="wiki-mobile-nav-dialog"
        id="wiki-mobile-navigation"
        onCancel={() => setMobileOpen(false)}
        onClose={() => setMobileOpen(false)}
        ref={dialogRef}
      >
        <header className="wiki-mobile-nav-header">
          <strong id="wiki-mobile-navigation-title">{sectionLabels.navigation[language]}</strong>
          <button
            aria-label={sectionLabels.closeNavigation[language]}
            autoFocus
            onClick={() => setMobileOpen(false)}
            type="button"
          >
            ×
          </button>
        </header>
        {mobileNavMounted ? (
          <SidebarSections currentSlug={currentSlug} language={language} onNavigate={() => setMobileOpen(false)} sections={sections} />
        ) : null}
      </dialog>
    </>
  );
}
