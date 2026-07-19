import type { WikiFrontmatter } from '@/lib/wiki';

export function isChineseSlug(slug: string) {
  return slug === 'Qiao_Xinbao_zh' || slug.endsWith('_zh');
}

export function toChineseSlug(slug: string) {
  if (slug === 'Xinbao_Qiao') return 'Qiao_Xinbao_zh';
  if (isChineseSlug(slug)) return slug;
  return `${slug}_zh`;
}

export function toEnglishSlug(slug: string) {
  if (slug === 'Qiao_Xinbao_zh') return 'Xinbao_Qiao';
  return slug.endsWith('_zh') ? slug.slice(0, -3) : slug;
}

export function wikiPageTitle(data: WikiFrontmatter, slug: string) {
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const title = typeof data.title === 'string' ? data.title.trim() : '';
  return name || title || slug.replaceAll('_', ' ');
}

export function wikiPageSummary(data: WikiFrontmatter) {
  const summary = typeof data.summary === 'string' ? data.summary.trim() : '';
  const description = typeof data.description === 'string' ? data.description.trim() : '';
  return summary || description;
}

export function wikiConceptType(data: WikiFrontmatter, slug: string) {
  if (typeof data.type === 'string' && data.type.trim()) return data.type.trim();
  if (typeof data.occupation === 'string' && data.occupation.trim()) return data.occupation.trim();
  if (Array.isArray(data.occupation)) {
    const first = data.occupation.find((item) => typeof item === 'string' && item.trim());
    if (typeof first === 'string') return first.trim();
  }
  if (Array.isArray(data.authors) || data.venue || data.publication_type) return 'publication';
  if (slug === 'index' || slug === 'index_zh') return 'index';
  if (slug === 'log' || slug === 'log_zh') return 'update log';
  return 'article';
}
