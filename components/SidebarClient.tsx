'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { LocalizedText, SiteLanguage } from '@/lib/site-navigation';

export type SidebarNavItem = {
  slug: string;
  localizedSlug: Record<SiteLanguage, string>;
  href: Record<SiteLanguage, string>;
  label: LocalizedText;
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
  contribute: { en: 'Contribute', zh: '链接' },
  email: { en: 'Email the author', zh: '发送邮件' },
  feed: { en: 'Latest updates', zh: '最新动态' },
  openNavigation: { en: 'Open navigation', zh: '打开导航' },
  closeNavigation: { en: 'Close navigation', zh: '关闭导航' }
} satisfies Record<string, LocalizedText>;

function withBasePath(pathname: string) {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');
  return basePath && pathname.startsWith('/') ? basePath + pathname : pathname;
}

function isChineseSlug(slug: string) {
  return slug === 'Qiao_Xinbao_zh' || slug.endsWith('_zh');
}

function activeSlug(pathname: string) {
  const decoded = decodeURIComponent(pathname);
  const parts = decoded.replace(/\/+$/, '').split('/').filter(Boolean);
  const wikiIndex = parts.lastIndexOf('wiki');
  if (wikiIndex >= 0 && parts[wikiIndex + 1]) return parts[wikiIndex + 1];
  return parts.at(-1) === 'updates' ? 'Updates' : 'Xinbao_Qiao';
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

  return (
    <div className="wiki-sidebar-content">
      {sections.map((section) => (
        <div key={section.key}>
          <h4>{section.label[language]}</h4>
          <ul>
            {section.links.map((item) => (
              <li key={item.slug}>
                <a aria-current={currentPage(item)} href={withBasePath(item.href[language])} onClick={onNavigate}>
                  {item.label[language]}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <h4>{sectionLabels.contribute[language]}</h4>
      <ul>
        <li>
          <a
            className="external"
            href="https://www.linkedin.com/in/xinbaoqiao/"
            onClick={onNavigate}
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn
          </a>
        </li>
        <li><a href="mailto:xinbaoqiao@cuhk.edu.hk" onClick={onNavigate}>{sectionLabels.email[language]}</a></li>
        <li><a href={withBasePath('/updates/')} onClick={onNavigate}>{sectionLabels.feed[language]}</a></li>
      </ul>
    </div>
  );
}

export function SidebarClient({ sections }: Props) {
  const pathname = usePathname() || '';
  const currentSlug = activeSlug(pathname);
  const language: SidebarLanguage = isChineseSlug(currentSlug) ? 'zh' : 'en';
  const [mobileOpen, setMobileOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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
        {sectionLabels.navigation[language]}
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
        <SidebarSections currentSlug={currentSlug} language={language} onNavigate={() => setMobileOpen(false)} sections={sections} />
      </dialog>
    </>
  );
}
