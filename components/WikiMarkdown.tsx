import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import { Fragment, type ReactNode } from 'react';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { pathWithBasePath } from '@/lib/wiki';

type Props = { markdown: string; sourceHref?: string };

function external(href: string) {
  return /^https?:\/\//.test(href) || href.startsWith('mailto:');
}

function wikiUrlTransform(value: string) {
  if (/^tel:/i.test(value)) return value;
  return defaultUrlTransform(value);
}

function editLink(sourceHref?: string) {
  if (!sourceHref) return null;
  return (
    <span className="edit-link">
      <a href={sourceHref} target="_blank" rel="noreferrer">edit</a>
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

export function WikiMarkdown({ markdown, sourceHref }: Props) {
  return (
    <div className="wiki-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        urlTransform={wikiUrlTransform}
        components={{
          a({ href, children }) {
            const safe = href ? pathWithBasePath(href) : '#';
            const missing = safe.includes('missing=1');
            const ext = external(safe);
            const className = [missing ? 'redlink' : '', ext ? 'external' : ''].filter(Boolean).join(' ') || undefined;
            return (
              <a
                href={safe}
                className={className}
                target={ext ? '_blank' : undefined}
                rel={ext ? 'noreferrer' : undefined}
                title={missing ? 'Page does not exist yet' : undefined}
              >
                {children}
              </a>
            );
          },
          img({ src, alt }) {
            const safeSrc = typeof src === 'string' ? pathWithBasePath(src) : '';
            return <img src={safeSrc} alt={alt || ''} loading="lazy" />;
          },
          h2({ children }) {
            return <h2>{children}{editLink(sourceHref)}</h2>;
          },
          h3({ children }) {
            return <h3>{children}{editLink(sourceHref)}</h3>;
          },
          td({ children }) {
            return <td>{renderTableLineBreaks(children)}</td>;
          }
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
