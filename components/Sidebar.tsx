import { SidebarClient, type SidebarNavSection } from '@/components/SidebarClient';
import { navigationLabels, sidebarSections } from '@/lib/site-navigation';
import { getWikiManifestEntry } from '@/lib/wiki-manifest';
import { toChineseSlug, toEnglishSlug } from '@/lib/wiki';

function wikiHref(slug: string) {
  return `/wiki/${encodeURIComponent(slug)}/`;
}

function sidebarItem(slug: string) {
  const enSlug = toEnglishSlug(slug);
  const zhSlug = toChineseSlug(slug);
  const enEntry = getWikiManifestEntry(enSlug);
  const zhEntry = getWikiManifestEntry(zhSlug);
  if (!enEntry || !zhEntry) {
    throw new Error(`Sidebar slug must resolve to public bilingual wiki pages: ${slug}`);
  }
  return {
    slug,
    localizedSlug: { en: enSlug, zh: zhSlug },
    href: { en: wikiHref(enSlug), zh: wikiHref(zhSlug) },
    label: navigationLabels[slug] ?? { en: enEntry.title, zh: zhEntry.title }
  };
}

function sidebarManifest(): SidebarNavSection[] {
  return sidebarSections.map((section) => ({
    key: section.key,
    label: section.label,
    links: section.links.map(sidebarItem)
  }));
}

export function Sidebar() {
  return <SidebarClient sections={sidebarManifest()} />;
}
