'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';
import {
  peekWikiMorphIntent,
  scrollWikiTitleIntoViewForMorph,
  wikiTitleViewTransitionName
} from '@/lib/wiki-view-transition';

type Props = {
  slug: string;
  children: ReactNode;
  className?: string;
};

/**
 * Destination H1 chip. Only takes a shared view-transition-name when this
 * navigation armed a morph to this slug (click label matched dest title).
 *
 *  * When morphing, scroll the H1 into view *before* naming it so the VT new
 * snapshot's end rect is on-screen (flight lands in the viewport). Large
 * corrections arm a CSS scroll theater (wiki-main eases with the morph). Never hide
 * the live H1 during the flight — that caused a vanish/flash at landing.
 */
export function WikiTitleText({ slug, children, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    const morphTo = peekWikiMorphIntent();
    if (morphTo && morphTo === slug) {
      scrollWikiTitleIntoViewForMorph(node);
      node.style.viewTransitionName = wikiTitleViewTransitionName(slug);
      delete node.dataset.wikiVtDestHide;
      return undefined;
    }

    node.style.viewTransitionName = 'none';
    delete node.dataset.wikiVtDestHide;
    return undefined;
  }, [slug]);

  return (
    <span
      ref={ref}
      className={['wiki-title-text', 'wiki-title-morph', className].filter(Boolean).join(' ')}
      data-wiki-title-vt
      data-vt-slug={slug}
    >
      {children}
    </span>
  );
}
