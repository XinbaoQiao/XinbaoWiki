import { HomepagePortal } from '@/components/HomepagePortal';
import { directorySections, languageEntries } from '@/lib/site-navigation';
import { getWikiManifestEntry } from '@/lib/wiki-manifest';
import { pathWithBasePath } from '@/lib/wiki';

function wikiHref(slug: string) {
  return pathWithBasePath(`/wiki/${encodeURIComponent(slug)}/`);
}

function entry(slug: string) {
  const page = getWikiManifestEntry(slug);
  if (!page) {
    throw new Error(`Homepage directory slug must resolve to a public wiki page: ${slug}`);
  }
  return {
    href: wikiHref(slug),
    summary: page.summary,
    title: page.title
  };
}

export default function HomePage() {
  const portalLanguageEntries = languageEntries.map((item) => ({
    detail: item.detail,
    href: wikiHref(item.slug),
    label: item.label
  }));
  const portalDirectorySections = directorySections.map((section) => ({
    title: section.title,
    groups: section.groups.map((group) => ({
      label: group.label,
      links: {
        en: group.links.en.map(entry),
        zh: group.links.zh.map(entry)
      }
    }))
  }));

  return (
    <HomepagePortal
      directorySections={portalDirectorySections}
      languageEntries={portalLanguageEntries}
    />
  );
}
