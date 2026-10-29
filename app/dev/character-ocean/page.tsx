"use client";

import { useEffect } from 'react';

/**
 * Local visual check for the full-bleed character ocean recreation.
 * Forces ASCII ocean on. No mode-select chrome — style is the sensible default.
 */
export default function CharacterOceanPreviewPage() {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.siteCharacterOcean = 'ascii';
    root.dataset.siteBgCompose = 'ocean';
    try {
      window.localStorage.setItem(
        'xinbaopedia-character-ocean',
        JSON.stringify({ style: 'ascii' })
      );
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div
      className="wiki-prose character-ocean-preview-copy"
      style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: 640,
        margin: '48px auto',
        padding: '24px',
        pointerEvents: 'auto',
      }}
    >
      <h1>Character ocean preview</h1>
      <p>
        Full-viewport recreation for XinbaoWiki (original engine; UX aligned with{' '}
        <a
          className="external"
          href="https://github.com/jiezi1234/character-ocean"
          target="_blank"
          rel="noreferrer"
        >
          jiezi1234/character-ocean
        </a>
        ). Default style is ASCII. Switch site language for en/zh glyph alphabets.
      </p>
      <p>
        Desktop: dense glyph field, pointer ripples. Mobile (~390px): larger cells, lower FPS,
        touch ripples; scroll/intro still works on the home portal.
      </p>
    </div>
  );
}
