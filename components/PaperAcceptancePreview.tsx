import { WikiLink } from '@/components/WikiLink';
import type { AcceptedPaper } from '@/lib/site-updates';
import type { SiteLanguage } from '@/lib/site-navigation';
import styles from './PaperAcceptancePreview.module.css';

function withBasePath(pathname: string) {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');
  return `${basePath}${pathname}`;
}

export function PaperAcceptancePreview({ papers, language, defaultOpen = false }: {
  papers: readonly AcceptedPaper[];
  language: SiteLanguage;
  defaultOpen?: boolean;
}) {
  const copy = language === 'zh'
    ? { summary: '查看 Camera-Ready 首页', gallery: '论文首页，从左到右排列', open: '打开论文 PDF', page: 'Camera-Ready 首页' }
    : { summary: 'View Camera-Ready first pages', gallery: 'Paper first pages, ordered left to right', open: 'Open paper PDF', page: 'Camera-Ready first page' };

  return (
    <details className={styles.disclosure} data-paper-acceptance="" open={defaultOpen}>
      <summary>{copy.summary} <span>({papers.length})</span></summary>
      <div className={styles.gallery} role="region" aria-label={copy.gallery} tabIndex={0}>
        {papers.map((paper) => {
          const slug = language === 'zh' ? `${paper.slug}_zh` : paper.slug;
          return (
            <figure className={styles.paper} key={paper.slug} data-paper-slug={paper.slug}>
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
