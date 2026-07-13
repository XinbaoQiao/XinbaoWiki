import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ArticleTabs } from '@/components/ArticleTabs';
import { LanguageToggle, SitePalette } from '@/components/LanguageToggle';
import { Sidebar } from '@/components/Sidebar';
import { WikiSearch } from '@/components/WikiSearch';
import { pathWithBasePath } from '@/lib/wiki';
import 'katex/dist/katex.min.css';
import './globals.css';

const sitePaletteIcons = {
  text: pathWithBasePath('/xinbaopedia-icon.png'),
  blue: pathWithBasePath('/site-icons/xinbaopedia-blue.png'),
  gold: pathWithBasePath('/site-icons/xinbaopedia-gold.png'),
  green: pathWithBasePath('/site-icons/xinbaopedia-green.png'),
  charcoal: pathWithBasePath('/site-icons/xinbaopedia-charcoal.png')
};

export const metadata: Metadata = {
  metadataBase: new URL('https://xinbaopedia.top'),
  title: {
    default: 'Xinbaopedia',
    template: '%s | Xinbaopedia'
  },
  description: 'Personal academic wiki homepage for Qiao Xinbao / Xinbao Qiao.',
  alternates: { canonical: '/' },
  icons: { icon: sitePaletteIcons.blue },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Xinbaopedia',
    title: 'Xinbaopedia',
    description: 'Personal academic wiki homepage for Qiao Xinbao / Xinbao Qiao.'
  },
  twitter: {
    card: 'summary',
    title: 'Xinbaopedia',
    description: 'Personal academic wiki homepage for Qiao Xinbao / Xinbao Qiao.'
  }
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SitePalette icons={sitePaletteIcons} />
        <header className="wiki-topbar">
          <div className="wiki-topbar-inner">
            <a
              className="wiki-logo"
              href={pathWithBasePath('/')}
            >
              <span className="wiki-logo-word">Xinbaopedia</span>
              <span className="wiki-logo-subtitle">The Academic Wiki</span>
            </a>
            <LanguageToggle />
            <WikiSearch hideOnPortal />
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
