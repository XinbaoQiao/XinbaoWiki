import { NextResponse } from 'next/server';
import { getSearchIndex } from '@/lib/wiki';

export const dynamic = 'force-static';

export function GET() {
  return NextResponse.json(getSearchIndex(), {
    headers: {
      'Cache-Control': 'public, max-age=300, s-maxage=31536000, stale-while-revalidate=86400'
    }
  });
}
