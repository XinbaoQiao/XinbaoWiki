'use client';

import { useId, useState } from 'react';
import { WikiLink } from '@/components/WikiLink';
import type { PaperHighlightCatalog } from '@/lib/paper-highlights';
import type { AcceptedPaper } from '@/lib/site-updates';
import type { SiteLanguage } from '@/lib/site-navigation';
import styles from './PaperAcceptancePreview.module.css';

function withBasePath(pathname: string) {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');
  return `${basePath}${pathname}`;
}

export function PaperAcceptancePreview({ papers, language, defaultOpen = false, view = 'compact', highlights }: {
  papers: readonly AcceptedPaper[];
  language: SiteLanguage;
  defaultOpen?: boolean;
  view?: 'compact' | 'detailed';
  highlights?: PaperHighlightCatalog;
}) {
  const [activePaper, setActivePaper] = useState(0);
  const galleryId = useId();
  const detailed = view === 'detailed';
  const copy = language === 'zh'
    ? { summary: '查看 Camera-Ready 首页', details: '查看论文与简介', gallery: '论文首页，从左到右排列', showcase: '论文首页、配图与简介', open: '打开论文 PDF', page: 'Camera-Ready 首页', previous: '上一篇论文', next: '下一篇论文', navigation: '切换录用论文', figure: '查看论文配图原图' }
    : { summary: 'View Camera-Ready first pages', details: 'View paper and overview', gallery: 'Paper first pages, ordered left to right', showcase: 'Paper first pages, figures and summaries', open: 'Open paper PDF', page: 'Camera-Ready first page', previous: 'Previous paper', next: 'Next paper', navigation: 'Accepted paper navigation', figure: 'Open full-size paper figure' };

  return (
    <details className={styles.disclosure} data-paper-acceptance="" data-preview-view={view} open={defaultOpen}>
      <summary>{detailed ? copy.details : copy.summary} <span>({papers.length})</span></summary>
      {detailed && papers.length > 1 && <div className={styles.navigation} role="group" aria-label={copy.navigation}>
        <button type="button" aria-label={copy.previous} aria-controls={galleryId} disabled={activePaper === 0} onClick={() => setActivePaper((index) => index - 1)}>
          <span aria-hidden="true">‹</span>
        </button>
        <output aria-live="polite" aria-atomic="true">{activePaper + 1} / {papers.length}</output>
        <button type="button" aria-label={copy.next} aria-controls={galleryId} disabled={activePaper === papers.length - 1} onClick={() => setActivePaper((index) => index + 1)}>
          <span aria-hidden="true">›</span>
        </button>
      </div>}
      <div className={[styles.gallery, detailed ? styles.detailedGallery : ''].filter(Boolean).join(' ')} id={galleryId} role="region" aria-label={detailed ? copy.showcase : copy.gallery} tabIndex={0}>
        {papers.map((paper, index) => {
          const slug = language === 'zh' ? `${paper.slug}_zh` : paper.slug;
          const highlight = highlights?.[paper.slug]?.[language];
          return (
            <figure className={styles.paper} key={paper.slug} data-paper-slug={paper.slug} hidden={detailed && activePaper !== index}>
              <a className={styles.imageLink} href={paper.pdf} target="_blank" rel="noopener noreferrer" aria-label={`${copy.open}: ${paper.title}`}>
                <img
                  src={withBasePath(paper.image)}
                  width={paper.width}
                  height={paper.height}
                  alt={`${paper.title} — ${copy.page}`}
                  loading="lazy"
                  decoding="async"
                />
              </a>
              {detailed && highlight && <div className={styles.highlight} data-paper-highlight="">
                <p className={styles.tldr}><strong>TL;DR</strong><span>{highlight.tldr}</span></p>
                <a className={styles.teaserLink} href={withBasePath(highlight.image)} target="_blank" rel="noopener noreferrer" aria-label={`${copy.figure}: ${highlight.image_alt}`}>
                  <img className={styles.teaserImage} src={withBasePath(highlight.image)} width={highlight.width} height={highlight.height} alt={highlight.image_alt} loading="lazy" decoding="async" />
                </a>
                <p className={styles.teaserCaption}>{highlight.image_caption}</p>
              </div>}
              <figcaption>
                <WikiLink href={withBasePath(`/wiki/${slug}/`)} titleMorphSlug={slug} titleMorphDestTitle={paper.title}>{paper.title}</WikiLink>
                <span>{copy.page} · <a href={paper.pdf} target="_blank" rel="noopener noreferrer">PDF ↗</a></span>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </details>
  );
}
