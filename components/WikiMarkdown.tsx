import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import { Fragment, type ReactNode } from 'react';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { ArticleContents } from '@/components/ArticleContents';
import { PublicationLinkLegend, publicationLinkLegendTexts, publicationLinkTitle } from '@/components/PublicationLinkLegend';
import { pathWithBasePath } from '@/lib/wiki';
import { rehypeWikiOutline } from '@/lib/wiki-outline';

type Props = { editLabel: string; markdown: string; sourceHref?: string };

function external(href: string) {
  return /^https?:\/\//.test(href) || href.startsWith('mailto:');
}

function wikiUrlTransform(value: string) {
  if (/^tel:/i.test(value)) return value;
  return defaultUrlTransform(value);
}

function editLink(sourceHref: string | undefined, label: string) {
  if (!sourceHref) return null;
  return (
    <span className="edit-link">
      <a href={sourceHref} target="_blank" rel="noreferrer">{label}</a>
    </span>
  );
}

function renderTableLineBreaks(children: ReactNode): ReactNode {
  if (typeof children === 'string') {
    const parts = children.split(/(<br\s*\/?>)/i);
    if (parts.length === 1) return children;
    return parts.map((part, index) => {
      if (/^<br\s*\/?>$/i.test(part)) return <br key={index} />;
      return <Fragment key={index}>{part}</Fragment>;
    });
  }
  if (Array.isArray(children)) {
    return children.map((child, index) => (
      <Fragment key={index}>{renderTableLineBreaks(child)}</Fragment>
    ));
  }
  return children;
}

export function WikiMarkdown({ editLabel, markdown, sourceHref }: Props) {
  const legendLanguage = markdown.includes(publicationLinkLegendTexts.zh) ? 'zh' : markdown.includes(publicationLinkLegendTexts.en) ? 'en' : undefined;
  return (
    <div className="wiki-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        remarkRehypeOptions={{ footnoteLabel: editLabel === '编辑' ? '脚注' : 'Footnotes' }}
        rehypePlugins={[[rehypeWikiOutline, { label: editLabel === '编辑' ? '目录' : 'Contents' }], rehypeKatex]}
        urlTransform={wikiUrlTransform}
        components={{
          nav({ children, className }) {
            if (className === 'wiki-article-contents') {
              return <ArticleContents label={editLabel === '编辑' ? '目录' : 'Contents'}>{children}</ArticleContents>;
            }
            return <nav className={className}>{children}</nav>;
          },
          a({ href, children, title }) {
            const safe = href ? pathWithBasePath(href) : '#';
            const missing = safe.includes('missing=1');
            const ext = external(safe);
            const iconTitle = legendLanguage ? publicationLinkTitle(safe, legendLanguage) : undefined;
            const className = [missing ? 'redlink' : '', ext ? 'external' : ''].filter(Boolean).join(' ') || undefined;
            return (
              <a
                href={safe}
                className={className}
                target={ext ? '_blank' : undefined}
                rel={ext ? 'noreferrer' : undefined}
                title={missing ? 'Page does not exist yet' : title ?? iconTitle}
                aria-label={iconTitle}
              >
                {children}
              </a>
            );
          },
          img({ src, alt }) {
            const safeSrc = typeof src === 'string' ? pathWithBasePath(src) : '';
            return <img src={safeSrc} alt={alt || ''} loading="lazy" />;
          },
          h2({ id, tabIndex, children }) {
            return <h2 id={id} tabIndex={tabIndex}>{children}{editLink(sourceHref, editLabel)}</h2>;
          },
          h3({ id, tabIndex, children }) {
            return <h3 id={id} tabIndex={tabIndex}>{children}{editLink(sourceHref, editLabel)}</h3>;
          },
          p({ children }) {
            if (children === publicationLinkLegendTexts.en) return <PublicationLinkLegend language="en" />;
            if (children === publicationLinkLegendTexts.zh) return <PublicationLinkLegend language="zh" />;
            const authorshipNote = children === '* Co-first authors.' || children === '* 共同第一作者。'
              || children === 'Asterisks (*) denote co-first authorship; daggers (†) denote corresponding authors.'
              || children === '星号（*）表示共同第一作者；剑号（†）表示通讯作者。';
            return <p className={authorshipNote ? 'publication-authorship-note' : undefined}>{children}</p>;
          },
          td({ children }) {
            return <td>{renderTableLineBreaks(children)}</td>;
          },
          strong({ children }) {
            return <strong className={children === 'Oral' ? 'publication-oral' : undefined}>{children}</strong>;
          }
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
