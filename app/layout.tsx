import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { pathWithBasePath } from '@/lib/wiki';
import './globals.css';

export const metadata: Metadata = { title: 'Qiao Xinbao | Academic Wiki', description: 'Personal academic wiki homepage for Qiao Xinbao / Xinbao Qiao.' };

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const source = 'https://github.com/XinbaoQiao/XinbaoWiki/tree/main/wiki';
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <Sidebar />
          <div className="workspace">
            <header className="topbar">
              <nav className="tabs" aria-label="Article tools">
                <a className="active" href={pathWithBasePath('/wiki/Xinbao_Qiao/')}>Article</a>
                <a href="mailto:xinbaoqiao@cuhk.edu.hk">Talk</a>
                <a href={source} target="_blank" rel="noreferrer">View source</a>
                <a href={pathWithBasePath('/wiki/log/')}>History</a>
              </nav>
              <nav className="quicknav" aria-label="Quick links">
                <a href={pathWithBasePath('/wiki/Research/')}>Research</a>
                <a href={pathWithBasePath('/wiki/Publications/')}>Publications</a>
                <a href={pathWithBasePath('/wiki/CV/')}>CV</a>
                <a href={pathWithBasePath('/wiki/index/')}>Index</a>
              </nav>
            </header>
            <main className="page-frame">{children}</main>
            <footer className="site-footer">
              Text is maintained as a personal academic wiki and is not affiliated with the Wikimedia Foundation.
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
