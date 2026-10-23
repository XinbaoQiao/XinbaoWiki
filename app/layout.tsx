import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { ArticleTabs } from '@/components/ArticleTabs';
import { LanguageToggle, SitePalette } from '@/components/LanguageToggle';
import { Sidebar } from '@/components/Sidebar';
import { WikiSearch } from '@/components/WikiSearch';
import { SiteActivityRecorder } from '@/components/SiteActivityRecorder';
import { WikiLink } from '@/components/WikiLink';
import { pathWithBasePath } from '@/lib/wiki';
import {
  type SharedSiteBackgroundPublic
} from '@/lib/site-wallpaper-shared';
import {
  readSharedSiteBackground,
  siteBackgroundBlobConfigured,
  siteBackgroundLocalFallbackEnabled,
  siteBackgroundPasswordRequired,
  siteBackgroundSharedConfigured,
  siteBackgroundWritableConfigured
} from '@/lib/site-wallpaper-store';
import { ViewTransitions } from 'next-view-transitions';
import './globals.css';

const sitePaletteIcons = {
  text: pathWithBasePath('/xinbaopedia-icon.webp'),
  blue: pathWithBasePath('/site-icons/xinbaopedia-blue.webp'),
  gold: pathWithBasePath('/site-icons/xinbaopedia-gold.webp'),
  rose: pathWithBasePath('/site-icons/xinbaopedia-gold.webp'),
  green: pathWithBasePath('/site-icons/xinbaopedia-green.webp'),
  violet: pathWithBasePath('/site-icons/xinbaopedia-blue.webp'),
  charcoal: pathWithBasePath('/site-icons/xinbaopedia-charcoal.webp')
};

const siteDescription = "Explore Xinbao Qiao's research, publications, and academic journey through a connected bilingual wiki.";

export const metadata: Metadata = {
  metadataBase: new URL('https://xinbaopedia.top'),
  title: {
    default: 'Xinbaopedia',
    template: '%s | Xinbaopedia'
  },
  description: siteDescription,
  alternates: {
    canonical: '/',
    types: {
      'application/atom+xml': '/feed.xml'
    }
  },
  icons: { icon: sitePaletteIcons.blue },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Xinbaopedia',
    title: 'Xinbaopedia',
    description: siteDescription
  },
  twitter: {
    card: 'summary',
    title: 'Xinbaopedia',
    description: siteDescription
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content'
};

async function loadInitialSharedBackground(): Promise<SharedSiteBackgroundPublic | null> {
  try {
    const shared = await readSharedSiteBackground();
    return {
      ...shared,
      shared: siteBackgroundSharedConfigured(),
      writable: siteBackgroundWritableConfigured(),
      blob: siteBackgroundBlobConfigured(),
      localFallback: siteBackgroundLocalFallbackEnabled(),
      passwordRequired: siteBackgroundPasswordRequired()
    };
  } catch {
    return null;
  }
}

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const initialSharedBackground = await loadInitialSharedBackground();
  // Visitors default to mixed/auto palette. Shared wallpaper stays available for opt-in.
  const sharedDataset = { 'data-site-custom-bg': 'off' } as Record<string, string>;

  return (
    <ViewTransitions>
      <html lang="en" {...sharedDataset}>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            rel="preload"
            as="style"
            href="https://fonts.googleapis.com/css2?family=Alex+Brush&display=optional"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Alex+Brush&display=optional"
            rel="stylesheet"
            media="print"
            data-alex-brush-font=""
          />
          <script
            dangerouslySetInnerHTML={{
              __html:
                '(function(){var l=document.querySelector("link[data-alex-brush-font]");if(!l)return;var r=function(){l.media="all"};if(l.sheet)r();else l.addEventListener("load",r);})();'
            }}
          />

        </head>
        <body>

          <SiteActivityRecorder />
          <a className="skip-to-content" href="#main-content">Skip to content / 跳到正文</a>
          <SitePalette icons={sitePaletteIcons} initialSharedBackground={initialSharedBackground} />
          <header className="wiki-topbar">
            <div className="wiki-topbar-inner">
              <WikiLink className="wiki-logo" href={pathWithBasePath('/')}>
                <span className="wiki-logo-word">Xinbaopedia</span>
                <span className="wiki-logo-subtitle">The Academic Wiki</span>
              </WikiLink>
              <div className="wiki-topbar-controls">
                <WikiSearch hideOnPortal />
                <LanguageToggle />
              </div>
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
              <a className="external" href="mailto:xinbaoqiao@link.cuhk.edu.hk">Email</a>
              {' · '}
              <a className="external" href="https://github.com/XinbaoQiao" target="_blank" rel="noreferrer">GitHub</a>
            </p>
          </footer>
        </body>
      </html>
    </ViewTransitions>
  );
}
