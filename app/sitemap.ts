import type { MetadataRoute } from 'next';
import { getPublicWikiSlugs } from '@/lib/wiki';

const SITE_URL = 'https://xinbaopedia.top';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      changeFrequency: 'monthly',
      priority: 1
    },
    ...getPublicWikiSlugs().map((slug) => ({
      url: `${SITE_URL}/wiki/${encodeURIComponent(slug)}/`,
      changeFrequency: 'monthly' as const,
      priority: slug === 'Xinbao_Qiao' || slug === 'Qiao_Xinbao_zh' ? 0.9 : 0.7
    }))
  ];
}
