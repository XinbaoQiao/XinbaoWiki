import { NextResponse } from 'next/server';
import { getWikiFeedEntries } from '@/lib/wiki-manifest';

export const dynamic = 'force-static';

const SITE_URL = 'https://xinbaopedia.top';
const FEED_TITLE = 'Xinbaopedia updates';
const FEED_ID = `${SITE_URL}/feed.xml`;

function xml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function absoluteWikiUrl(slug: string) {
  return `${SITE_URL}/wiki/${encodeURIComponent(slug)}/`;
}

function atomDate(value: string | undefined) {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

function feedXml() {
  const entries = getWikiFeedEntries(24);
  const updated = atomDate(entries[0]?.updatedAt ?? entries[0]?.timestamp) ?? new Date('2026-05-01T00:00:00.000Z').toISOString();
  const items = entries.map((entry) => {
    const url = absoluteWikiUrl(entry.slug);
    const published = atomDate(entry.timestamp);
    const itemUpdated = atomDate(entry.updatedAt ?? entry.timestamp) ?? updated;
    const categories = entry.tags.map((tag) => `<category term="${xml(tag)}" />`).join('');
    return [
      '<entry>',
      `<title>${xml(entry.title)}</title>`,
      `<id>${xml(url)}</id>`,
      `<link href="${xml(url)}" />`,
      `<updated>${itemUpdated}</updated>`,
      published ? `<published>${published}</published>` : '',
      `<summary>${xml(entry.summary || entry.type)}</summary>`,
      `<category term="${xml(entry.language)}" />`,
      `<category term="${xml(entry.type)}" />`,
      categories,
      '</entry>'
    ].join('');
  }).join('');

  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom"><title>${xml(FEED_TITLE)}</title><id>${xml(FEED_ID)}</id><link href="${xml(SITE_URL)}/" /><link rel="self" href="${xml(FEED_ID)}" type="application/atom+xml" /><updated>${updated}</updated>${items}</feed>
`;
}

export function GET() {
  return new NextResponse(feedXml(), {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=31536000, stale-while-revalidate=86400'
    }
  });
}
