'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SITE_ACTIVITY_API_PATH } from '@/lib/site-activity';
import { clearWikiTitleMorphPeers, ensureWikiTitleCache, installWikiTitleMorphHooks } from '@/lib/wiki-view-transition';

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');

function collectWarmupHrefs(limit = 2): string[] {
  if (typeof document === 'undefined') return [];
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (raw: string | null | undefined) => {
    if (!raw || raw.startsWith('#') || out.length >= limit) return;
    let path = raw;
    try {
      if (raw.includes('://')) path = new URL(raw).pathname;
    } catch {
      return;
    }
    const clean = path.split('?')[0].split('#')[0];
    if (!clean || seen.has(clean)) return;
    const isWiki = /\/wiki\//.test(clean);
    const isUpdates = /\/updates\/?$/.test(clean);
    if (!isWiki && !isUpdates) return;
    seen.add(clean);
    out.push(clean);
  };

  document
    .querySelectorAll<HTMLAnchorElement>('aside.wiki-sidebar-desktop a.wiki-link-page, .wiki-main a.wiki-link-page')
    .forEach((anchor) => {
      const bounds = anchor.getBoundingClientRect();
      if (bounds.width && bounds.height && bounds.bottom > 0 && bounds.top < window.innerHeight) add(anchor.getAttribute('href'));
    });
  return out;
}

/** Background collection only; no additional public analytics interface. */
export function SiteActivityRecorder() {
  const pathname = usePathname();
  const router = useRouter();
  const lastPath = useRef<string | null>(null);
  const pending = useRef(Promise.resolve());
  const warmed = useRef(new Set<string>());

  useLayoutEffect(() => installWikiTitleMorphHooks(), []);

  useEffect(() => {
    void ensureWikiTitleCache();
  }, []);

  // Drop click-time title names on shared chrome before the new VT snapshot
  // (duplicate names with the article H1 abort the morph in Chrome).
  // Also mutes the source chip so the pinned sidebar snapshot cannot ghost.
  useLayoutEffect(() => {
    clearWikiTitleMorphPeers();
  }, [pathname]);

  // Prefetch soft-nav targets after idle so the first click is not a compile/RSC hitch.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;
    const timers: number[] = [];

    const warm = () => {
      const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
      if (cancelled || document.hidden || connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? '')) return;
      void ensureWikiTitleCache();
      const hrefs = collectWarmupHrefs();
      hrefs.forEach((href, index) => {
        if (warmed.current.has(href)) return;
        const id = window.setTimeout(() => {
          if (cancelled || document.hidden) return;
          try {
            router.prefetch(href);
            warmed.current.add(href);
          } catch {
            /* Prefetch must never block UI. */
          }
        }, 400 + index * 250);
        timers.push(id);
      });
    };

    let idleId = 0;
    let fallback = 0;
    if (typeof requestIdleCallback === 'function') {
      idleId = requestIdleCallback(warm, { timeout: 2200 });
    } else {
      fallback = window.setTimeout(warm, 600);
    }

    return () => {
      cancelled = true;
      if (idleId && typeof cancelIdleCallback === 'function') cancelIdleCallback(idleId);
      if (fallback) window.clearTimeout(fallback);
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [pathname, router]);

  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return;
    lastPath.current = pathname;
    let referrer = '';
    try {
      referrer = new URL(document.referrer).hostname;
    } catch {
      /* Direct or suppressed referrer. */
    }
    const eventId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : '';
    // Serialize pings so a quick navigation uses the cookie minted by the first.
    // Defer until idle so the ping never contends with the view-transition frames.
    const run = () => {
      pending.current = pending.current.then(async () => {
        try {
          await fetch(`${basePath}${SITE_ACTIVITY_API_PATH}`, {
            cache: 'no-store',
            credentials: 'same-origin',
            keepalive: true,
            method: 'POST',
            headers: {
              'x-site-activity-page': pathname,
              'x-site-activity-referrer': referrer,
              'x-site-activity-event-id': eventId
            },
            signal: AbortSignal.timeout(10_000)
          });
        } catch {
          /* Statistics must never block navigation. */
        }
      });
    };
    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(run, { timeout: 2000 });
      return () => cancelIdleCallback(id);
    }
    const timer = window.setTimeout(run, 400);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
}
