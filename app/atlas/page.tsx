import type { Metadata } from 'next';
import { ResearchAtlas } from '@/components/ResearchAtlas';
import { getResearchAtlasData } from '@/lib/research-atlas';

export const metadata: Metadata = {
  title: 'Research Atlas | Xinbaopedia',
  description: 'An interactive bilingual map of Xinbao Qiao’s research trajectory, topics, publications, and institutions.'
};

export default function ResearchAtlasPage() {
  return <ResearchAtlas data={getResearchAtlasData()} />;
}
