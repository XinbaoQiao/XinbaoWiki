import { getWikiManifestEntry } from '@/lib/wiki-manifest';
import { siteConfig } from '@/lib/site-config';

export type SiteLanguage = 'en' | 'zh';
export type LocalizedText = Record<SiteLanguage, string>;

export type CuratedLinkGroup = {
  label: LocalizedText;
  links: Record<SiteLanguage, string[]>;
};

export type CuratedDirectorySection = {
  title: LocalizedText;
  groups: CuratedLinkGroup[];
};

// Navigation is derived from lib/site-config.ts; edit that file, not this one.
// Pages that do not exist (in both languages) are skipped, and empty groups/sections are hidden,
// so deleting an example page never breaks the build.
type NavEntry = { slug: string; label: LocalizedText };

const hasPage = (slug: string) => Boolean(getWikiManifestEntry(slug) && getWikiManifestEntry(`${slug}_zh`));
const present = (slugs: readonly string[]) => slugs.filter(hasPage);
const presentEntries = (entries: readonly NavEntry[]) => entries.filter((entry) => hasPage(entry.slug));

function group(label: LocalizedText, slugs: readonly string[]): CuratedLinkGroup | null {
  const en = present(slugs);
  return en.length ? { label, links: { en, zh: en.map((slug) => `${slug}_zh`) } } : null;
}

function section(title: LocalizedText, groups: (CuratedLinkGroup | null)[]): CuratedDirectorySection | null {
  const kept = groups.filter((item): item is CuratedLinkGroup => item !== null);
  return kept.length ? { title, groups: kept } : null;
}

const slugsOf = (entries: readonly NavEntry[]) => entries.map((entry) => entry.slug);

export const languageEntries = [
  { label: 'English', slug: 'Your_Name', detail: 'Academic biography and research overview' },
  { label: '中文', slug: 'Your_Name_zh', detail: '个人学术条目与研究概览' }
] as const;

export const directorySections: CuratedDirectorySection[] = [
  section({ en: 'Research', zh: '研究' }, [
    group({ en: 'Research areas', zh: '研究方向' }, ['Research', ...slugsOf(siteConfig.researchAreas)]),
    group({ en: 'Concepts', zh: '概念' }, slugsOf(siteConfig.concepts))
  ]),
  section({ en: 'Publications and projects', zh: '论文与项目' }, [
    group({ en: 'Indexes', zh: '索引' }, ['Publications', 'Projects']),
    group({ en: 'Selected publications', zh: '代表论文' }, siteConfig.selectedPublications)
  ]),
  section({ en: 'Profile and affiliations', zh: '履历与机构' }, [
    group({ en: 'Profile', zh: '个人资料' }, ['CV', 'Education', 'Experience']),
    group({ en: 'Institutions', zh: '机构' }, [...slugsOf(siteConfig.education), ...slugsOf(siteConfig.experience)]),
    group({ en: 'People', zh: '学术网络' }, slugsOf(siteConfig.people))
  ])
].filter((item): item is CuratedDirectorySection => item !== null);

const sidebarCandidates = [
  { key: 'navigation', label: { en: 'Navigation', zh: '导航' }, links: present(['Your_Name', 'Publications', 'CV']) },
  { key: 'researchTopics', label: { en: 'Research areas', zh: '研究方向' }, links: slugsOf(presentEntries(siteConfig.researchAreas)) },
  { key: 'education', label: { en: 'Education', zh: '教育经历' }, links: slugsOf(presentEntries(siteConfig.education)) },
  { key: 'experience', label: { en: 'Experience', zh: '研究经历' }, links: slugsOf(presentEntries(siteConfig.experience)) }
];

export const sidebarSections = sidebarCandidates.filter((item) => item.links.length > 0);

export const navigationLabels: Record<string, LocalizedText> = {
  Your_Name: { en: 'Main page', zh: '主页' },
  Publications: { en: 'Publications', zh: '论文' },
  CV: { en: 'CV', zh: '简历' },
  ...Object.fromEntries(
    [...siteConfig.researchAreas, ...siteConfig.concepts, ...siteConfig.education, ...siteConfig.experience, ...siteConfig.people]
      .map((entry) => [entry.slug, entry.label])
  )
};
