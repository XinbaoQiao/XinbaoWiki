'use client';

import { useState } from 'react';
import type { WikiImageItem } from '@/lib/wiki';

type Props = {
  items: WikiImageItem[];
  language: 'en' | 'zh';
};

export function PortraitGallery({ items, language }: Props) {
  const [index, setIndex] = useState(0);
  const current = items[index];
  const previousLabel = language === 'zh' ? '上一张肖像' : 'Previous portrait';
  const nextLabel = language === 'zh' ? '下一张肖像' : 'Next portrait';
  const status = language === 'zh'
    ? `第 ${index + 1} 张，共 ${items.length} 张：${current.alt}`
    : `Image ${index + 1} of ${items.length}: ${current.alt}`;

  function move(offset: number) {
    setIndex((currentIndex) => (currentIndex + offset + items.length) % items.length);
  }

  return (
    <div className="wiki-infobox-image wiki-portrait-gallery">
      <div className="wiki-portrait-gallery-frame">
        <img
          src={current.src}
          alt={current.alt}
          style={{ objectFit: current.fit || 'cover', objectPosition: current.position || '50% 38%' }}
        />
        <button
          type="button"
          className="wiki-portrait-gallery-arrow wiki-portrait-gallery-arrow-previous"
          aria-label={previousLabel}
          onClick={() => move(-1)}
        >
          <span aria-hidden="true">‹</span>
        </button>
        <button
          type="button"
          className="wiki-portrait-gallery-arrow wiki-portrait-gallery-arrow-next"
          aria-label={nextLabel}
          onClick={() => move(1)}
        >
          <span aria-hidden="true">›</span>
        </button>
        <span className="wiki-portrait-gallery-count" aria-hidden="true">
          {index + 1} / {items.length}
        </span>
      </div>
      {current.caption && <div className="wiki-infobox-caption">{current.caption}</div>}
      <span className="sr-only" aria-live="polite">{status}</span>
    </div>
  );
}
