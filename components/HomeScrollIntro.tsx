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

/** Accumulated downward intent needed before navigating to intro (desktop wheel). */
const WHEEL_THRESHOLD = 260;
/** Touch path uses a lower bar so a normal phone swipe can finish. */
const TOUCH_PROGRESS_THRESHOLD = 132;
/** Ignore trackpad/wheel jitter below this (px after deltaMode scale). */
const WHEEL_MIN_DELTA = 10;
/** Cap per wheel event so one flick cannot finish the gesture alone. */
const WHEEL_MAX_STEP = 52;
/** Desktop-ish touch: long swipe still required; mobile uses the softer path. */
const TOUCH_THRESHOLD = 110;
/** Mobile / coarse pointer: shorter swipe commits more readily. */
const TOUCH_THRESHOLD_MOBILE = 48;
/** Finger must move this far up before touch progress starts (desktop touchpads). */
const TOUCH_ARM_PX = 20;
/** Mobile: arm sooner — small swipes still count. */
const TOUCH_ARM_PX_MOBILE = 8;
/** Consecutive qualifying downward events at bottom before progress starts. */
const DOWN_STREAK_NEEDED = 2;
/** After upward scroll or leaving bottom, ignore downs briefly. */
const COOLDOWN_MS = 280;
/** Shorter cooldown on phones so a second swipe is not swallowed. */
const COOLDOWN_MS_MOBILE = 120;
/** Page must be within this many px of the bottom before intro can arm. */
const BOTTOM_SLACK_PX = 16;
/** Mobile address-bar / rubber-band slack for "at bottom". */
const BOTTOM_SLACK_PX_MOBILE = 36;
/** Show the scroll hint this far from bottom on touch UIs (discoverability). */
const HINT_NEAR_BOTTOM_PX_MOBILE = 160;
/** Soft leave: one paint beat so leave chrome/ripple can mount — never wait for ripple end. */
const SOFT_NAV_PAINT_MS = 64;
const BODY_LEAVE_CLASS = 'is-home-leaving-intro';
const PORTAL_LEAVE_CLASS = 'is-leaving-to-intro';

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Phones / coarse pointers / narrow viewports — softer swipe + clearer cue. */
function prefersTouchScrollUi() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(hover: none), (pointer: coarse)').matches ||
    window.matchMedia('(max-width: 720px)').matches
  );
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

function bottomSlackPx() {
  return prefersTouchScrollUi() ? BOTTOM_SLACK_PX_MOBILE : BOTTOM_SLACK_PX;
}

/** True when the document is at (or effectively at) the bottom. */
function isAtPageBottom() {
  const { maxScroll, scrollTop } = pageScrollMetrics();
  if (maxScroll <= 4) return true;
  return scrollTop >= maxScroll - bottomSlackPx();
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
  if (maxScroll > 4 && scrollTop < maxScroll - bottomSlackPx()) return true;
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
 * Touch UIs reveal earlier (near-bottom) so swipe-into-intro is discoverable.
 */
function shouldShowScrollHint() {
  if (!pageCanScroll()) return true;
  if (!prefersTouchScrollUi()) return isAtPageBottom();
  const { maxScroll, scrollTop } = pageScrollMetrics();
  // Short mobile layouts: keep the cue visible so users know swipe-up exists.
  if (maxScroll < 96) return true;
  return scrollTop >= maxScroll - HINT_NEAR_BOTTOM_PX_MOBILE;
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

  const progressThreshold = useCallback(() => {
    return prefersTouchScrollUi() ? TOUCH_PROGRESS_THRESHOLD : WHEEL_THRESHOLD;
  }, []);

  const addProgress = useCallback(
    (amount: number) => {
      if (navigatingRef.current || amount <= 0) return;
      const threshold = progressThreshold();
      const next = Math.min(threshold, progressRef.current + amount);
      progressRef.current = next;
      setProgress(next / threshold);
      if (next >= threshold) commitNavigate();
    },
    [commitNavigate, progressThreshold]
  );

  const decayProgress = useCallback(() => {
    if (navigatingRef.current) return;
    // Moderate decay: clears accidental nudges, keeps a sustained bottom gesture.
    const threshold = progressThreshold();
    progressRef.current = Math.max(0, progressRef.current * 0.8 - 5);
    setProgress(progressRef.current / threshold);
  }, [progressThreshold]);

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
      // Soft leave in flight: keep the Soft_NAV go() timer so unmount cannot
      // cancel navigation mid-64ms paint beat. pagehide still aborts hard unloads.
      if (!navigatingRef.current) {
        window.clearTimeout(leaveTimerRef.current);
        leaveTimerRef.current = 0;
      }
      markLeavingChrome(false);
    };
  }, []);

  useEffect(() => {
    let decayTimer = 0;
    let downStreak = 0;
    let cooldownUntil = 0;
    let touchArmed = false;
    /** Sticky: once a swipe begins at bottom, rubber-band jitter must not cancel it. */
    let touchGestureFromBottom = false;
    let touchLastY: number | null = null;

    const resetProgress = () => {
      downStreak = 0;
      touchArmed = false;
      touchGestureFromBottom = false;
      touchLastY = null;
      if (progressRef.current === 0) return;
      progressRef.current = 0;
      setProgress(0);
    };

    const armCooldown = () => {
      const cool = prefersTouchScrollUi() ? COOLDOWN_MS_MOBILE : COOLDOWN_MS;
      cooldownUntil = performance.now() + cool;
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
        touchGestureFromBottom = false;
        touchLastY = null;
        return;
      }
      touchStartY.current = event.touches[0].clientY;
      touchLastY = event.touches[0].clientY;
      touchArmed = false;
      touchGestureFromBottom = !shouldBlockIntroGesture();
    };

    const onTouchMove = (event: TouchEvent) => {
      if (navigatingRef.current || touchStartY.current == null || event.touches.length !== 1) return;
      if (isNestedScrollableTarget(event.target, 1)) return;
      // Rubber-band can briefly leave "bottom"; keep a gesture that started there.
      if (!touchGestureFromBottom) {
        if (shouldBlockIntroGesture()) {
          resetProgress();
          return;
        }
        touchGestureFromBottom = true;
      }
      if (performance.now() < cooldownUntil) return;
      const currentY = event.touches[0].clientY;
      const swipeUp = touchStartY.current - currentY;
      const mobile = prefersTouchScrollUi();
      const armPx = mobile ? TOUCH_ARM_PX_MOBILE : TOUCH_ARM_PX;
      // Ignore small finger jitter; only arm after a deliberate upward drag.
      if (swipeUp < armPx) {
        touchLastY = currentY;
        return;
      }
      touchArmed = true;
      const lastY = touchLastY == null ? touchStartY.current : touchLastY;
      const deltaUp = Math.max(0, lastY - currentY);
      touchLastY = currentY;
      if (deltaUp <= 0) return;
      // Mobile: count nearly full finger travel; desktop touch stays conservative.
      const scale = mobile ? 1.15 : 0.28;
      const cap = mobile ? 56 : 36;
      addProgress(Math.min(cap, deltaUp * scale));
      window.clearTimeout(decayTimer);
      decayTimer = window.setTimeout(decayProgress, mobile ? 420 : 300);
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (touchStartY.current == null) return;
      const endY = event.changedTouches[0]?.clientY;
      const startY = touchStartY.current;
      const fromBottom = touchGestureFromBottom;
      touchStartY.current = null;
      touchLastY = null;
      touchGestureFromBottom = false;
      if (endY == null || navigatingRef.current) return;
      if (!fromBottom && shouldBlockIntroGesture()) {
        resetProgress();
        return;
      }
      const swipeUp = startY - endY;
      const mobile = prefersTouchScrollUi();
      const threshold = mobile ? TOUCH_THRESHOLD_MOBILE : TOUCH_THRESHOLD;
      const cancelPx = mobile ? 22 : 36;
      // Mobile: a clear upward flick at bottom finishes even if move events were sparse.
      if (swipeUp >= threshold && touchArmed && (mobile || progressRef.current >= WHEEL_THRESHOLD * 0.3)) {
        addProgress(progressThreshold());
      } else if (mobile && swipeUp >= threshold * 1.25 && fromBottom) {
        addProgress(progressThreshold());
      } else if (swipeUp < cancelPx) {
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
  }, [addProgress, decayProgress, progressThreshold]);

  const [mounted, setMounted] = useState(false);
  const [hintVisible, setHintVisible] = useState(true);
  const [touchUi, setTouchUi] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mqCoarse = window.matchMedia('(hover: none), (pointer: coarse)');
    const mqNarrow = window.matchMedia('(max-width: 720px)');
    const sync = () => setTouchUi(mqCoarse.matches || mqNarrow.matches);
    sync();
    mqCoarse.addEventListener('change', sync);
    mqNarrow.addEventListener('change', sync);
    return () => {
      mqCoarse.removeEventListener('change', sync);
      mqNarrow.removeEventListener('change', sync);
    };
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
        !hintVisible && !leaving ? 'is-awaiting-bottom' : '',
        touchUi ? 'is-touch-ui' : ''
      ]
        .filter(Boolean)
        .join(' ')}
      data-progress={progress.toFixed(2)}
      data-hint-visible={hintVisible ? '1' : '0'}
      data-touch-ui={touchUi ? '1' : '0'}
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
        <span className="wiki-home-scroll-intro-label">
          {touchUi ? labels.touchAffordance : labels.affordance}
        </span>
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
