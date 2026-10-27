'use client';

import { useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';

/** Keep native details semantics, but commit content before measuring its opening size. */
export function useAnimatedDisclosure(open: boolean, commit: (open: boolean) => void) {
  const ref = useRef<HTMLDetailsElement>(null);
  const animation = useRef<Animation | null>(null);
  const closing = useRef(false);
  const settlement = useRef<Animation[]>([]);
  useEffect(() => () => {
    animation.current?.cancel();
    settlement.current.forEach(item => item.cancel());
  }, []);

  function change(next: boolean) {
    const element = ref.current;
    if (!element) { commit(next); return; }
    settlement.current.forEach(item => item.cancel());
    settlement.current = [];
    const start = element.getBoundingClientRect().height;
    animation.current?.cancel();
    animation.current = null;
    closing.current = !next;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !element.animate) {
      closing.current = false;
      commit(next);
      return;
    }
    let end: number;
    if (next) {
      flushSync(() => commit(true));
      end = element.getBoundingClientRect().height;
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
    element.style.willChange = 'height';
    const current = element.animate([{ height: `${start}px`, overflow: 'clip' }, { height: `${end}px`, overflow: 'clip' }], {
      duration: 260, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'both'
    });
    animation.current = current;
    const clearHeightHint = () => {
      if (element.style.willChange === 'height') element.style.willChange = '';
    };
    current.oncancel = clearHeightHint;
    current.onfinish = () => {
      if (animation.current !== current) return;
      clearHeightHint();
      // Closing the feed also restores Compact and recenters the homepage.
      // Animate those final layout changes from their actual outgoing positions.
      const portal = !next && element.id === 'portal-news' ? element.closest<HTMLElement>('.wiki-portal') : null;
      const items = portal ? [...portal.querySelectorAll<HTMLElement>('.wiki-portal-hero, .wiki-portal-disclosures > details')] : [];
      const before = items.map(item => item.getBoundingClientRect());
      if (portal) portal.dataset.measuredLayout = '';
      if (!next) flushSync(() => commit(false));
      closing.current = false;
      current.cancel();
      animation.current = null;
      const after = items.map(item => item.getBoundingClientRect());
      settlement.current = items.map((item, index) => {
        const from = before[index], to = after[index];
        return item.animate([
          { transform: `translate(${from.left - to.left}px, ${from.top - to.top}px)`, width: `${from.width}px` },
          { transform: 'translate(0, 0)', width: `${to.width}px` }
        ], { duration: 280, easing: 'cubic-bezier(.22, 1, .36, 1)' });
      });
    };
  }

  return { ref, change, toggle: () => change(closing.current || !open) };
}
