import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Infobox } from '@/components/Infobox';
import { WikiMarkdown } from '@/components/WikiMarkdown';
import {
  getPublicWikiSlugs,
  getWikiPageBySlug,
  isChineseSlug,
  pathWithBasePath,
  preprocessWikiLinks,
  toChineseSlug,
  toEnglishSlug,
  wikiConceptType
} from '@/lib/wiki';

export const dynamicParams = true;
type Props = { params: Promise<{ slug: string }> };

function validDate(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || Number.isNaN(Date.parse(trimmed))) return undefined;
  return trimmed;
}

function frontmatterTags(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];
}

function pageModifiedDate(data: { [key: string]: unknown }) {
  return validDate(data.modified) || validDate(data.updatedAt) || validDate(data.updated_at) || validDate(data.timestamp);
}

function readableDate(value: string) {
  return value.slice(0, 10);
}

export function generateStaticParams() { return getPublicWikiSlugs().map((slug) => ({ slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getWikiPageBySlug(slug);
  if (!page) return { title: 'Page not found' };
  const description = page.summary || `Wiki page: ${page.title}`;
  const canonical = `/wiki/${encodeURIComponent(page.slug)}/`;
  const language = isChineseSlug(page.slug) ? 'zh-CN' : 'en';
  const locale = language === 'zh-CN' ? 'zh_CN' : 'en_US';
  const siteImage = pathWithBasePath('/xinbaopedia-icon.png');
  const publishedTime = validDate(page.data.timestamp);
  const modifiedTime = pageModifiedDate(page.data);
  const tags = frontmatterTags(page.data.tags);
  const englishSlug = toEnglishSlug(page.slug);
  const chineseSlug = toChineseSlug(page.slug);
  const languages: Record<string, string> = {
    'x-default': `/wiki/${encodeURIComponent(englishSlug)}/`
  };
  if (getWikiPageBySlug(englishSlug)) languages.en = `/wiki/${encodeURIComponent(englishSlug)}/`;
  if (getWikiPageBySlug(chineseSlug)) languages['zh-CN'] = `/wiki/${encodeURIComponent(chineseSlug)}/`;
  return {
    title: page.title,
    description,
    alternates: {
      canonical,
      languages
    },
    openGraph: {
      type: 'article',
      url: canonical,
      title: page.title,
      description,
      siteName: 'Xinbaopedia',
      locale,
      alternateLocale: locale === 'zh_CN' ? ['en_US'] : ['zh_CN'],
      images: [siteImage],
      publishedTime,
      modifiedTime,
      tags
    },
    twitter: {
      card: 'summary',
      title: page.title,
      description,
      images: [siteImage]
    },
    other: {
      'content-language': language
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
  const updatedAt = pageModifiedDate(page.data);
  const updatedLabel = language === 'zh' ? '最后更新' : 'Last updated';
  const pageType = wikiConceptType(page.data, page.slug);
  return (
    <article
      className="wiki-page"
      data-page-language={language}
      data-page-slug={page.slug}
      data-page-type={pageType}
      lang={language === 'zh' ? 'zh-CN' : 'en'}
    >
      <h1 className="wiki-title">
        {page.title}
        <span className="edit-link">
          <a href={sourceHref} target="_blank" rel="noreferrer">{editLabel}</a>
        </span>
      </h1>
      {updatedAt && (
        <p className="wiki-page-meta">
          {updatedLabel} <time dateTime={updatedAt}>{readableDate(updatedAt)}</time>
        </p>
      )}
      {page.summary && <p className="wiki-title-sub">{page.summary}</p>}
      <Infobox data={page.data} language={language} />
      <WikiMarkdown editLabel={editLabel} sourceHref={sourceHref} markdown={preprocessWikiLinks(page.content, { language })} />
    </article>
  );
}
