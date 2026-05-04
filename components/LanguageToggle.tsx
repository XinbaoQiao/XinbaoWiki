'use client';

import { usePathname } from 'next/navigation';

function withBasePath(pathname: string) {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');
  return basePath ? `${basePath}${pathname}` : pathname;
}

export function LanguageToggle() {
  const pathname = usePathname() || '';
  const isChinesePage = decodeURIComponent(pathname).includes('/wiki/Qiao_Xinbao_zh');
  const href = isChinesePage ? '/wiki/Xinbao_Qiao/' : '/wiki/Qiao_Xinbao_zh/';

  return (
    <a className="lang-toggle" href={withBasePath(href)}>
      {isChinesePage ? 'English' : '中文'}
    </a>
  );
}
