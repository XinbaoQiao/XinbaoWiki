import { HomepagePortal } from '@/components/HomepagePortal';
import { pathWithBasePath } from '@/lib/wiki';
import { getPaperHighlights } from '@/lib/paper-highlights.server';
import { staticHomepageUpdatesAsOf } from '@/lib/site-updates';

export default function HomePage() {
  const directoryHref = pathWithBasePath('/portal-directory.json');
  return (
    <>
      <link rel="preload" href={directoryHref} as="fetch" crossOrigin="anonymous" />
      <HomepagePortal
        paperHighlights={getPaperHighlights()}
        updatesAsOf={staticHomepageUpdatesAsOf()}
      />
    </>
  );
}
