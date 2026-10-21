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
import { ViewTransitions } from 'next-view-transitions';
import 'katex/dist/katex.min.css';
import './globals.css';

const sitePaletteIcons = {
  text: pathWithBasePath('/mywiki-icon.png'),
  blue: pathWithBasePath('/site-icons/mywiki-blue.png'),
  gold: pathWithBasePath('/site-icons/mywiki-gold.png'),
  rose: pathWithBasePath('/site-icons/mywiki-gold.png'),
  green: pathWithBasePath('/site-icons/mywiki-green.png'),
  violet: pathWithBasePath('/site-icons/mywiki-blue.png'),
  charcoal: pathWithBasePath('/site-icons/mywiki-charcoal.png')
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

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <ViewTransitions>
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Alex+Brush&display=swap"
            rel="stylesheet"
          />
        </head>
        <body>
          <SiteActivityRecorder />
          <a className="skip-to-content" href="#main-content">Skip to content / 跳至正文</a>
          <SitePalette icons={sitePaletteIcons} />
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
