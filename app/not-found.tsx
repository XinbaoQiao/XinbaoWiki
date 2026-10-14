import { WikiHrefLink } from '@/components/WikiHrefLink';
import { pathWithBasePath } from '@/lib/wiki';

export default function NotFound() {
  return (
    <article className="wiki-page">
      <h1>Page not found</h1>
      <p>
        This wiki page does not exist yet. Return to{' '}
        <WikiHrefLink href={pathWithBasePath('/')}>the homepage</WikiHrefLink>
        {' '}to continue browsing Xinbaopedia.
      </p>
    </article>
  );
}
