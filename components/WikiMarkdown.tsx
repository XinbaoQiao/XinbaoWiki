import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { pathWithBasePath } from '@/lib/wiki';

type Props = { markdown: string; sourceHref?: string };

function external(href: string) {
  return /^https?:\/\//.test(href) || href.startsWith('mailto:');
}

function editLink(sourceHref?: string) {
  if (!sourceHref) return null;
  return (
    <span className="edit-link">
      <a href={sourceHref} target="_blank" rel="noreferrer">edit</a>
    </span>
  );
}

export function WikiMarkdown({ markdown, sourceHref }: Props) {
  return (
    <div className="wiki-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a({ href, children }) {
            const safe = pathWithBasePath(href || '#');
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
          }
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
