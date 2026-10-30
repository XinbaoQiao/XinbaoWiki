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
import { abortHomeLeaveRipple, playHomeLeaveRipple } from '@/lib/home-leave-ripple';

type Language = 'en' | 'zh';

type Props = {
  language: Language;
  withBasePath: (pathname: string) => string;
};

/** Accumulated downward intent needed before navigating to intro. */
const WHEEL_THRESHOLD = 260;
/** Ignore trackpad/wheel jitter below this (px after deltaMode scale). */
const WHEEL_MIN_DELTA = 10;
/** Cap per wheel event so one flick cannot finish the gesture alone. */
const WHEEL_MAX_STEP = 52;
/** Touch swipe distance (px up) that counts as a strong leave intent. */
const TOUCH_THRESHOLD = 110;
/** Consecutive qualifying downward events at bottom before progress starts. */
const DOWN_STREAK_NEEDED = 2;
/** After upward scroll or leaving bottom, ignore downs briefly. */
const COOLDOWN_MS = 280;
/** Page must be within this many px of the bottom before intro can arm. */
const BOTTOM_SLACK_PX = 16;
/** Soft leave: one paint beat so leave chrome/ripple can mount — never wait for ripple end. */
const SOFT_NAV_PAINT_MS = 64;
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
        const max = node.scrollHeight - node.clientHeight;
        if (max > 0.5) {
          const canDown = node.scrollTop < max - 0.5;
          const canUp = node.scrollTop > 0.5;
          if ((deltaY > 0 && canDown) || (deltaY < 0 && canUp)) return true;
        }
      }
    }
    node = node.parentElement;
  }
  return false;
}

/** True while wheel/touch is over the portal updates scroller (even at its edge). */
function isOverPortalUpdatesWindow(target: EventTarget | null) {
  return Boolean(target instanceof Element && target.closest('.wiki-portal-updates-window'));
}

/** Top-level portal sections only (Browse / News / Activity) — not nested
 *  details like PaperAcceptancePreview, which can stay [open] while News is closed.
 */
const PORTAL_SECTION_OPEN_SELECTOR =
  '#portal-directory[open], #portal-news[open], #portal-activity[open]';

function hasOpenPortalSection() {
  return Boolean(document.querySelector(PORTAL_SECTION_OPEN_SELECTOR));
}

function pageScrollMetrics() {
  const scrolling = document.scrollingElement || document.documentElement;
  const maxScroll = Math.max(0, scrolling.scrollHeight - scrolling.clientHeight);
  return { scrolling, maxScroll, scrollTop: scrolling.scrollTop };
}

function pageCanScroll() {
  return pageScrollMetrics().maxScroll > 4;
}

/** True when the document is at (or effectively at) the bottom. */
function isAtPageBottom() {
  const { maxScroll, scrollTop } = pageScrollMetrics();
  if (maxScroll <= 4) return true;
  return scrollTop >= maxScroll - BOTTOM_SLACK_PX;
}

/**
 * When a portal section is expanded, defer intro until the user has scrolled
 * to the very bottom of the page / expanded content (not mid-scroll).
 * Collapsed portal: also require page bottom when the page can scroll.
 */
function shouldDeferIntroForOpenPortal() {
  if (!hasOpenPortalSection()) return false;
  const { maxScroll, scrollTop } = pageScrollMetrics();
  // Still room to scroll the page → keep reading expanded content.
  if (maxScroll > 4 && scrollTop < maxScroll - BOTTOM_SLACK_PX) return true;
  // Already at document bottom: allow leave even if a tall open section's
  // bounding box still extends past the viewport (that used to soft-lock intro).
  return false;
}

/** Unified gate: do not arm intro until the user is clearly past portal content. */
function shouldBlockIntroGesture() {
  if (shouldDeferIntroForOpenPortal()) return true;
  // Collapsed but page still scrolls (tall chrome / ocean): require bottom first.
  if (!hasOpenPortalSection() && pageCanScroll() && !isAtPageBottom()) return true;
  return false;
}

/**
 * Fixed hint sits on the viewport bottom. When page content is taller than the
 * viewport, that spot overlays mid-content — hide until the user reaches the
 * very bottom (same slack as the intro gesture gate).
 */
function shouldShowScrollHint() {
  if (!pageCanScroll()) return true;
  return isAtPageBottom();
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
    if (!reduce) playHomeLeaveRipple();
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
    leaveTimerRef.current = window.setTimeout(go, SOFT_NAV_PAINT_MS);
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
    // Moderate decay: clears accidental nudges, keeps a sustained bottom gesture.
    progressRef.current = Math.max(0, progressRef.current * 0.8 - 5);
    setProgress(progressRef.current / WHEEL_THRESHOLD);
  }, []);

  useEffect(() => {
    let idleHandle: number | null = null;
    let timeoutHandle = 0;
    const run = () => {
      try {
        router.prefetch(href);
      } catch {
        /* ignore */
      }
    };
    if (typeof window.requestIdleCallback === "function") {
      idleHandle = window.requestIdleCallback(run, { timeout: 2200 });
    } else {
      timeoutHandle = window.setTimeout(run, 900);
    }
    return () => {
      if (idleHandle !== null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle) window.clearTimeout(timeoutHandle);
    };
  }, [href, router]);

  useEffect(() => {
    const abortLeave = () => {
      window.clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = 0;
      if (navigatingRef.current) {
        navigatingRef.current = false;
        setLeaving(false);
      }
      markLeavingChrome(false);
      abortHomeLeaveRipple();
    };
    // Tab close / bfcache: drop leave chrome + body-owned ripple.
    // Route unmount must NOT abort the ripple — it keeps playing over the next page.
    window.addEventListener("pagehide", abortLeave);
    return () => {
      window.removeEventListener("pagehide", abortLeave);
      window.clearTimeout(leaveTimerRef.current);
      markLeavingChrome(false);
    };
  }, []);

  useEffect(() => {
    let decayTimer = 0;
    let downStreak = 0;
    let cooldownUntil = 0;
    let touchArmed = false;

    const resetProgress = () => {
      downStreak = 0;
      touchArmed = false;
      if (progressRef.current === 0) return;
      progressRef.current = 0;
      setProgress(0);
    };

    const armCooldown = () => {
      cooldownUntil = performance.now() + COOLDOWN_MS;
      downStreak = 0;
    };

    const onWheel = (event: WheelEvent) => {
      if (navigatingRef.current) return;
      if (event.ctrlKey || event.defaultPrevented) return;
      if (!event.deltaY || Math.abs(event.deltaX) > Math.abs(event.deltaY) * 1.25) return;

      if (event.deltaY <= 0) {
        // Upward intent cancels any pending leave and starts a short cooldown.
        resetProgress();
        armCooldown();
        return;
      }

      // Updates region uses page scroll only; while a portal section is open and
      // content can still scroll, never compete with that continuous scroll for intro.
      if (isNestedScrollableTarget(event.target, event.deltaY)) return;
      if (isOverPortalUpdatesWindow(event.target) && shouldDeferIntroForOpenPortal()) {
        resetProgress();
        return;
      }
      if (shouldBlockIntroGesture()) {
        resetProgress();
        return;
      }
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest('.wiki-portal-name-button')) return;

      const now = performance.now();
      if (now < cooldownUntil) return;

      const delta =
        event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1);
      const magnitude = Math.abs(delta);
      // Tiny trackpad jitter: ignore entirely (do not arm streak).
      if (magnitude < WHEEL_MIN_DELTA) return;

      downStreak += 1;
      // Require several clear downward ticks at the bottom before progress builds.
      if (downStreak < DOWN_STREAK_NEEDED) {
        window.clearTimeout(decayTimer);
        decayTimer = window.setTimeout(decayProgress, 300);
        return;
      }

      // Collapsed unscrollable landing: mild penalty only (still reachable).
      const stepScale = pageCanScroll() ? 1 : 0.9;
      addProgress(Math.min(WHEEL_MAX_STEP, magnitude * 0.65) * stepScale);
      window.clearTimeout(decayTimer);
      decayTimer = window.setTimeout(decayProgress, 300);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (navigatingRef.current || event.touches.length !== 1) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest('.wiki-portal-name-button')) {
        touchStartY.current = null;
        touchArmed = false;
        return;
      }
      touchStartY.current = event.touches[0].clientY;
      touchArmed = false;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (navigatingRef.current || touchStartY.current == null || event.touches.length !== 1) return;
      if (isNestedScrollableTarget(event.target, 1)) return;
      if (shouldBlockIntroGesture()) {
        resetProgress();
        return;
      }
      if (performance.now() < cooldownUntil) return;
      const currentY = event.touches[0].clientY;
      const swipeUp = touchStartY.current - currentY;
      // Ignore small finger jitter; only arm after a deliberate upward drag.
      if (swipeUp < 20) return;
      touchArmed = true;
      addProgress(Math.min(36, (swipeUp - 20) * 0.28));
      window.clearTimeout(decayTimer);
      decayTimer = window.setTimeout(decayProgress, 300);
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (touchStartY.current == null) return;
      const endY = event.changedTouches[0]?.clientY;
      const startY = touchStartY.current;
      touchStartY.current = null;
      if (endY == null || navigatingRef.current) return;
      if (shouldBlockIntroGesture()) {
        resetProgress();
        return;
      }
      const swipeUp = startY - endY;
      // Never dump the full threshold on touchend — require a long swipe AND prior arming.
      if (swipeUp >= TOUCH_THRESHOLD && touchArmed && progressRef.current >= WHEEL_THRESHOLD * 0.3) {
        addProgress(WHEEL_THRESHOLD);
      } else if (swipeUp < 36) {
        resetProgress();
        armCooldown();
      }
      touchArmed = false;
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
  const [hintVisible, setHintVisible] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let raf = 0;
    const sync = () => {
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(() => {
        setHintVisible(shouldShowScrollHint());
      });
    };
    sync();
    window.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync, { passive: true });

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(sync) : null;
    ro?.observe(document.documentElement);
    const portal = document.querySelector('.wiki-portal');
    if (portal) ro?.observe(portal);

    // Portal section open/close changes page height without always scrolling.
    const mo = typeof MutationObserver !== 'undefined' ? new MutationObserver(sync) : null;
    const moRoot = portal || document.body;
    mo?.observe(moRoot, { subtree: true, attributes: true, attributeFilter: ['open'] });

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
      ro?.disconnect();
      mo?.disconnect();
    };
  }, []);

  const node = (
    <div
      className={[
        'wiki-home-scroll-intro',
        leaving ? 'is-leaving' : '',
        progress > 0.08 ? 'is-armed' : '',
        !hintVisible && !leaving ? 'is-awaiting-bottom' : ''
      ]
        .filter(Boolean)
        .join(' ')}
      data-progress={progress.toFixed(2)}
      data-hint-visible={hintVisible ? '1' : '0'}
      aria-hidden={!hintVisible && !leaving ? true : undefined}
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
        <span aria-hidden="true" className="wiki-home-scroll-intro-chevron">
          <svg
            className="wiki-home-scroll-intro-chevron-svg"
            viewBox="0 0 14 10"
            width="14"
            height="10"
            shapeRendering="crispEdges"
            focusable="false"
          >
            {/* 4px-grid pixel V, matches ocean ripple PIXEL=4 chunk */}
            <path
              fill="currentColor"
              d="M0 0h2v2H0zm12 0h2v2h-2zM2 2h2v2H2zm8 0h2v2h-2zM4 4h2v2H4zm4 0h2v2H8zM6 6h2v2H6z"
            />
          </svg>
        </span>
        <span className="wiki-home-scroll-intro-label">{labels.affordance}</span>
      </WikiLink>
      <span aria-live="polite" className="wiki-home-scroll-intro-status">
        {leaving ? labels.progress : ''}
      </span>
    </div>
  );

  // Portal affordance to body so position:fixed pins to the homepage viewport.
  // Leave ripple is mounted imperatively on document.body (playHomeLeaveRipple)
  // so it survives this component's unmount after router.push.
  if (!mounted || typeof document === 'undefined') return null;
  return createPortal(node, document.body);
}
