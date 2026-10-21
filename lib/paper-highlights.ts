import type { SiteLanguage } from '@/lib/site-navigation';

export type PaperHighlightImage = {
  image: string;
  image_alt: string;
  width: number;
  height: number;
};

export type PaperHighlight = PaperHighlightImage & {
  tldr: string;
  poster?: PaperHighlightImage;
  figures: PaperHighlightImage[];
};

export type PaperHighlightCatalog = Record<string, Record<SiteLanguage, PaperHighlight & {
  resources: { label: string; url: string }[];
}>>;
