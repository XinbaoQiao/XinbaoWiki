import { Infobox } from '@/components/Infobox';
import { WikiMarkdown } from '@/components/WikiMarkdown';
import { getWikiPageBySlug, preprocessWikiLinks } from '@/lib/wiki';

export default function HomePage() {
  const page = getWikiPageBySlug('Xinbao_Qiao');
  if (!page) return <article className="wiki-page"><h1>Missing biography</h1></article>;
  return (
    <article className="wiki-page" data-page-slug={page.slug}>
      <h1 className="wiki-title">
        {page.title}
        <span className="edit-link">
          <a href="https://github.com/XinbaoQiao/XinbaoWiki/edit/main/wiki/Xinbao_Qiao.md" target="_blank" rel="noreferrer">edit</a>
        </span>
      </h1>
      {page.summary && <p className="wiki-title-sub">{page.summary}</p>}
      <Infobox data={page.data} />
      <WikiMarkdown sourceHref="https://github.com/XinbaoQiao/XinbaoWiki/edit/main/wiki/Xinbao_Qiao.md" markdown={preprocessWikiLinks(page.content)} />
    </article>
  );
}
