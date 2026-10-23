import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { ArticleTabs } from '@/components/ArticleTabs';
import { LanguageToggle, SitePalette } from '@/components/LanguageToggle';
import { Sidebar } from '@/components/Sidebar';
import { WikiSearch } from '@/components/WikiSearch';
import { SiteActivityRecorder } from '@/components/SiteActivityRecorder';
import { WikiLink } from '@/components/WikiLink';
import { pathWithBasePath } from '@/lib/wiki';
import { siteConfig } from '@/lib/site-config';
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
  text: pathWithBasePath('/mywiki-icon.webp'),
  blue: pathWithBasePath('/site-icons/mywiki-blue.webp'),
  gold: pathWithBasePath('/site-icons/mywiki-gold.webp'),
  rose: pathWithBasePath('/site-icons/mywiki-gold.webp'),
  green: pathWithBasePath('/site-icons/mywiki-green.webp'),
  violet: pathWithBasePath('/site-icons/mywiki-blue.webp'),
  charcoal: pathWithBasePath('/site-icons/mywiki-charcoal.webp')
};

const siteDescription = siteConfig.description;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://example.com'),
  title: {
    default: 'MyWiki',
    template: '%s | MyWiki'
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
    siteName: 'MyWiki',
    title: 'MyWiki',
    description: siteDescription
  },
  twitter: {
    card: 'summary',
    title: 'MyWiki',
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
                <span className="wiki-logo-word">MyWiki</span>
                <span className="wiki-logo-subtitle">{siteConfig.subtitle}</span>
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
            <p>This page is maintained as a personal academic wiki. MyWiki is a stylistic tribute to Wikipedia and is not affiliated with the Wikimedia Foundation.</p>
            <p>
              {siteConfig.footerLinks.map((link, index) => (
                <span key={link.href}>
                  {index > 0 ? ' · ' : null}
                  <a className="external" href={link.href} {...(link.href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}>{link.label}</a>
                </span>
              ))}
            </p>
          </footer>
        </body>
      </html>
    </ViewTransitions>
  );
}
