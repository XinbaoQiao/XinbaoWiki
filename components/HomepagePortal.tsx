'use client';

import dynamic from 'next/dynamic';
import { WikiLink } from '@/components/WikiLink';
import { wikiSlugFromHref } from '@/lib/wiki-view-transition';
import type { CSSProperties, PointerEvent as ReactPointerEvent, TransitionEvent as ReactTransitionEvent } from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { WikiSearch, type SearchLanguage } from '@/components/WikiSearch';
import { getRecentSiteUpdates } from '@/lib/site-updates';
import { SlidingSelection } from '@/components/SlidingSelection';
import {
  useAnimatedDisclosure,
  DISCLOSURE_HEIGHT_MS,
  DISCLOSURE_HEIGHT_EASE,
  type DisclosureHeightAnimateInfo
} from '@/components/useAnimatedDisclosure';
import { HomeScrollIntro } from '@/components/HomeScrollIntro';
import type { PaperHighlightCatalog } from '@/lib/paper-highlights';

const VisitorAtlasDisclosure = dynamic(
  () => import('@/components/VisitorAtlasDisclosure').then((module) => module.VisitorAtlasDisclosure),
  { ssr: false, loading: () => null }
);

const PaperAcceptancePreview = dynamic(
  () => import('@/components/PaperAcceptancePreview').then((module) => module.PaperAcceptancePreview),
  { ssr: false, loading: () => null }
);

function preloadPortalDisclosureChunks() {
  void import('@/components/VisitorAtlasDisclosure');
  void import('@/components/PaperAcceptancePreview');
}

type LocalizedText = Record<SearchLanguage, string>;
type BrowseView = 'list' | 'cube';
type UpdatesView = 'compact' | 'detailed';
type CubeFace = 'top' | 'front' | 'right';
type TouchCubeAngle = 'top' | 'front' | 'right';
type PortalEntry = { href: string; slug: string; summary: string; title: string };
type PortalGroup = {
  label: LocalizedText;
  links: Record<SearchLanguage, PortalEntry[]>;
};
type PortalSection = {
  title: LocalizedText;
  groups: PortalGroup[];
};
type Props = {
  directorySections: PortalSection[];
  paperHighlights: PaperHighlightCatalog;
  updatesAsOf: string;
};

const browseLabels: LocalizedText = {
  en: 'Browse Xinbaopedia',
  zh: '浏览 Xinbaopedia'
};

const browseViewLabels = {
  en: { cube: 'Cube', group: 'Browse view', list: 'List' },
  zh: { cube: '魔方', group: '浏览视图', list: '列表' }
} satisfies Record<SearchLanguage, Record<BrowseView | 'group', string>>;

const cubePinLabels = {
  en: { pin: 'Pin current face', unpin: 'Pin: unpin current face' },
  zh: { pin: 'Pin：固定当前面', unpin: 'Pin：取消固定当前面' }
} satisfies Record<SearchLanguage, { pin: string; unpin: string }>;

const cubeReturnLabels = {
  en: { label: 'Back', ariaLabel: 'Return to the initial cube' },
  zh: { label: '返回', ariaLabel: '返回初始魔方' }
} satisfies Record<SearchLanguage, { ariaLabel: string; label: string }>;

const cubeFaceNames = ['top', 'front', 'right'] as const;
const touchCubeAngles = ['top', 'front', 'right'] as const;
const cubeHoverIntentMs = 150;
const touchCubeDragThresholdPx = 10;
const touchCubeSwipeThresholdPx = 34;

type TouchCubeGesture = {
  face: CubeFace | null;
  lastX: number;
  lastY: number;
  mode: 'pending' | 'rotate' | 'scroll';
  pointerId: number;
  startX: number;
  startY: number;
};


const sectionToggleLabels = {
  en: {
    collapse: 'Collapse homepage sections',
    foldExtreme: 'Show only the name Xinbao Qiao',
    restoreFolded: 'Restore the folded homepage'
  },
  zh: {
    collapse: '折叠首页板块',
    foldExtreme: '极限折叠，仅显示 Xinbao Qiao',
    restoreFolded: '恢复为折叠状态'
  }
} satisfies Record<SearchLanguage, { collapse: string; foldExtreme: string; restoreFolded: string }>;


const updateLabels = {
  en: {
    title: 'Latest Updates',
    window: 'Scrollable latest updates'
  },
  zh: {
    title: '最新动态',
    window: '可滚动的最新动态'
  }
} satisfies Record<SearchLanguage, { title: string; window: string }>;

const updatesViewLabels = {
  en: { compact: 'Compact', detailed: 'Full', group: 'Updates view' },
  zh: { compact: '紧凑', detailed: '详细', group: '动态视图' }
} satisfies Record<SearchLanguage, Record<UpdatesView | 'group', string>>;

function withBasePath(pathname: string) {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');
  return basePath ? `${basePath}${pathname}` : pathname;
}

export function HomepagePortal({ directorySections, paperHighlights, updatesAsOf }: Props) {
  const [language, setLanguage] = useState<SearchLanguage>('en');
  const [updatesAsOfDate, setUpdatesAsOfDate] = useState(updatesAsOf);
  const [browseView, setBrowseView] = useState<BrowseView>('list');
  const [activeCubeFace, setActiveCubeFace] = useState<CubeFace | null>(null);
  const [cubeFaceSettled, setCubeFaceSettled] = useState(false);
  const [pinnedCubeFace, setPinnedCubeFace] = useState<CubeFace | null>(null);
  const [touchCubeAngle, setTouchCubeAngle] = useState<TouchCubeAngle>('front');
  const [touchCubeDragging, setTouchCubeDragging] = useState(false);
  const [touchCubeDragDegrees, setTouchCubeDragDegrees] = useState(0);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [newsOpen, setNewsOpen] = useState(false);
  const [updatesView, setUpdatesView] = useState<UpdatesView>('compact');
  const [acceptanceResetKey, setAcceptanceResetKey] = useState(0);
  const [activityOpen, setActivityOpen] = useState(false);
  const cubeHoverIntentRef = useRef<number | null>(null);
  const cubeStageRef = useRef<HTMLDivElement>(null);
  const touchCubeGestureRef = useRef<TouchCubeGesture | null>(null);
  const collapsibleSections = { activity: activityOpen, browse: browseOpen, news: newsOpen };
  const allSectionsClosed = Object.values(collapsibleSections).every((open) => !open);
  const [layoutMode, setLayoutMode] = useState<'expanded' | 'collapsed' | 'nameOnly'>('collapsed');
  /** Keep PaperAcceptance mounted after first open / name-only so re-open is instant. */
  const [acceptanceWarm, setAcceptanceWarm] = useState(false);
  const portalRef = useRef<HTMLElement>(null);
  const layoutFlipFromRef = useRef<DOMRect | null>(null);
  const layoutFlipAnimRef = useRef<Animation | null>(null);
  const portalCenterAnimRef = useRef<Animation | null>(null);
  const layoutModeRef = useRef(layoutMode);
  layoutModeRef.current = layoutMode;
  const openFlagsRef = useRef({ news: newsOpen, browse: browseOpen, activity: activityOpen });
  openFlagsRef.current = { news: newsOpen, browse: browseOpen, activity: activityOpen };

  const readTranslateY = (el: HTMLElement) => {
    const transform = getComputedStyle(el).transform;
    if (!transform || transform === 'none') return 0;
    try {
      return new DOMMatrixReadOnly(transform).m42;
    } catch {
      return 0;
    }
  };

  const computeCollapsedCenterY = (portal: HTMLElement, heightOverride?: number) => {
    const height = heightOverride ?? portal.getBoundingClientRect().height;
    if (height <= 0) return 0;
    const currentY = readTranslateY(portal);
    const layoutTop = portal.getBoundingClientRect().top - currentY;
    const desiredTop = Math.max(0, (window.innerHeight - height) / 2);
    return Math.max(0, desiredTop - layoutTop);
  };

  const portalCenterRafRef = useRef<number | null>(null);
  const stopPortalCenterSync = () => {
    if (portalCenterRafRef.current != null) {
      cancelAnimationFrame(portalCenterRafRef.current);
      portalCenterRafRef.current = null;
    }
  };

  const shouldCenterPortal = (height: number) => {
    // Center only at page top while the portal still fits the viewport.
    // Expanded+short (e.g. Site activity before atlas load) must KEEP center —
    // forcing transform none on open is the systemic jump-to-top. Once the
    // portal is taller than the viewport, or the page is scrolled, never center.
    if (layoutModeRef.current === 'nameOnly') return false;
    const scrolling = document.scrollingElement || document.documentElement;
    if (scrolling.scrollTop > 1) return false;
    return height < window.innerHeight - 8;
  };

  const applyPortalCenterForHeight = (portal: HTMLElement, height: number) => {
    if (!shouldCenterPortal(height)) {
      portal.style.transform = 'none';
      return 0;
    }
    const y = computeCollapsedCenterY(portal, height);
    portal.style.transform = y === 0 ? 'none' : `translateY(${y}px)`;
    return y;
  };

  /** Drop translateY without a visual jump: fold the offset into scrollTop.
   *  translateY(+y) shifts the portal down; clearing it shifts visual up by y.
   *  Compensate by decreasing scrollTop (content moves down in the viewport).
   *  When scrollTop is already 0, fold cannot preserve — caller must ease/sync Y. */
  const clearPortalCenterPreservingView = (
    portal: HTMLElement,
    scrolling: Element,
    scrollBefore: number
  ) => {
    const y = readTranslateY(portal);
    portal.style.transform = 'none';
    if (Math.abs(y) > 0.5) {
      scrolling.scrollTop = Math.max(0, scrollBefore - y);
    }
    return scrolling.scrollTop;
  };

  const onPortalHeightAnimate = useCallback((info: DisclosureHeightAnimateInfo) => {
    if (layoutModeRef.current === 'nameOnly') return;
    const portal = portalRef.current;
    if (!portal) return;
    stopPortalCenterSync();
    portalCenterAnimRef.current?.cancel();
    portalCenterAnimRef.current = null;

    const flags = openFlagsRef.current;
    const openCount = [flags.news, flags.browse, flags.activity].filter(Boolean).length;
    const closingLast = !info.next && openCount <= 1;
    const shouldTrack = info.next || closingLast;
    if (!shouldTrack) return;

    portal.dataset.measuredLayout = '';

    const scrolling = document.scrollingElement || document.documentElement;
    let scrollBefore = scrolling.scrollTop;
    const pageScrolled = scrollBefore > 1;

    const pinScrollForDuration = (pinnedScroll: number, duration: number, onDone: () => void) => {
      const started = performance.now();
      const pin = () => {
        if (Math.abs(scrolling.scrollTop - pinnedScroll) > 0.5) {
          scrolling.scrollTop = pinnedScroll;
        }
        if (performance.now() - started < duration + 48) {
          portalCenterRafRef.current = requestAnimationFrame(pin);
          return;
        }
        portalCenterRafRef.current = null;
        onDone();
      };
      portalCenterRafRef.current = requestAnimationFrame(pin);
    };

    const settleOpen = () => {
      const el = portalRef.current;
      stopPortalCenterSync();
      portalCenterAnimRef.current = null;
      if (!el) return;
      if (layoutModeRef.current !== 'nameOnly') {
        const needsMode = layoutModeRef.current !== 'expanded';
        layoutModeRef.current = 'expanded';
        if (needsMode) setLayoutMode('expanded');
      }
      applyPortalCenterForHeight(el, el.getBoundingClientRect().height);
      if (el.dataset.measuredLayout === '') delete el.dataset.measuredLayout;
    };

    const settleClose = () => {
      const el = portalRef.current;
      stopPortalCenterSync();
      portalCenterAnimRef.current = null;
      if (!el) return;
      if (layoutModeRef.current !== 'nameOnly') {
        const needsMode = layoutModeRef.current !== 'collapsed';
        layoutModeRef.current = 'collapsed';
        if (needsMode) setLayoutMode('collapsed');
      }
      applyPortalCenterForHeight(el, el.getBoundingClientRect().height);
      if (el.dataset.measuredLayout === '') delete el.dataset.measuredLayout;
    };

    const portalH0 = portal.getBoundingClientRect().height;
    const portalH1 = portalH0 - info.startHeight + info.endHeight;

    // Scrolled page: never fight the user. Fold any leftover center into scroll
    // (correct direction: scrollTop -= y) and pin while height WAAPI runs.
    if (pageScrolled) {
      scrollBefore = clearPortalCenterPreservingView(portal, scrolling, scrollBefore);
      if (info.reducedMotion || info.duration <= 0) {
        if (info.next) settleOpen();
        else settleClose();
        return;
      }
      pinScrollForDuration(scrolling.scrollTop, info.duration + 120, () => {
        if (info.next) settleOpen();
        else settleClose();
      });
      return;
    }

    // Landing (scrollTop ~ 0): on OPEN hold current center offset through the
    // height WAAPI so the portal grows downward and the clicked summary stays.
    // Settling then applies shouldCenter for the final height. On CLOSE, sync Y
    // with height to ease back to the landing center.
    const currentY = readTranslateY(portal);
    const layoutTop = portal.getBoundingClientRect().top - currentY;
    const yForHeight = (h: number) => {
      const desiredTop = Math.max(0, (window.innerHeight - h) / 2);
      return Math.max(0, desiredTop - layoutTop);
    };

    if (info.reducedMotion || info.duration <= 0 || !portal.animate) {
      applyPortalCenterForHeight(portal, portalH1);
      if (info.next) settleOpen();
      else settleClose();
      return;
    }

    const steps = 16;
    const keyframes: Keyframe[] = [];
    for (let i = 0; i <= steps; i += 1) {
      const progress = i / steps;
      const h = portalH0 + (portalH1 - portalH0) * progress;
      // Open: hold Y so portal grows downward (summary stays). Close: track center.
      const y = info.next ? currentY : yForHeight(h);
      keyframes.push({
        offset: progress,
        transform: y === 0 ? 'translateY(0px)' : `translateY(${y}px)`
      });
    }

    const anim = portal.animate(keyframes, {
      duration: info.duration,
      easing: info.easing,
      fill: 'forwards'
    });
    portalCenterAnimRef.current = anim;
    // Do NOT pin scrollTop to 0. That fights focus/scroll-anchoring and forces
    // the systemic scrollTop->0 jump-to-top on every landing portal open.
    const finish = () => {
      stopPortalCenterSync();
      const el = portalRef.current;
      anim.cancel();
      portalCenterAnimRef.current = null;
      if (!el) {
        if (info.next) settleOpen();
        else settleClose();
        return;
      }
      if (!info.next) {
        applyPortalCenterForHeight(el, portalH1);
        settleClose();
        return;
      }
      const heldY = readTranslateY(el);
      const targetY = shouldCenterPortal(portalH1) ? yForHeight(portalH1) : 0;
      // After holding center through the height WAAPI, ease to the final Y
      // (0 when tall, recentered when still short). Never snap transform none.
      if (
        Math.abs(heldY - targetY) > 0.5 &&
        !info.reducedMotion &&
        typeof el.animate === 'function'
      ) {
        const release = el.animate(
          [
            { transform: `translateY(${heldY}px)` },
            { transform: targetY === 0 ? 'translateY(0px)' : `translateY(${targetY}px)` }
          ],
          { duration: Math.min(280, info.duration), easing: info.easing, fill: 'forwards' }
        );
        portalCenterAnimRef.current = release;
        const done = () => {
          applyPortalCenterForHeight(el, portalH1);
          release.cancel();
          portalCenterAnimRef.current = null;
          settleOpen();
        };
        release.onfinish = done;
        release.oncancel = () => {
          portalCenterAnimRef.current = null;
        };
        return;
      }
      applyPortalCenterForHeight(el, portalH1);
      settleOpen();
    };
    anim.onfinish = finish;
    anim.oncancel = () => {
      portalCenterAnimRef.current = null;
    };
  }, []);

  const commitNewsOpen = (open: boolean) => {
    setNewsOpen(open);
    // Native paper disclosures retain manual state until the whole feed closes.
    if (!open) {
      setUpdatesView('compact');
      setAcceptanceResetKey((key) => key + 1);
    }
  };
  const newsDisclosure = useAnimatedDisclosure(newsOpen, commitNewsOpen, { onHeightAnimate: onPortalHeightAnimate });
  const changeNewsOpen = newsDisclosure.change;
  const browseDisclosure = useAnimatedDisclosure(browseOpen, setBrowseOpen, { onHeightAnimate: onPortalHeightAnimate });
  const changeBrowseOpen = browseDisclosure.change;
  const activityDisclosure = useAnimatedDisclosure(activityOpen, setActivityOpen, { onHeightAnimate: onPortalHeightAnimate });
  const changeActivityOpen = activityDisclosure.change;

  const applyLayoutMode = (next: 'expanded' | 'collapsed' | 'nameOnly') => {
    if (next === layoutMode) return;
    // Collapsed/expanded share top-anchored shell geometry; only nameOnly recenters via place-items.
    // Collapsed vertical center is an animatable translateY synced with disclosure height.
    const needsFlip = layoutMode === 'nameOnly' || next === 'nameOnly';
    layoutFlipFromRef.current = needsFlip
      ? (portalRef.current?.getBoundingClientRect() ?? null)
      : null;
    setLayoutMode(next);
  };

  const collapseAllSections = () => {
    changeBrowseOpen(false);
    changeNewsOpen(false);
    changeActivityOpen(false);
  };
  // layoutMode collapsed/expanded is settled by onPortalHeightAnimate after height WAAPI
  // so React class flips do not contend with the first animation frames. Fallback for
  // non-animated state changes (e.g. reduced-motion already settled inside the callback).
  useEffect(() => {
    if (layoutMode === 'nameOnly') return;
    if (portalCenterAnimRef.current) return;
    // Height pin / WAAPI still running: do not flip collapsed class mid-flight.
    const portal = portalRef.current;
    if (portal?.querySelector("details[data-animated-disclosure][style*='height']")) return;
    const next = allSectionsClosed ? 'collapsed' : 'expanded';
    if (next === layoutMode) return;
    applyLayoutMode(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: only react to section open state
  }, [allSectionsClosed]);

  // Resting center (collapsed) + FLIP only when entering/leaving nameOnly (place-items cannot interpolate).
  useLayoutEffect(() => {
    const el = portalRef.current;
    const from = layoutFlipFromRef.current;
    layoutFlipFromRef.current = null;
    layoutFlipAnimRef.current?.cancel();
    layoutFlipAnimRef.current = null;
    const releaseMeasured = () => {
      if (el?.dataset.measuredLayout === "") delete el.dataset.measuredLayout;
    };
    if (!el) return;

    // Do not fight a disclosure-synced center animation mid-flight.
    if (!portalCenterAnimRef.current) {
      if (layoutMode === 'collapsed' || layoutMode === 'expanded') {
        applyPortalCenterForHeight(el, el.getBoundingClientRect().height);
      } else {
        el.style.transform = '';
      }
    }

    if (!from) {
      releaseMeasured();
      return;
    }
    el.dataset.measuredLayout = "";
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      releaseMeasured();
      return;
    }
    const to = el.getBoundingClientRect();
    const dx = from.left - to.left;
    const dy = from.top - to.top;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
      releaseMeasured();
      return;
    }
    const finalTransform = getComputedStyle(el).transform;
    const endTransform = finalTransform === "none" ? "translate(0px, 0px)" : finalTransform;
    const startTransform =
      endTransform === "translate(0px, 0px)"
        ? `translate(${dx}px, ${dy}px)`
        : `translate(${dx}px, ${dy}px) ${endTransform}`;
    const anim = el.animate(
      [{ transform: startTransform }, { transform: endTransform }],
      { duration: DISCLOSURE_HEIGHT_MS, easing: DISCLOSURE_HEIGHT_EASE, fill: "none" }
    );
    layoutFlipAnimRef.current = anim;
    anim.onfinish = releaseMeasured;
    anim.oncancel = releaseMeasured;
  }, [layoutMode]);

  // Warm disclosure JS chunks after first paint (idle) without mounting heavy UI yet —
  // preserves homepage first-load wins while making later open/restore feel instant.
  useEffect(() => {
    let idleHandle: number | null = null;
    let timeoutHandle: number | null = null;
    const warm = () => {
      preloadPortalDisclosureChunks();
      // After first paint idle: keep Latest Updates ready so restore/open is snappy.
      setAcceptanceWarm(true);
    };
    if (typeof window.requestIdleCallback === 'function') {
      idleHandle = window.requestIdleCallback(warm, { timeout: 1800 });
    } else {
      timeoutHandle = window.setTimeout(warm, 500);
    }
    return () => {
      if (idleHandle !== null && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle !== null) window.clearTimeout(timeoutHandle);
    };
  }, []);

  // Entering name-only: user already past first load — preload chunks and keep
  // PaperAcceptance mounted under the hidden disclosures so restore/open is snappy.
  useEffect(() => {
    if (layoutMode !== 'nameOnly') return;
    preloadPortalDisclosureChunks();
    setAcceptanceWarm(true);
  }, [layoutMode]);

  useEffect(() => {
    if (newsOpen) setAcceptanceWarm(true);
  }, [newsOpen]);


  // Recenter only while collapsed-at-top. Cube face turns, atlas load, and other
  // portal height changes must NOT apply translateY when expanded or scrolled.
  useEffect(() => {
    const recenter = () => {
      if (layoutModeRef.current === 'nameOnly') return;
      if (portalCenterAnimRef.current) return;
      const el = portalRef.current;
      if (!el) return;
      // Disclosure height pin / WAAPI sets will-change:height while open/close runs.
      if (el.querySelector("details[data-animated-disclosure][style*='height']")) return;
      const scrolling = document.scrollingElement || document.documentElement;
      const scrollBefore = scrolling.scrollTop;
      const yBefore = readTranslateY(el);
      const height = el.getBoundingClientRect().height;
      const centering = shouldCenterPortal(height);
      applyPortalCenterForHeight(el, height);
      // If a stale centering transform was cleared (e.g. cube reflow while expanded),
      // fold it into scrollTop so the viewport does not yank.
      if (!centering && Math.abs(yBefore) > 0.5) {
        // Same fold direction as clearPortalCenterPreservingView (scrollTop -= y).
        scrolling.scrollTop = Math.max(0, scrollBefore - yBefore);
      }
    };
    let roRaf = 0;
    const scheduleRecenter = () => {
      if (roRaf) return;
      roRaf = requestAnimationFrame(() => {
        roRaf = 0;
        recenter();
      });
    };
    window.addEventListener('resize', scheduleRecenter, { passive: true });
    const el = portalRef.current;
    let ro: ResizeObserver | null = null;
    if (el && typeof ResizeObserver !== 'undefined') {
      // Coalesce RO + resize to one rAF — height WAAPI / cube stage fire many
      // observations per frame and were causing layout thrash during expands.
      ro = new ResizeObserver(scheduleRecenter);
      ro.observe(el);
    }
    return () => {
      window.removeEventListener('resize', scheduleRecenter);
      if (roRaf) cancelAnimationFrame(roRaf);
      ro?.disconnect();
    };
  }, []);

  const cyclePortalLayout = () => {
    if (layoutMode === 'expanded' || !allSectionsClosed) {
      collapseAllSections();
      applyLayoutMode('collapsed');
      return;
    }
    if (layoutMode === 'collapsed') {
      applyLayoutMode('nameOnly');
      return;
    }
    // nameOnly -> folded (never back to full expand via this click)
    collapseAllSections();
    applyLayoutMode('collapsed');
  };
  const portalLayoutLabel =
    layoutMode === 'nameOnly'
      ? sectionToggleLabels[language].restoreFolded
      : layoutMode === 'collapsed'
        ? sectionToggleLabels[language].foldExtreme
        : sectionToggleLabels[language].collapse;
  const portalClassName = [
    'wiki-portal',
    layoutMode === 'collapsed' ? 'wiki-portal-collapsed' : '',
    layoutMode === 'nameOnly' ? 'wiki-portal-name-only' : ''
  ].filter(Boolean).join(' ');
  const recentUpdates = useMemo(
    () => getRecentSiteUpdates(language, new Date(updatesAsOfDate)),
    [language, updatesAsOfDate]
  );
  const latestUpdate = recentUpdates[0];
  const latestAcceptance = useMemo(
    () => recentUpdates.find((item) => item.papers?.length),
    [recentUpdates]
  );

  useEffect(() => {
    const refresh = () => setUpdatesAsOfDate(new Date().toISOString());
    refresh();
    const timer = window.setInterval(refresh, 60 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  }, [language]);

  useEffect(() => {
    try {
      const savedView = window.localStorage.getItem('xinbaopedia-browse-view');
      if (savedView === 'list' || savedView === 'cube') setBrowseView(savedView);
      const savedPinnedFace = window.localStorage.getItem('xinbaopedia-cube-pinned-face') as CubeFace | null;
      if (savedView === 'cube' && savedPinnedFace && cubeFaceNames.includes(savedPinnedFace)) {
        setPinnedCubeFace(savedPinnedFace);
        setActiveCubeFace(savedPinnedFace);
      }
    } catch {
      // Storage can be unavailable in privacy-restricted browsing contexts.
    }
  }, []);

  useEffect(() => () => {
    if (cubeHoverIntentRef.current !== null) window.clearTimeout(cubeHoverIntentRef.current);
  }, []);

  useEffect(() => {
    setCubeFaceSettled(false);
    if (!activeCubeFace) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setCubeFaceSettled(true);
  }, [activeCubeFace]);

  const completeCubeFaceTurn = (event: ReactTransitionEvent<HTMLDivElement>) => {
    if (!activeCubeFace || event.target !== event.currentTarget || event.propertyName !== 'transform') return;
    setCubeFaceSettled(true);
  };

  const clearCubeHoverIntent = () => {
    if (cubeHoverIntentRef.current === null) return;
    window.clearTimeout(cubeHoverIntentRef.current);
    cubeHoverIntentRef.current = null;
  };

  const scheduleCubeFace = (face: CubeFace) => {
    clearCubeHoverIntent();
    if (pinnedCubeFace || face === activeCubeFace) return;
    cubeHoverIntentRef.current = window.setTimeout(() => {
      setActiveCubeFace(face);
      cubeHoverIntentRef.current = null;
    }, cubeHoverIntentMs);
  };

  const selectBrowseView = (nextView: BrowseView) => {
    clearCubeHoverIntent();
    setBrowseView(nextView);
    setActiveCubeFace(null);
    setPinnedCubeFace(null);
    setTouchCubeAngle('front');
    try {
      window.localStorage.setItem('xinbaopedia-browse-view', nextView);
      window.localStorage.removeItem('xinbaopedia-cube-pinned-face');
    } catch {
      // The view remains usable for this session when persistence is unavailable.
    }
  };

  const togglePinnedCubeFace = (face: CubeFace) => {
    clearCubeHoverIntent();
    const nextPinnedFace = pinnedCubeFace === face ? null : face;
    setPinnedCubeFace(nextPinnedFace);
    setActiveCubeFace(face);
    try {
      if (nextPinnedFace) {
        window.localStorage.setItem('xinbaopedia-cube-pinned-face', nextPinnedFace);
      } else {
        window.localStorage.removeItem('xinbaopedia-cube-pinned-face');
      }
    } catch {
      // Pinning still works for this session when persistence is unavailable.
    }
  };

  const resetTouchCubeGesture = () => {
    touchCubeGestureRef.current = null;
    setTouchCubeDragging(false);
    setTouchCubeDragDegrees(0);
  };

  const returnTouchCubeToInitial = () => {
    clearCubeHoverIntent();
    resetTouchCubeGesture();
    setActiveCubeFace(null);
    setPinnedCubeFace(null);
    setTouchCubeAngle('front');
    try {
      window.localStorage.removeItem('xinbaopedia-cube-pinned-face');
    } catch {
      // Returning to the touch cube remains available without storage access.
    }
  };

  useEffect(() => {
    if (!activeCubeFace) return;
    const returnToCube = (event: PointerEvent) => {
      if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
      if (cubeStageRef.current?.contains(event.target as Node)) return;
      returnTouchCubeToInitial();
    };
    document.addEventListener('pointerdown', returnToCube, true);
    return () => document.removeEventListener('pointerdown', returnToCube, true);
  }, [activeCubeFace]);

  const isDirectPointer = (event: ReactPointerEvent) => event.pointerType === 'touch' || event.pointerType === 'pen';

  const beginTouchCubeGesture = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDirectPointer(event) || !event.isPrimary || browseView !== 'cube') return;
    if ((event.target as HTMLElement).closest('button')) return;
    if (activeCubeFace) {
      const targetPanel = (event.target as HTMLElement).closest<HTMLElement>('.wiki-portal-cube-panel');
      if (!targetPanel) returnTouchCubeToInitial();
      return;
    }
    const targetFace = (event.target as HTMLElement).closest<HTMLElement>('[data-cube-hover-face]')?.dataset.cubeHoverFace as CubeFace | undefined;
    touchCubeGestureRef.current = {
      face: targetFace && cubeFaceNames.includes(targetFace) ? targetFace : null,
      lastX: event.clientX,
      lastY: event.clientY,
      mode: 'pending',
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Some embedded browsers provide implicit capture without exposing the method.
    }
  };

  const moveTouchCubeGesture = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = touchCubeGestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    gesture.lastX = event.clientX;
    gesture.lastY = event.clientY;
    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;
    if (gesture.mode === 'pending') {
      if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < touchCubeDragThresholdPx) return;
      if (Math.abs(deltaY) > Math.abs(deltaX) * 1.1) {
        gesture.mode = 'scroll';
        return;
      }
      gesture.mode = 'rotate';
      setTouchCubeDragging(true);
    }
    if (gesture.mode !== 'rotate') return;
    event.preventDefault();
    setTouchCubeDragDegrees(Math.max(-15, Math.min(15, deltaX * .12)));
  };

  const finishTouchCubeGesture = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = touchCubeGestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const deltaX = gesture.lastX - gesture.startX;
    if (gesture.mode === 'rotate') {
      if (Math.abs(deltaX) >= touchCubeSwipeThresholdPx) {
        const currentIndex = touchCubeAngles.indexOf(touchCubeAngle);
        const direction = deltaX < 0 ? 1 : -1;
        setTouchCubeAngle(touchCubeAngles[(currentIndex + direction + touchCubeAngles.length) % touchCubeAngles.length]);
      }
    } else if (gesture.mode === 'pending' && gesture.face) {
      clearCubeHoverIntent();
      setActiveCubeFace(gesture.face);
    }
    resetTouchCubeGesture();
  };

  const renderPortalSectionContent = (section: PortalSection, headingId: string) => (
    <>
      <h3 id={headingId}>
        <span>{section.title[language]}</span>
      </h3>
      {section.groups.map((group) => (
        <div className="wiki-portal-group" key={group.label.en}>
          <p className="wiki-portal-group-label">{group.label[language]}</p>
          <ul>
            {group.links[language].map((item) => (
              <li key={item.href}>
                <WikiLink href={item.href} titleMorphSlug={item.slug} titleMorphDestTitle={item.title}>
                  {item.title}
                </WikiLink>
                {item.summary && <span>{item.summary}</span>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );

  return (
    <article ref={portalRef} className={portalClassName} data-page-slug="Xinbao_Qiao">
      <section className="wiki-portal-hero" aria-labelledby="portal-title">
        <div className="wiki-portal-masthead">
          <div className="wiki-portal-brand">
            <div className="wiki-portal-name-wrap">
              <h1 className="wiki-portal-name" id="portal-title">
                <span
                  aria-hidden="true"
                  className="wiki-portal-name-logos"
                  onAnimationEnd={(event) => {
                    if (event.target !== event.currentTarget) return;
                    event.currentTarget.setAttribute('data-intro-done', '');
                  }}
                >
                  <span
                    className="wiki-portal-name-logo wiki-portal-name-logo-tinted"
                    style={{
                      '--portal-wordmark-mask': `url("${withBasePath('/site-logos/wordmark/xinbao-qiao-charcoal.webp')}")`
                    } as CSSProperties}
                  />
                </span>
                <span className="wiki-portal-name-text">Xinbao Qiao</span>
              </h1>
              <button
                type="button"
                aria-controls="portal-news portal-activity portal-directory"
                aria-expanded={layoutMode === 'expanded'}
                aria-label={portalLayoutLabel}
                className="wiki-portal-name-button"
                onClick={cyclePortalLayout}
              />
            </div>
          </div>
        </div>
        <div className="wiki-portal-search">
          <WikiSearch
            language={language}
            onLanguageChange={setLanguage}
            showLanguageSelect
            variant="portal"
          />
        </div>
      </section>

      <div className="wiki-portal-disclosures">
        <details
          className="wiki-portal-news wiki-portal-timeline"
          data-updates-view={updatesView}
          id="portal-news"
          ref={newsDisclosure.ref}
          data-animated-disclosure=""
          onToggle={(event) => {
            if (event.target !== event.currentTarget) return;
            if (event.currentTarget.open !== newsOpen) changeNewsOpen(event.currentTarget.open);
          }}
          open={newsOpen}
        >
          <summary
            onMouseDown={(event) => {
              // Block native focus-scroll before click; otherwise opening a
              // below-fold summary yanks scrollTop (systemic jump).
              event.preventDefault();
            }}
            onClick={(event) => {
            event.preventDefault();
            // Keyboard activation (detail===0): keep focus for a11y.
            // Pointer clicks must NOT focus — that left the sticky focus box.
            if (event.detail === 0) {
              (event.currentTarget as HTMLElement).focus({ preventScroll: true });
            }
            newsDisclosure.toggle();
          }}>
            <span className="wiki-portal-timeline-heading">
              <strong>{updateLabels[language].title}</strong>
              <em>{recentUpdates.length} {language === 'zh' ? '条动态' : 'updates'}</em>
            </span>
            {latestUpdate && <span className="wiki-portal-news-preview">
              <time dateTime={latestUpdate.dateTime}>{latestUpdate.date}</time>
              <span>
                <b>{latestUpdate.title}</b>
                <small>{latestUpdate.detail}</small>
              </span>
            </span>}
          </summary>
          <div className="wiki-portal-view-switcher wiki-portal-updates-view-switcher" role="group" aria-label={updatesViewLabels[language].group}>
            <SlidingSelection>
              {(['compact', 'detailed'] as const).map((view) => (
                <button
                  aria-controls="portal-updates-window"
                  aria-pressed={updatesView === view}
                  className={updatesView === view ? 'is-active' : undefined}
                  key={view}
                  onClick={() => setUpdatesView(view)}
                  type="button"
                >
                  {updatesViewLabels[language][view]}
                </button>
              ))}
            </SlidingSelection>
          </div>
          <div
            aria-label={updateLabels[language].window}
            className="wiki-portal-updates-window"
            id="portal-updates-window"
            role="region"
          >
            <ol className="wiki-portal-news-list">
              {recentUpdates.map((item) => (
                <li key={`${item.dateTime}-${item.title}`}>
                  <time dateTime={item.dateTime}>{item.date}</time>
                  <div>
                    <WikiLink href={withBasePath(item.href)} titleMorphSlug={wikiSlugFromHref(item.href)} titleMorphDestTitle={item.title}>{item.title}</WikiLink>
                    {!item.papers && <p>{item.detail}</p>}
                    {(newsOpen || acceptanceWarm) && item.papers && <PaperAcceptancePreview key={acceptanceResetKey} papers={item.papers} language={language} defaultOpen={item === latestAcceptance} view={updatesView} highlights={paperHighlights} visible={newsOpen} />}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </details>

        <VisitorAtlasDisclosure
          language={language}
          onOpenChange={changeActivityOpen}
          open={activityOpen}
          detailsRef={activityDisclosure.ref}
          priorityPrefetch={layoutMode === 'nameOnly'}
        />

        <details
          className="wiki-portal-directory"
          id="portal-directory"
          ref={browseDisclosure.ref}
          data-animated-disclosure=""
          onToggle={(event) => {
            if (event.target !== event.currentTarget) return;
            if (event.currentTarget.open !== browseOpen) changeBrowseOpen(event.currentTarget.open);
          }}
          open={browseOpen}
        >
          <summary
            onMouseDown={(event) => {
              event.preventDefault();
            }}
            onClick={(event) => {
            event.preventDefault();
            if (event.detail === 0) {
              (event.currentTarget as HTMLElement).focus({ preventScroll: true });
            }
            browseDisclosure.toggle();
          }}>
            <span>{browseLabels[language]}</span>
          </summary>
          <div className="wiki-portal-view-switcher" role="group" aria-label={browseViewLabels[language].group}>
            <span>{browseViewLabels[language].group}</span>
            <SlidingSelection>
              {(['list', 'cube'] as const).map((view) => (
                <button
                  aria-pressed={browseView === view}
                  className={browseView === view ? 'is-active' : undefined}
                  key={view}
                  onClick={() => selectBrowseView(view)}
                  type="button"
                >
                  {browseViewLabels[language][view]}
                </button>
              ))}
            </SlidingSelection>
          </div>
          <div
            className={'wiki-portal-cube-stage wiki-portal-cube-stage-' + browseView}
            data-active-face={browseView === 'cube' ? activeCubeFace ?? undefined : undefined}
            data-face-settled={browseView === 'cube' && activeCubeFace && cubeFaceSettled ? '' : undefined}
            data-touch-cube-angle={browseView === 'cube' ? touchCubeAngle : undefined}
            data-touch-cube-dragging={browseView === 'cube' && touchCubeDragging ? '' : undefined}
            onBlurCapture={(event) => {
              if (!pinnedCubeFace && !event.currentTarget.contains(event.relatedTarget as Node | null)) {
                clearCubeHoverIntent();
                setActiveCubeFace(null);
              }
            }}
            onFocusCapture={(event) => {
              if (pinnedCubeFace) return;
              clearCubeHoverIntent();
              const face = (event.target as HTMLElement).closest<HTMLElement>('[data-cube-face]')?.dataset.cubeFace as CubeFace | undefined;
              if (face && cubeFaceNames.includes(face)) setActiveCubeFace(face);
            }}
            onPointerCancel={resetTouchCubeGesture}
            onPointerDown={beginTouchCubeGesture}
            onPointerLeave={(event) => {
              if (isDirectPointer(event)) return;
              clearCubeHoverIntent();
              if (!pinnedCubeFace) setActiveCubeFace(null);
            }}
            onPointerMove={moveTouchCubeGesture}
            onPointerOver={(event) => {
              if (event.pointerType !== 'mouse' || browseView !== 'cube' || activeCubeFace || pinnedCubeFace) return;
              const targetFace = (event.target as HTMLElement).closest<HTMLElement>('[data-cube-face]');
              const relatedFace = (event.relatedTarget as HTMLElement | null)?.closest?.<HTMLElement>('[data-cube-face]');
              const face = targetFace?.dataset.cubeFace as CubeFace | undefined;
              if (targetFace === relatedFace || !face || !cubeFaceNames.includes(face)) return;
              scheduleCubeFace(face);
            }}
            onPointerUp={finishTouchCubeGesture}
            ref={cubeStageRef}
          >
            <div
              className={'wiki-portal-grid wiki-portal-grid-' + browseView}
              data-active-face={activeCubeFace ?? undefined}
              data-browse-view={browseView}
              data-face-settled={cubeFaceSettled ? '' : undefined}
              data-pinned-face={pinnedCubeFace ?? undefined}
              data-touch-cube-angle={touchCubeAngle}
              onTransitionEnd={completeCubeFaceTurn}
              style={browseView === 'cube' && !activeCubeFace ? {
                '--portal-touch-drag-y': `${touchCubeDragDegrees}deg`,
              } as CSSProperties : undefined}
            >
              {directorySections.map((section, sectionIndex) => {
                const sectionId = `portal-${section.title.en.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
                const cubeFace = cubeFaceNames[sectionIndex];
                return (
                <section
                  className={'wiki-portal-block wiki-portal-cube-panel wiki-portal-cube-face-' + cubeFace}
                  aria-labelledby={sectionId}
                  data-cube-face={cubeFace}
                  key={section.title.en}
                >
                  {renderPortalSectionContent(section, sectionId)}
                </section>
                );
              })}
            </div>
            {browseView === 'cube' && !activeCubeFace && (
              <div aria-hidden="true" className="wiki-portal-cube-hover-zones">
                {cubeFaceNames.map((face) => (
                  <span
                    className={'wiki-portal-cube-hover-zone wiki-portal-cube-hover-zone-' + face}
                    data-cube-hover-face={face}
                    key={'cube-hover-' + face}
                    onPointerEnter={(event) => {
                      if (event.pointerType === 'mouse') scheduleCubeFace(face);
                    }}
                    onPointerLeave={clearCubeHoverIntent}
                  />
                ))}
              </div>
            )}
            {browseView === 'cube' && !activeCubeFace && (
              <SlidingSelection className="wiki-portal-cube-touch-angles wiki-sliding-selection-dots" role="group" aria-label={language === 'zh' ? '魔方观察角度' : 'Cube viewing angle'}>
                {touchCubeAngles.map((angle) => (
                  <button
                    aria-label={language === 'zh' ? `切换至${angle === 'top' ? '上方' : angle === 'front' ? '正面' : '右侧'}视角` : `Switch to ${angle} view`}
                    aria-pressed={touchCubeAngle === angle}
                    key={angle}
                    onClick={() => setTouchCubeAngle(angle)}
                    type="button"
                  />
                ))}
              </SlidingSelection>
            )}
            {browseView === 'cube' && activeCubeFace && (
              <button
                aria-label={cubeReturnLabels[language].ariaLabel}
                className="wiki-portal-cube-touch-return"
                onClick={returnTouchCubeToInitial}
                type="button"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M10 6 4 12l6 6M4 12h10.5a5.5 5.5 0 0 1 5.5 5.5V19" />
                </svg>
                <span>{cubeReturnLabels[language].label}</span>
              </button>
            )}
            {browseView === 'cube' && activeCubeFace && cubeFaceSettled && (
              <button
                aria-label={pinnedCubeFace === activeCubeFace ? cubePinLabels[language].unpin : cubePinLabels[language].pin}
                aria-pressed={pinnedCubeFace === activeCubeFace}
                className="wiki-portal-cube-pin"
                data-cube-face={activeCubeFace}
                onClick={() => togglePinnedCubeFace(activeCubeFace)}
                type="button"
              >
                <svg aria-hidden="true" className="wiki-portal-cube-pin-icon" viewBox="0 0 32 40">
                  <ellipse className="wiki-portal-cube-pin-head" cx="16" cy="7" rx="10" ry="4" />
                  <path className="wiki-portal-cube-pin-body" d="M8 8h16l-4.5 11h-7Z" />
                  <ellipse className="wiki-portal-cube-pin-collar" cx="16" cy="19" rx="5" ry="2.2" />
                  <path className="wiki-portal-cube-pin-needle" d="M16 20v15" />
                  <ellipse className="wiki-portal-cube-pin-highlight" cx="13" cy="5.8" rx="3.2" ry="1.2" />
                </svg>
              </button>
            )}
          </div>
        </details>
      </div>
      <HomeScrollIntro language={language} withBasePath={withBasePath} />
    </article>
  );
}
