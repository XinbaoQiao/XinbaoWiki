import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Infobox } from '@/components/Infobox';
import { WikiMarkdown } from '@/components/WikiMarkdown';
import { getAllWikiSlugs, getWikiPageBySlug, isChineseSlug, preprocessWikiLinks } from '@/lib/wiki';

export const dynamicParams = false;
type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() { return getAllWikiSlugs().map((slug) => ({ slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getWikiPageBySlug(slug);
  return page ? { title: `${page.title} | Xinbaopedia`, description: page.summary || `Wiki page: ${page.title}` } : { title: 'Page not found' };
}

export default async function WikiPage({ params }: Props) {
  const { slug } = await params;
  const page = getWikiPageBySlug(slug);
  if (!page) notFound();
  const sourceHref = `https://github.com/XinbaoQiao/XinbaoWiki/edit/main/wiki/${encodeURIComponent(page.fileName)}`;
  const language = isChineseSlug(page.slug) ? 'zh' : 'en';
  return (
    <article className="wiki-page">
      <h1 className="wiki-title">
        {page.title}
        <span className="edit-link">
          <a href={sourceHref} target="_blank" rel="noreferrer">edit</a>
        </span>
      </h1>
      {page.summary && <p className="wiki-title-sub">{page.summary}</p>}
      <Infobox data={page.data} />
      <WikiMarkdown sourceHref={sourceHref} markdown={preprocessWikiLinks(page.content, { language })} />
    </article>
  );
}
