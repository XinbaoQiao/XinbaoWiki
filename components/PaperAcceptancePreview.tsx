'use client';

import { useEffect, useId, useState, type CSSProperties } from 'react';
import { WikiLink } from '@/components/WikiLink';
import { PublicationLinkIcon, publicationLinkTitle } from '@/components/PublicationLinkLegend';
import { PaperImageLightbox, type ExpandedPaperImage } from '@/components/PaperImageLightbox';
import type { PaperHighlightCatalog, PaperHighlightImage } from '@/lib/paper-highlights';
import type { AcceptedPaper } from '@/lib/site-updates';
import type { SiteLanguage } from '@/lib/site-navigation';
import styles from './PaperAcceptancePreview.module.css';
import { useAnimatedDisclosure } from '@/components/useAnimatedDisclosure';

function withBasePath(pathname: string) {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');
  return `${basePath}${pathname}`;
}

/** Prefer a 720w gallery sibling for wide WebP assets (same stem + `-720.webp`). */
function gallerySrcSet(imagePath: string, width: number): string | undefined {
  if (!/\.webp$/i.test(imagePath) || width <= 720) return undefined;
  const preview = imagePath.replace(/\.webp$/i, '-720.webp');
  return `${withBasePath(preview)} 720w, ${withBasePath(imagePath)} ${width}w`;
}

export function PaperAcceptancePreview({ papers, language, defaultOpen = false, view = 'compact', highlights, visible = true }: {
  papers: readonly AcceptedPaper[];
  language: SiteLanguage;
  defaultOpen?: boolean;
  view?: 'compact' | 'detailed';
  highlights?: PaperHighlightCatalog;
  visible?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const disclosure = useAnimatedDisclosure(open, setOpen);
  const [retainContent, setRetainContent] = useState(visible && defaultOpen);
  useEffect(() => {
    if (visible && open) { setRetainContent(true); return; }
    // Keep the outgoing content through the parent's 240 ms collapse animation.
    const timer = window.setTimeout(() => setRetainContent(false), 260);
    return () => window.clearTimeout(timer);
  }, [visible, open]);
  const [activePaper, setActivePaper] = useState(0);
  const [expandedImage, setExpandedImage] = useState<ExpandedPaperImage | null>(null);
  const galleryId = useId();
  const detailed = view === 'detailed';
  const copy = language === 'zh'
    ? { summary: '查看 Camera-Ready 首页', details: '查看论文与概览', gallery: '论文首页，从左到右排列', showcase: '论文首页、配图与概览', page: 'Camera-Ready 首页', previous: '上一篇论文', next: '下一篇论文', navigation: '切换录用论文', figure: '放大查看', close: '关闭图片', links: '链接：' }
    : { summary: 'View Camera-Ready first pages', details: 'View paper and overview', gallery: 'Paper first pages, ordered left to right', showcase: 'Paper first pages, figures and summaries', page: 'Camera-Ready first page', previous: 'Previous paper', next: 'Next paper', navigation: 'Accepted paper navigation', figure: 'Enlarge image', close: 'Close image', links: 'Links:' };

  function showImage(image: PaperHighlightImage, title: string) {
    setExpandedImage({ ...image, image: withBasePath(image.image), title });
  }

  function imageButton(image: PaperHighlightImage, paper: AcceptedPaper, className: string, kind: string, options?: { priority?: boolean; sizes?: string }) {
    const sizes = options?.sizes ?? (detailed ? '360px' : '(max-width: 720px) 45vw, 260px');
    const srcSet = gallerySrcSet(image.image, image.width);
    return <button className={className} type="button" aria-label={`${copy.figure}: ${image.image_alt}`} data-paper-image={kind} onClick={() => showImage(image, paper.title)}>
      <img
        src={withBasePath(image.image)}
        srcSet={srcSet}
        sizes={sizes}
        width={image.width}
        height={image.height}
        alt={image.image_alt}
        loading={options?.priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={options?.priority ? 'high' : 'low'}
      />
    </button>;
  }

  return (
    <details ref={disclosure.ref} className={styles.disclosure} data-animated-disclosure="" data-paper-acceptance="" data-preview-view={view} open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary onMouseDown={(event) => { event.preventDefault(); }} onClick={(event) => { event.preventDefault(); if (event.detail === 0) { (event.currentTarget as HTMLElement).focus({ preventScroll: true }); } disclosure.toggle(); }}>{detailed ? copy.details : copy.summary} <span>({papers.length})</span></summary>
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
          const resources = highlight ? [{ label: 'PDF', url: paper.pdf }, ...highlight.resources]
            .filter((resource, index, links) => links.findIndex(link => link.url === resource.url) === index) : [];
          const isActive = !detailed || activePaper === index;
          const prioritize = Boolean(((visible && open) || retainContent) && isActive && index === (detailed ? activePaper : 0));
          return (
            <figure className={styles.paper} key={paper.slug} data-paper-slug={paper.slug} hidden={detailed && activePaper !== index} style={{ '--paper-page-scale': paper.height / paper.width } as CSSProperties}>
              {((visible && open) || retainContent) && isActive && <>
              {imageButton({ image: paper.image, width: paper.width, height: paper.height, image_alt: `${paper.title} — ${copy.page}` }, paper, styles.imageLink, 'first-page', { priority: prioritize, sizes: detailed ? '360px' : '(max-width: 720px) 45vw, 260px' })}
              {detailed && highlight && <div className={styles.highlight} data-paper-highlight="">
                <h3 className={styles.paperTitle} data-paper-title=""><WikiLink href={withBasePath(`/wiki/${slug}/`)} titleMorphSlug={slug} titleMorphDestTitle={paper.title}>{paper.title}</WikiLink></h3>
                <p className={styles.tldr}><strong>TL;DR</strong><span>{highlight.tldr}</span></p>
                <div className={styles.mediaSlot}><div className={styles.media}>
                {imageButton(highlight.poster ?? highlight, paper, styles.leadingImage, highlight.poster ? 'poster' : 'framework', { sizes: '(max-width: 720px) 90vw, 550px' })}
                <div className={styles.supportingImages} data-paper-supporting-images="">
                  {highlight.figures.map((image) => <div key={image.image}>{imageButton(image, paper, styles.supportingImage, 'supporting', { sizes: '(max-width: 720px) 42vw, 260px' })}</div>)}
                </div>
                </div></div>
                <div className={styles.resources} data-paper-resources="">
                  <span>{copy.links}</span>
                  {resources.map((resource) => <a className="publication-resource-link" key={resource.url} href={resource.url} target="_blank" rel="noopener noreferrer" title={publicationLinkTitle(resource.url, language)}>
                    {publicationLinkTitle(resource.url, language) ? <PublicationLinkIcon href={resource.url} /> : <svg className="publication-resource-icon" aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" data-link-icon={resource.label === 'PDF' ? 'pdf' : 'link'}><path fill="none" stroke="currentColor" strokeWidth="1.8" d={resource.label === 'PDF' ? 'M6 2h8l4 4v16H6z M14 2v5h5 M9 12h6 M9 16h6' : 'M10 13a4 4 0 0 0 6 0l4-4a4 4 0 0 0-6-6l-2 2 M14 11a4 4 0 0 0-6 0l-4 4a4 4 0 0 0 6 6l2-2'} /></svg>}
                    {resource.label === 'Code' ? (language === 'zh' ? '代码（GitHub）' : 'GitHub') : resource.label}
                  </a>)}
                </div>
              </div>}
              {!detailed && <figcaption>
                <WikiLink href={withBasePath(`/wiki/${slug}/`)} titleMorphSlug={slug} titleMorphDestTitle={paper.title}>{paper.title}</WikiLink>
                <span>{copy.page} · <a href={paper.pdf} target="_blank" rel="noopener noreferrer">PDF ↗</a></span>
              </figcaption>}
              </>}
            </figure>
          );
        })}
      </div>
      <PaperImageLightbox image={expandedImage} closeLabel={copy.close} onClose={() => setExpandedImage(null)} />
    </details>
  );
}
