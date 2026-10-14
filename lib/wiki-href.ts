import { wikiSlugFromHref } from '@/lib/wiki-view-transition';

export type WikiHrefKind = 'local' | 'page' | 'external' | 'asset';

export type ClassifiedWikiHref = {
  kind: WikiHrefKind;
  href: string;
  /** Present for wiki article / Updates targets that support Jim title morph. */
  morphSlug?: string;
};

/** Isomorphic base-path join (avoid importing server-only lib/wiki into client). */
function pathWithBasePath(pathname: string) {
  const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');
  if (!pathname.startsWith('/') || pathname.startsWith('//')) return pathname;
  if (!base || pathname === base || pathname.startsWith(`${base}/`)) return pathname;
  return `${base}${pathname}`;
}

/** Distinguish in-page (#) vs cross-page wiki targets vs external/asset URLs. */
export function classifyWikiHref(rawHref: string, options?: { applyBasePath?: boolean }): ClassifiedWikiHref {
  const applyBase = options?.applyBasePath !== false;
  const raw = (rawHref || '#').trim() || '#';

  if (raw.startsWith('#')) {
    return { kind: 'local', href: raw };
  }

  if (/^(https?:|mailto:|tel:)/i.test(raw)) {
    return { kind: 'external', href: raw };
  }

  const href = applyBase && raw.startsWith('/') ? pathWithBasePath(raw) : raw;
  const pathOnly = href.split(/[?#]/)[0] || '';

  if (/\.(xml|json|txt|pdf|png|jpe?g|gif|webp|svg)$/i.test(pathOnly)) {
    return { kind: 'asset', href };
  }

  const wikiSlug = wikiSlugFromHref(href);
  if (wikiSlug) {
    return { kind: 'page', href, morphSlug: wikiSlug };
  }

  if (/\/updates\/?$/.test(pathOnly)) {
    return { kind: 'page', href, morphSlug: 'Updates' };
  }

  if (raw.startsWith('/') || href.startsWith('/')) {
    return { kind: 'page', href };
  }

  return { kind: 'external', href };
}

export function wikiLinkClassName(kind: WikiHrefKind, extra?: string | undefined) {
  const base =
    kind === 'local' ? 'wiki-link-local'
      : kind === 'page' ? 'wiki-link-page'
        : kind === 'external' ? 'external'
          : undefined;
  return [base, extra].filter(Boolean).join(' ') || undefined;
}
