import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Infobox } from '@/components/Infobox';
import { WikiMarkdown } from '@/components/WikiMarkdown';
import { getAllWikiSlugs, getWikiPageBySlug, preprocessWikiLinks } from '@/lib/wiki';

export const dynamicParams = false;
type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() { return getAllWikiSlugs().map((slug) => ({ slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getWikiPageBySlug(slug);
  return page ? { title: `${page.title} | Qiao Xinbao Academic Wiki`, description: page.summary || `Wiki page: ${page.title}` } : { title: 'Page not found' };
}

export default async function WikiPage({ params }: Props) {
  const { slug } = await params;
  const page = getWikiPageBySlug(slug);
  if (!page) notFound();
  return <article className="wiki-page"><Infobox data={page.data} /><h1>{page.title}</h1><WikiMarkdown markdown={preprocessWikiLinks(page.content)} /></article>;
}
