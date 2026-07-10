import { pathWithBasePath } from '@/lib/wiki';
export default function NotFound() { return <article className="wiki-page"><h1>Page not found</h1><p>This wiki page does not exist yet. Return to <a href={pathWithBasePath('/wiki/index/')}>the index</a> to continue browsing Xinbaopedia.</p></article>; }
