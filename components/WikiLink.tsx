'use client';

import NextLink from 'next/link';
import { Link as TransitionLink } from 'next-view-transitions';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useSyncExternalStore,
  type ComponentProps,
  type MouseEvent,
  type ReactNode
} from 'react';
import {
  clearWikiMorphIntent,
  getWikiTitleCacheVersion,
  lookupWikiTitle,
  prepareWikiTitleMorph,
  shouldPrepareWikiTitleMorph,
  subscribeWikiTitleCache,
  wikiTitleViewTransitionName
} from '@/lib/wiki-view-transition';

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onStoreChange) => {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      media.addEventListener('change', onStoreChange);
      return () => media.removeEventListener('change', onStoreChange);
    },
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false
  );
}

function textFromNode(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textFromNode).join('');
  if (typeof node === 'object' && 'props' in node) {
    const props = (node as { props?: { children?: ReactNode } }).props;
    return textFromNode(props?.children);
  }
  return '';
}

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
  titleMorphLabel?: ReactNode;
  titleMorphSlug?: string | null;
  /** Real destination H1 title when known (search index). Gates morph when set. */
  titleMorphDestTitle?: string | null;
  /** Where the morph launches from — body links need a clearer flight than chrome chips. */
  titleMorphOrigin?: 'chrome' | 'body';
  onClick?: ComponentProps<'a'>['onClick'];
  onMouseEnter?: ComponentProps<'a'>['onMouseEnter'];
  'aria-current'?: ComponentProps<'a'>['aria-current'];
  'aria-label'?: string;
  'aria-selected'?: ComponentProps<'a'>['aria-selected'];
  id?: string;
  role?: string;
  title?: string;
};

export function WikiLink({
  href,
  children,
  className,
  titleMorphLabel,
  titleMorphSlug,
  titleMorphDestTitle,
  titleMorphOrigin = 'chrome',
  onClick,
  onMouseEnter,
  title,
  ...rest
}: Props) {
  const reduceMotion = usePrefersReducedMotion();
  const router = useRouter();
  // Only body/unknown-title chips need the title-cache subscription. Sidebar already
  // passes dest titles — skip the mass re-render when search-index arrives.
  const needsTitleCache = Boolean(titleMorphSlug) && titleMorphDestTitle == null;
  useSyncExternalStore(
    needsTitleCache ? subscribeWikiTitleCache : () => () => {},
    needsTitleCache ? getWikiTitleCacheVersion : () => 0,
    () => 0
  );
  const LinkComponent = reduceMotion ? NextLink : TransitionLink;
  const morphSlug = titleMorphSlug || null;
  const morphLabelText = textFromNode(titleMorphLabel ?? children);
  const morphEligible =
    Boolean(morphSlug) &&
    shouldPrepareWikiTitleMorph(morphSlug, morphLabelText, titleMorphDestTitle ?? lookupWikiTitle(morphSlug));
  // Only put a shared VT class chip in the DOM when morph is eligible — avoids
  // naming language toggles / mismatched chrome for a fake flight.
  const morphName = morphEligible && morphSlug
    ? wikiTitleViewTransitionName(morphSlug)
    : undefined;

  const handleMouseEnter = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    onMouseEnter?.(event);
    // Explicit prefetch on hover — helps first soft-nav after idle warmup window.
    try {
      router.prefetch(href);
    } catch {
      /* ignore */
    }
  }, [href, onMouseEnter, router]);

  const handleClick = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || reduceMotion) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    // Non-morph navigations (language toggle, mismatched labels, # handled elsewhere)
    // must clear any stale morph intent so the dest H1 does not take a VT name.
    if (!morphSlug || !morphEligible) {
      clearWikiMorphIntent();
      return;
    }
    const root = event.currentTarget;
    const chip =
      (root.matches('[data-wiki-title-vt]') ? root : null) ||
      root.querySelector<HTMLElement>(':scope > [data-wiki-title-vt]') ||
      root.querySelector<HTMLElement>('[data-wiki-title-vt]');
    prepareWikiTitleMorph(morphSlug, chip, {
      labelText: morphLabelText || chip?.textContent || null,
      destTitle: titleMorphDestTitle
    });
  }, [morphEligible, morphLabelText, morphSlug, onClick, reduceMotion, titleMorphDestTitle]);

  let body: ReactNode = children;
  if (morphName) {
    const chip = (
      <span
        className="wiki-vt-title"
        data-wiki-title-vt
        data-vt-slug={morphSlug ?? undefined}
        data-wiki-vt-origin={titleMorphOrigin}
      >
        {titleMorphLabel ?? children}
      </span>
    );
    body = titleMorphLabel != null ? (
      <>
        {chip}
        {children}
      </>
    ) : (
      chip
    );
  }

  const mergedClassName = Array.from(new Set(
    ['wiki-link-page', className].filter(Boolean).join(' ').split(/\s+/).filter(Boolean)
  )).join(' ') || undefined;

  return (
    <LinkComponent
      className={mergedClassName}
      href={href}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      title={title}
      {...rest}
    >
      {body}
    </LinkComponent>
  );
}
