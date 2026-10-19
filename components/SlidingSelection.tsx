'use client';

import { useCallback, useLayoutEffect, useRef, type ComponentPropsWithoutRef } from 'react';

type Props = ComponentPropsWithoutRef<'div'>;
type Selection = { button: HTMLButtonElement; x: number; y: number; width: number; height: number };

/** A shared moving highlight; the child buttons retain their native interaction. */
export function SlidingSelection({ children, className, ...props }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const previousRef = useRef<Selection | null>(null);

  const alignSelection = useCallback((allowMotion: boolean) => {
    const root = rootRef.current;
    if (!root) return;
    const button = root.querySelector<HTMLButtonElement>(':scope > button[aria-pressed="true"]');
    if (!button || !button.getClientRects().length || !button.offsetWidth) {
      previousRef.current = null;
      delete root.dataset.selectionReady;
      return;
    }

    const bounds = button.getBoundingClientRect();
    const container = root.getBoundingClientRect();
    const next = {
      button,
      x: bounds.left - container.left - root.clientLeft,
      y: bounds.top - container.top - root.clientTop,
      width: bounds.width,
      height: bounds.height
    };
    const previous = previousRef.current;
    if (previous && previous.button === button &&
      previous.x === next.x && previous.y === next.y &&
      previous.width === next.width && previous.height === next.height) return;

    // Animate a new selection, but snap initialization, disclosure opening and resizing.
    root.style.setProperty('--selection-duration', allowMotion && previous && previous.button !== button ? '320ms' : '0ms');
    root.style.setProperty('--selection-x', `${next.x}px`);
    root.style.setProperty('--selection-y', `${next.y}px`);
    root.style.setProperty('--selection-width', `${next.width}px`);
    root.style.setProperty('--selection-height', `${next.height}px`);
    root.dataset.selectionReady = '';
    previousRef.current = next;
  }, []);

  useLayoutEffect(() => { alignSelection(true); });

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new ResizeObserver(() => alignSelection(false));
    observer.observe(root);
    root.querySelectorAll(':scope > button').forEach(button => observer.observe(button));
    return () => observer.disconnect();
  }, [alignSelection]);

  return <div {...props} className={['wiki-sliding-selection', className].filter(Boolean).join(' ')} ref={rootRef}>{children}</div>;
}
