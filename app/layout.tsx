import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ArticleTabs } from '@/components/ArticleTabs';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Sidebar } from '@/components/Sidebar';
import { pathWithBasePath } from '@/lib/wiki';
import './globals.css';

export const metadata: Metadata = {
  title: 'Xinbaopedia',
  description: 'Personal academic wiki homepage for Qiao Xinbao / Xinbao Qiao.',
  icons: { icon: pathWithBasePath('/xinbaopedia-icon.svg') }
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="wiki-topbar">
          <div className="wiki-topbar-inner">
            <a
              className="wiki-logo"
              href={pathWithBasePath('/wiki/Xinbao_Qiao/')}
              style={{ textDecoration: 'none' }}
            >
              Xinbaopedia
            </a>
            <LanguageToggle />
            <form className="wiki-search" role="search">
              <input aria-label="Search Xinbaopedia" placeholder="Search Xinbaopedia" />
            </form>
          </div>
        </header>
        <ArticleTabs />
        <div className="wiki-shell">
          <Sidebar />
          <main className="wiki-main" id="main-content">{children}</main>
        </div>
        <footer className="wiki-footer">
          <p>This page is maintained as a personal academic wiki. Xinbaopedia is a stylistic tribute to Wikipedia and is not affiliated with the Wikimedia Foundation.</p>
          <p>
            <a className="external" href="mailto:xinbaoqiao@cuhk.edu.hk">Email</a>
            {' · '}
            <a className="external" href="https://github.com/XinbaoQiao" target="_blank" rel="noreferrer">GitHub</a>
          </p>
        </footer>
      </body>
    </html>
  );
}
