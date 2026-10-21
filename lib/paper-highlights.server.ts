import type { PaperHighlightCatalog } from '@/lib/paper-highlights';
import type { PaperHighlightImage } from '@/lib/paper-highlights';
import { siteUpdates } from '@/lib/site-updates';
import { getManifestWikiPage } from '@/lib/wiki-manifest';

export function getPaperHighlights(): PaperHighlightCatalog {
  const catalog: PaperHighlightCatalog = {};
  for (const paper of siteUpdates.en.flatMap((item) => item.papers ?? [])) {
    const localized = {} as PaperHighlightCatalog[string];
    for (const language of ['en', 'zh'] as const) {
      const slug = language === 'zh' ? `${paper.slug}_zh` : paper.slug;
      const page = getManifestWikiPage(slug)?.data;
      const highlight = page?.paper_highlight;
      const validImage = (image?: PaperHighlightImage) => image?.image?.startsWith('/papers/') &&
        image.image_alt && Number.isInteger(image.width) && image.width > 0 &&
        Number.isInteger(image.height) && image.height > 0;
      if (!highlight?.tldr || !validImage(highlight) ||
          (highlight.poster && !validImage(highlight.poster)) ||
          highlight.figures?.length !== 3 || !highlight.figures.every(validImage)) {
        throw new Error(`Accepted paper needs a complete canonical highlight: ${slug}`);
      }
      localized[language] = { ...highlight, resources: page?.links ?? [] };
    }
    catalog[paper.slug] = localized;
  }
  return catalog;
}
