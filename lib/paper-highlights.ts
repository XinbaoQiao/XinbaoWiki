import type { SiteLanguage } from '@/lib/site-navigation';

export type PaperHighlight = {
  tldr: string;
  image: string;
  image_alt: string;
  image_caption: string;
  width: number;
  height: number;
};

export type PaperHighlightCatalog = Record<string, Record<SiteLanguage, PaperHighlight>>;
