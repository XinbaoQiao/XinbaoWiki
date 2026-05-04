import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Sidebar } from '@/components/Sidebar';
import { pathWithBasePath } from '@/lib/wiki';
import './globals.css';

export const metadata: Metadata = { title: 'Qiao Xinbao | Academic Wiki', description: 'Personal academic wiki homepage for Qiao Xinbao / Xinbao Qiao.' };

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const source = 'https://github.com/XinbaoQiao/XinbaoWiki/tree/main/wiki';
  const talk = 'https://github.com/XinbaoQiao/XinbaoWiki/issues/new';
  const history = 'https://github.com/XinbaoQiao/XinbaoWiki/commits/main/';
  return (
    <html lang="en">
      <body>
        <header className="wiki-topbar">
          <div className="wiki-topbar-inner">
            <a className="wiki-logo" href={pathWithBasePath('/')}>
              Xinbaopedia
              <span>academic wiki</span>
            </a>
            <LanguageToggle />
            <form className="wiki-search" role="search">
              <input aria-label="Search Xinbaopedia" placeholder="Search Xinbaopedia" />
            </form>
          </div>
        </header>
        <nav className="wiki-tabs" aria-label="Article tools">
          <div className="wiki-tabs-inner">
            <a className="active" href={pathWithBasePath('/wiki/Xinbao_Qiao/')}>Article</a>
            <a className="external" href={talk} target="_blank" rel="noreferrer">Talk</a>
            <a className="external" href={source} target="_blank" rel="noreferrer">View source</a>
            <a className="external" href={history} target="_blank" rel="noreferrer">History</a>
          </div>
        </nav>
        <div className="wiki-shell">
          <Sidebar />
          <main className="wiki-main">{children}</main>
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
