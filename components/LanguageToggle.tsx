'use client';

import { usePathname } from 'next/navigation';

function withBasePath(pathname: string) {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');
  return basePath ? `${basePath}${pathname}` : pathname;
}

function activeSlug(pathname: string) {
  const decoded = decodeURIComponent(pathname);
  const parts = decoded.replace(/\/+$/, '').split('/').filter(Boolean);
  const wikiIndex = parts.lastIndexOf('wiki');
  return wikiIndex >= 0 && parts[wikiIndex + 1] ? parts[wikiIndex + 1] : 'Xinbao_Qiao';
}

function isChineseSlug(slug: string) {
  return slug === 'Qiao_Xinbao_zh' || slug.endsWith('_zh');
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

export function LanguageToggle() {
  const pathname = usePathname() || '';
  if (!decodeURIComponent(pathname).split('/').includes('wiki')) return null;

  const slug = activeSlug(pathname);
  const isChinesePage = isChineseSlug(slug);
  const targetSlug = isChinesePage ? englishSlug(slug) : chineseSlug(slug);
  const href = `/wiki/${encodeURIComponent(targetSlug)}/`;

  return (
    <a className="lang-toggle" href={withBasePath(href)}>
      {isChinesePage ? 'English' : '中文'}
    </a>
  );
}
