'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

const navigation = ['Xinbao_Qiao', 'Publications'];
const researchTopics = ['AI_and_Networks', 'Machine_Unlearning', 'Synthetic_Data_and_Model_Collapse', 'Data_Centric_Machine_Learning'];
const experience = ['NUSRI_CQ'];
const education = ['The_Chinese_University_of_Hong_Kong', 'Zhejiang_University', 'Shandong_University'];

type SidebarLanguage = 'en' | 'zh';
type LocalizedText = Record<SidebarLanguage, string>;

const sectionLabels = {
  navigation: { en: 'Navigation', zh: '导航' },
  researchTopics: { en: 'Research topics', zh: '研究主题' },
  education: { en: 'Education', zh: '教育经历' },
  experience: { en: 'Experience', zh: '研究经历' },
  contribute: { en: 'Contribute', zh: '链接' },
  email: { en: 'Email the author', zh: '发送邮件' },
  openNavigation: { en: 'Open navigation', zh: '打开导航' },
  closeNavigation: { en: 'Close navigation', zh: '关闭导航' }
} satisfies Record<string, LocalizedText>;

const navLabels: Record<string, LocalizedText> = {
  Xinbao_Qiao: { en: 'Main page', zh: '主页' },
  Publications: { en: 'Publications', zh: '论文' },
  AI_and_Networks: { en: 'AI and Networks', zh: 'AI 与网络' },
  Machine_Unlearning: { en: 'Machine Unlearning', zh: '机器遗忘' },
  Synthetic_Data_and_Model_Collapse: { en: 'Synthetic Data', zh: '合成数据' },
  Data_Centric_Machine_Learning: { en: 'Data Centric ML', zh: '数据中心 ML' },
  The_Chinese_University_of_Hong_Kong: { en: 'CUHK', zh: '香港中文大学' },
  NUSRI_CQ: { en: 'NUSRI-CQ', zh: 'NUSRI-CQ' },
  Zhejiang_University: { en: 'ZJU', zh: '浙江大学' },
  Shandong_University: { en: 'SDU', zh: '山东大学' }
};

function withBasePath(pathname: string) {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');
  return basePath ? `${basePath}${pathname}` : pathname;
}

function isChineseSlug(slug: string) {
  return slug === 'Qiao_Xinbao_zh' || slug.endsWith('_zh');
}

function activeSlug(pathname: string) {
  const decoded = decodeURIComponent(pathname);
  const parts = decoded.replace(/\/+$/, '').split('/').filter(Boolean);
  const wikiIndex = parts.lastIndexOf('wiki');
  return wikiIndex >= 0 && parts[wikiIndex + 1] ? parts[wikiIndex + 1] : 'Xinbao_Qiao';
}

function chineseSlug(slug: string) {
  if (slug === 'Xinbao_Qiao') return 'Qiao_Xinbao_zh';
  if (isChineseSlug(slug)) return slug;
  return `${slug}_zh`;
}

function englishSlug(slug: string) {
  if (slug === 'Qiao_Xinbao_zh') return 'Xinbao_Qiao';
  return slug.endsWith('_zh') ? slug.slice(0, -3) : slug;
}

function localizedSlug(slug: string, language: SidebarLanguage) {
  return language === 'zh' ? chineseSlug(slug) : englishSlug(slug);
}

function wikiHref(slug: string, language: SidebarLanguage) {
  return withBasePath(`/wiki/${encodeURIComponent(localizedSlug(slug, language))}/`);
}

function label(slug: string, language: SidebarLanguage) {
  if (navLabels[slug]) return navLabels[slug][language];
  return slug.replaceAll('_', ' ');
}

function SidebarSections({ language, onNavigate }: { language: SidebarLanguage; onNavigate?: () => void }) {
  return (
    <div className="wiki-sidebar-content">
      <h4>{sectionLabels.navigation[language]}</h4>
      <ul>
        {navigation.map((item) => (
          <li key={item}><a href={wikiHref(item, language)} onClick={onNavigate}>{label(item, language)}</a></li>
        ))}
      </ul>

      <h4>{sectionLabels.researchTopics[language]}</h4>
      <ul>
        {researchTopics.map((item) => (
          <li key={item}><a href={wikiHref(item, language)} onClick={onNavigate}>{label(item, language)}</a></li>
        ))}
      </ul>

      <h4>{sectionLabels.education[language]}</h4>
      <ul>
        {education.map((item) => (
          <li key={item}><a href={wikiHref(item, language)} onClick={onNavigate}>{label(item, language)}</a></li>
        ))}
      </ul>

      <h4>{sectionLabels.experience[language]}</h4>
      <ul>
        {experience.map((item) => (
          <li key={item}><a href={wikiHref(item, language)} onClick={onNavigate}>{label(item, language)}</a></li>
        ))}
      </ul>

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
      </ul>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname() || '';
  const language: SidebarLanguage = isChineseSlug(activeSlug(pathname)) ? 'zh' : 'en';
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
        <SidebarSections language={language} />
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
        <SidebarSections language={language} onNavigate={() => setMobileOpen(false)} />
      </dialog>
    </>
  );
}
