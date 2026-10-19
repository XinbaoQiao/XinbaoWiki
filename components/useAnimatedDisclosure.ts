'use client';

import { useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';

/** Keep native details semantics, but commit content before measuring its opening size. */
export function useAnimatedDisclosure(open: boolean, commit: (open: boolean) => void) {
  const ref = useRef<HTMLDetailsElement>(null);
  const animation = useRef<Animation | null>(null);
  const closing = useRef(false);
  useEffect(() => () => { animation.current?.cancel(); }, []);

  function change(next: boolean) {
    const element = ref.current;
    if (!element) { commit(next); return; }
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
    const current = element.animate([{ height: `${start}px`, overflow: 'clip' }, { height: `${end}px`, overflow: 'clip' }], {
      duration: 260, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'both'
    });
    animation.current = current;
    current.onfinish = () => {
      if (animation.current !== current) return;
      if (!next) flushSync(() => commit(false));
      closing.current = false;
      current.cancel();
      animation.current = null;
    };
  }

  return { ref, change, toggle: () => change(closing.current || !open) };
}
