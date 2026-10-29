'use client';

/**
 * Soft scroll / wheel / touch affordance on the homepage that navigates to the
 * configured introduction page (see lib/site-home-intro.ts).
 * Does not intercept clicks on the three-state wordmark button.
 */

import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { WikiLink } from '@/components/WikiLink';
import {
  HOME_SCROLL_INTRO_BY_LANG,
  homeScrollIntroLabels
} from '@/lib/site-home-intro';

type Language = 'en' | 'zh';

type Props = {
  language: Language;
  withBasePath: (pathname: string) => string;
};

const WHEEL_THRESHOLD = 160;
const TOUCH_THRESHOLD = 90;
/** Soft leave: fade + upward drift before route change. */
const SOFT_DELAY_MS = 780;
const BODY_LEAVE_CLASS = 'is-home-leaving-intro';
const PORTAL_LEAVE_CLASS = 'is-leaving-to-intro';

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function markLeavingChrome(active: boolean) {
  if (typeof document === 'undefined') return;
  document.body.classList.toggle(BODY_LEAVE_CLASS, active);
  document.querySelectorAll('.wiki-portal').forEach((node) => {
    node.classList.toggle(PORTAL_LEAVE_CLASS, active);
  });
  document.querySelectorAll('.site-character-ocean').forEach((node) => {
    node.classList.toggle(PORTAL_LEAVE_CLASS, active);
  });
}

function isNestedScrollableTarget(target: EventTarget | null, deltaY: number) {
  let node = target instanceof Element ? target : null;
  while (node && node !== document.body) {
    if (node instanceof HTMLElement) {
      const style = getComputedStyle(node);
      if (/auto|scroll/.test(style.overflowY)) {
        const canDown = node.scrollTop + node.clientHeight < node.scrollHeight - 1;
        const canUp = node.scrollTop > 1;
        if ((deltaY > 0 && canDown) || (deltaY < 0 && canUp)) return true;
      }
    }
    node = node.parentElement;
  }
  return false;
}

export function HomeScrollIntro({ language, withBasePath }: Props) {
  const router = useRouter();
  const labels = homeScrollIntroLabels[language];
  const destination = HOME_SCROLL_INTRO_BY_LANG[language];
  const href = withBasePath(destination.path);
  const progressRef = useRef(0);
  const navigatingRef = useRef(false);
  const touchStartY = useRef<number | null>(null);
  const leaveTimerRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);

  const commitNavigate = useCallback(() => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    setLeaving(true);
    const reduce = prefersReducedMotion();
    markLeavingChrome(true);
    const go = () => {
      try {
        router.push(href);
      } catch {
        window.location.assign(href);
      }
    };
    if (reduce) {
      go();
      return;
    }
    window.clearTimeout(leaveTimerRef.current);
    leaveTimerRef.current = window.setTimeout(go, SOFT_DELAY_MS);
  }, [href, router]);

  const onHintClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
        return;
      }
      event.preventDefault();
      commitNavigate();
    },
    [commitNavigate]
  );

  const addProgress = useCallback(
    (amount: number) => {
      if (navigatingRef.current || amount <= 0) return;
      const next = Math.min(WHEEL_THRESHOLD, progressRef.current + amount);
      progressRef.current = next;
      setProgress(next / WHEEL_THRESHOLD);
      if (next >= WHEEL_THRESHOLD) commitNavigate();
    },
    [commitNavigate]
  );

  const decayProgress = useCallback(() => {
    if (navigatingRef.current) return;
    progressRef.current = Math.max(0, progressRef.current * 0.82 - 4);
    setProgress(progressRef.current / WHEEL_THRESHOLD);
  }, []);

  useEffect(() => {
    try {
      router.prefetch(href);
    } catch {
      /* ignore */
    }
  }, [href, router]);

  useEffect(() => {
    return () => {
      window.clearTimeout(leaveTimerRef.current);
      markLeavingChrome(false);
    };
  }, []);

  useEffect(() => {
    let decayTimer = 0;

    const onWheel = (event: WheelEvent) => {
      if (navigatingRef.current) return;
      if (event.ctrlKey || event.defaultPrevented) return;
      if (!event.deltaY || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      if (event.deltaY <= 0) {
        progressRef.current = 0;
        setProgress(0);
        return;
      }
      if (isNestedScrollableTarget(event.target, event.deltaY)) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest('.wiki-portal-name-button')) return;

      const delta =
        event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1);
      addProgress(Math.min(80, Math.abs(delta)));
      window.clearTimeout(decayTimer);
      decayTimer = window.setTimeout(decayProgress, 280);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (navigatingRef.current || event.touches.length !== 1) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest('.wiki-portal-name-button')) {
        touchStartY.current = null;
        return;
      }
      touchStartY.current = event.touches[0].clientY;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (navigatingRef.current || touchStartY.current == null || event.touches.length !== 1) return;
      if (isNestedScrollableTarget(event.target, 1)) return;
      const currentY = event.touches[0].clientY;
      const swipeUp = touchStartY.current - currentY;
      if (swipeUp > 12) {
        addProgress(Math.min(40, swipeUp * 0.35));
        window.clearTimeout(decayTimer);
        decayTimer = window.setTimeout(decayProgress, 320);
      }
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (touchStartY.current == null) return;
      const endY = event.changedTouches[0]?.clientY;
      const startY = touchStartY.current;
      touchStartY.current = null;
      if (endY == null || navigatingRef.current) return;
      const swipeUp = startY - endY;
      if (swipeUp >= TOUCH_THRESHOLD) addProgress(WHEEL_THRESHOLD);
    };

    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.clearTimeout(decayTimer);
    };
  }, [addProgress, decayProgress]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const node = (
    <div
      className={[
        'wiki-home-scroll-intro',
        leaving ? 'is-leaving' : '',
        progress > 0.08 ? 'is-armed' : ''
      ]
        .filter(Boolean)
        .join(' ')}
      data-progress={progress.toFixed(2)}
      style={{ ['--home-scroll-progress' as string]: String(progress) }}
    >
      <WikiLink
        aria-label={labels.action}
        className="wiki-home-scroll-intro-link"
        href={href}
        onClick={onHintClick}
        title={labels.action}
        titleMorphOrigin="chrome"
        titleMorphSlug={destination.slug}
      >
        <span aria-hidden="true" className="wiki-home-scroll-intro-chevron" />
        <span className="wiki-home-scroll-intro-label">{labels.affordance}</span>
      </WikiLink>
      <span aria-live="polite" className="wiki-home-scroll-intro-status">
        {leaving ? labels.progress : ''}
      </span>
    </div>
  );

  // Portal to body so position:fixed pins to the homepage viewport, not a
  // transformed / filtered wiki-portal or shell ancestor.
  if (!mounted || typeof document === 'undefined') return null;
  return createPortal(node, document.body);
}
