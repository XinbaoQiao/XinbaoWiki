import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Infobox } from '@/components/Infobox';
import { WikiMarkdown } from '@/components/WikiMarkdown';
import { getPublicWikiSlugs, getWikiPageBySlug, isChineseSlug, preprocessWikiLinks, wikiConceptType } from '@/lib/wiki';

export const dynamicParams = true;
type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() { return getPublicWikiSlugs().map((slug) => ({ slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getWikiPageBySlug(slug);
  if (!page) return { title: 'Page not found' };
  const description = page.summary || `Wiki page: ${page.title}`;
  const canonical = `/wiki/${encodeURIComponent(page.slug)}/`;
  return {
    title: page.title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      url: canonical,
      title: page.title,
      description,
      siteName: 'Xinbaopedia'
    },
    twitter: {
      card: 'summary',
      title: page.title,
      description
    }
  };
}

export default async function WikiPage({ params }: Props) {
  const { slug } = await params;
  const page = getWikiPageBySlug(slug);
  if (!page) notFound();
  const sourceHref = `https://github.com/XinbaoQiao/XinbaoWiki/edit/main/wiki/${encodeURIComponent(page.fileName)}`;
  const language = isChineseSlug(page.slug) ? 'zh' : 'en';
  const editLabel = language === 'zh' ? '编辑' : 'edit';
  const pageType = wikiConceptType(page.data, page.slug);
  return (
    <article className="wiki-page" data-page-slug={page.slug} data-page-type={pageType}>
      <h1 className="wiki-title">
        {page.title}
        <span className="edit-link">
          <a href={sourceHref} target="_blank" rel="noreferrer">{editLabel}</a>
        </span>
      </h1>
      {page.summary && <p className="wiki-title-sub">{page.summary}</p>}
      <Infobox data={page.data} language={language} />
      <WikiMarkdown editLabel={editLabel} sourceHref={sourceHref} markdown={preprocessWikiLinks(page.content, { language })} />
    </article>
  );
}
