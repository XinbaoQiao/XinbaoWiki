'use client';

import { useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';

export const DISCLOSURE_HEIGHT_MS = 420;
export const DISCLOSURE_HEIGHT_EASE = 'cubic-bezier(.22, 1, .36, 1)';

export type DisclosureHeightAnimateInfo = {
  next: boolean;
  startHeight: number;
  endHeight: number;
  duration: number;
  easing: string;
  reducedMotion: boolean;
};

type AnimatedDisclosureOptions = {
  /** Fired in the same turn as the height WAAPI starts (after open commit / before close commit). */
  onHeightAnimate?: (info: DisclosureHeightAnimateInfo) => void;
};

/** Keep native details semantics, but commit content before measuring its opening size. */
export function useAnimatedDisclosure(
  open: boolean,
  commit: (open: boolean) => void,
  options?: AnimatedDisclosureOptions
) {
  const ref = useRef<HTMLDetailsElement>(null);
  const animation = useRef<Animation | null>(null);
  const closing = useRef(false);
  const onHeightAnimateRef = useRef(options?.onHeightAnimate);
  onHeightAnimateRef.current = options?.onHeightAnimate;

  useEffect(() => () => {
    animation.current?.cancel();
  }, []);

  function change(next: boolean, updateContent?: () => void) {
    const element = ref.current;
    if (!element) { updateContent?.(); if (next !== open) commit(next); return; }
    // Name-only restore requests all sections closed again. Re-animating an
    // already-closed section changes its hidden height and spoils the FLIP target.
    if (!updateContent && !animation.current && next === open && element.open === next) return;
    const start = element.getBoundingClientRect().height;
    animation.current?.cancel();
    animation.current = null;
    closing.current = !next;
    const clearHeightHint = () => {
      if (element.style.willChange === 'height') element.style.willChange = '';
      element.style.height = '';
      element.style.overflow = '';
    };
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || !element.animate) {
      closing.current = false;
      clearHeightHint();
      if (updateContent) flushSync(() => { commit(next); updateContent(); });
      else commit(next);
      onHeightAnimateRef.current?.({
        next,
        startHeight: start,
        endHeight: updateContent ? element.getBoundingClientRect().height : start,
        duration: 0,
        easing: DISCLOSURE_HEIGHT_EASE,
        reducedMotion: true
      });
      return;
    }
    // Pin height before any open commit so the first paint cannot flash full size.
    element.style.height = `${start}px`;
    element.style.overflow = 'clip';
    element.style.willChange = 'height';

    let end: number;
    if (next) {
      flushSync(() => { commit(true); updateContent?.(); });
      // Measure the natural border box, then restore the pin in the same turn.
      // scrollHeight rounds content pixels and omits the borders, causing an end snap.
      element.style.height = 'auto';
      end = element.getBoundingClientRect().height;
      element.style.height = `${start}px`;
    } else {
      // Measure the closed summary without hiding the real outgoing contents.
      const probe = element.cloneNode(false) as HTMLDetailsElement;
      probe.removeAttribute('id');
      probe.open = false;
      probe.setAttribute('aria-hidden', 'true');
      probe.inert = true;
      probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;width:${element.getBoundingClientRect().width}px;transition:none;`;
      const summary = element.querySelector(':scope > summary');
      if (summary) probe.append(summary.cloneNode(true));
      element.parentElement?.append(probe);
      end = probe.getBoundingClientRect().height;
      probe.remove();
    }
    onHeightAnimateRef.current?.({
      next,
      startHeight: start,
      endHeight: end,
      duration: DISCLOSURE_HEIGHT_MS,
      easing: DISCLOSURE_HEIGHT_EASE,
      reducedMotion: false
    });
    const current = element.animate(
      [{ height: `${start}px`, overflow: 'clip' }, { height: `${end}px`, overflow: 'clip' }],
      { duration: DISCLOSURE_HEIGHT_MS, easing: DISCLOSURE_HEIGHT_EASE, fill: 'forwards' }
    );
    animation.current = current;
    const finish = () => {
      if (animation.current !== current) return;
      if (!next) flushSync(() => commit(false));
      closing.current = false;
      // Drop the filled height only after open=false so layout matches the end keyframe.
      current.cancel();
      animation.current = null;
      clearHeightHint();
    };
    current.oncancel = () => {
      // Cancellation events arrive asynchronously. An old animation must not
      // clear the height/overflow owned by a newly reversed animation.
      if (animation.current !== current) return;
      animation.current = null;
      closing.current = false;
      clearHeightHint();
    };
    current.onfinish = finish;
  }

  return {
    ref, change, toggle: () => change(closing.current || !open),
    // Content changes share the disclosure's single height-animation owner,
    // including when the user switches views before opening has finished.
    resize: (updateContent: () => void) => {
      if (ref.current?.open) change(true, updateContent);
      else updateContent();
    }
  };
}
