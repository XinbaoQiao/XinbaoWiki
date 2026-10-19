import type { PaperHighlightCatalog } from '@/lib/paper-highlights';
import { siteUpdates } from '@/lib/site-updates';
import { getManifestWikiPage } from '@/lib/wiki-manifest';

export function getPaperHighlights(): PaperHighlightCatalog {
  const catalog: PaperHighlightCatalog = {};
  for (const paper of siteUpdates.en.flatMap((item) => item.papers ?? [])) {
    const localized = {} as PaperHighlightCatalog[string];
    for (const language of ['en', 'zh'] as const) {
      const slug = language === 'zh' ? `${paper.slug}_zh` : paper.slug;
      const highlight = getManifestWikiPage(slug)?.data.paper_highlight;
      if (!highlight?.tldr || !highlight.image?.startsWith('/papers/') ||
          !highlight.image_alt || !highlight.image_caption ||
          !Number.isInteger(highlight.width) || highlight.width <= 0 ||
          !Number.isInteger(highlight.height) || highlight.height <= 0) {
        throw new Error(`Accepted paper needs a complete canonical highlight: ${slug}`);
      }
      localized[language] = highlight;
    }
    catalog[paper.slug] = localized;
  }
  return catalog;
}
