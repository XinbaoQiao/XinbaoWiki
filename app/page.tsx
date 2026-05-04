import { Infobox } from '@/components/Infobox';
import { WikiMarkdown } from '@/components/WikiMarkdown';
import { getWikiPageBySlug, preprocessWikiLinks } from '@/lib/wiki';

export default function HomePage() {
  const page = getWikiPageBySlug('Xinbao_Qiao');
  if (!page) return <article className="wiki-page"><h1>Missing biography</h1></article>;
  return <article className="wiki-page"><Infobox data={page.data} /><h1>{page.title}</h1><WikiMarkdown markdown={preprocessWikiLinks(page.content)} /></article>;
}
