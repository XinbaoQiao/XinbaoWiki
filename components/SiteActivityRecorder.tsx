'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { SITE_ACTIVITY_API_PATH } from '@/lib/site-activity';

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');

/** Background collection only; no additional public analytics interface. */
export function SiteActivityRecorder() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);
  const pending = useRef(Promise.resolve());

  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return;
    lastPath.current = pathname;
    let referrer = '';
    try { referrer = new URL(document.referrer).hostname; } catch { /* Direct or suppressed referrer. */ }
    // Serialize pings so a quick navigation uses the cookie minted by the first.
    pending.current = pending.current.then(async () => {
      try {
        await fetch(`${basePath}${SITE_ACTIVITY_API_PATH}`, {
          cache: 'no-store', credentials: 'same-origin', keepalive: true, method: 'POST',
          headers: { 'x-site-activity-page': pathname, 'x-site-activity-referrer': referrer },
          signal: AbortSignal.timeout(10_000)
        });
      } catch { /* Statistics must never block navigation. */ }
    });
  }, [pathname]);

  return null;
}
