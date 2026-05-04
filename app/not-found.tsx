import { pathWithBasePath } from '@/lib/wiki';
export default function NotFound() { return <article className="wiki-page"><h1>Page not found</h1><p>This wiki page does not exist yet. Create a matching <code>wiki/*.md</code> file and update <a href={pathWithBasePath('/wiki/index/')}>the index</a>.</p></article>; }
