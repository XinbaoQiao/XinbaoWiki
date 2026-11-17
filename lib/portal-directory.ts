import { directorySections } from '@/lib/site-navigation';
import { getWikiManifestEntry } from '@/lib/wiki-manifest';
import { pathWithBasePath } from '@/lib/wiki';
import type { LocalizedText, SiteLanguage } from '@/lib/site-navigation';

export type PortalDirectoryEntry = {
  href: string;
  slug: string;
  summary: string;
  title: string;
};

export type PortalDirectoryGroup = {
  label: LocalizedText;
  links: Record<SiteLanguage, PortalDirectoryEntry[]>;
};

export type PortalDirectorySection = {
  title: LocalizedText;
  groups: PortalDirectoryGroup[];
};

function wikiHref(slug: string) {
  return pathWithBasePath(`/wiki/${encodeURIComponent(slug)}/`);
}

function entry(slug: string): PortalDirectoryEntry {
  const page = getWikiManifestEntry(slug);
  if (!page) {
    throw new Error(`Homepage directory slug must resolve to a public wiki page: ${slug}`);
  }
  return {
    href: wikiHref(slug),
    slug,
    summary: page.summary,
    title: page.title
  };
}

export function buildPortalDirectorySections(): PortalDirectorySection[] {
  return directorySections.map((section) => ({
    title: section.title,
    groups: section.groups.map((group) => ({
      label: group.label,
      links: {
        en: group.links.en.map(entry),
        zh: group.links.zh.map(entry)
      }
    }))
  }));
}
