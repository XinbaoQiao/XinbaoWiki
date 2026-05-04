import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { pathWithBasePath } from '@/lib/wiki';

type Props = { markdown: string };

function external(href: string) {
  return /^https?:\/\//.test(href) || href.startsWith('mailto:');
}

export function WikiMarkdown({ markdown }: Props) {
  return (
    <div className="wiki-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a({ href, children }) {
            const safe = pathWithBasePath(href || '#');
            const missing = safe.includes('missing=1');
            const ext = external(safe);
            return (
              <a
                href={safe}
                className={missing ? 'wiki-link missing' : 'wiki-link'}
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
          }
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
