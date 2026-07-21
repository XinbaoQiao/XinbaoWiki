'use client';

import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { WikiSearch, type SearchLanguage } from '@/components/WikiSearch';
import { siteUpdates } from '@/lib/site-updates';

type LocalizedText = Record<SearchLanguage, string>;
type PortalPalette = 'text' | 'blue' | 'gold' | 'rose' | 'green' | 'violet' | 'charcoal';
type BrowseView = 'list' | 'cube';
type CubeFace = 'top' | 'front' | 'right';
type TouchCubeAngle = 'top' | 'front' | 'right';
type PortalEntry = { href: string; summary: string; title: string };
type PortalGroup = {
  label: LocalizedText;
  links: Record<SearchLanguage, PortalEntry[]>;
};
type PortalSection = {
  title: LocalizedText;
  groups: PortalGroup[];
};
type LanguageEntry = {
  detail: string;
  href: string;
  label: string;
};
type Props = {
  directorySections: PortalSection[];
  languageEntries: LanguageEntry[];
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
const cubeTurnDurationMs = 820;
const touchCubeTurnDurationMs = 420;
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

const entriesLabel: LocalizedText = {
  en: 'Primary academic entries',
  zh: '主要学术条目'
};

const sectionToggleLabels = {
  en: {
    collapse: 'Collapse homepage sections',
    expand: 'Expand homepage sections'
  },
  zh: {
    collapse: '折叠首页板块',
    expand: '展开首页板块'
  }
} satisfies Record<SearchLanguage, { collapse: string; expand: string }>;

const portalPalettes: PortalPalette[] = ['text', 'blue', 'gold', 'rose', 'green', 'violet', 'charcoal'];

const portalTaglines = {
  text: {
    en: 'Q is a lens: search the world, question the model.',
    zh: '以 Q 为镜：探索世界，追问模型。'
  },
  blue: {
    en: 'To see farther, ask better questions.',
    zh: '想看得更远，先问得更好。'
  },
  gold: {
    en: 'Where curiosity meets evidence, discovery begins.',
    zh: '好奇与证据相遇，发现由此开始。'
  },
  rose: {
    en: 'Let the machine learn. Keep the question human.',
    zh: '让机器学习，让问题保有人性。'
  },
  green: {
    en: 'Learn from the world, not just the dataset.',
    zh: '向世界学习，而不只向数据集学习。'
  },
  violet: {
    en: "A model's limits are not the world's limits.",
    zh: '模型的边界，不是世界的边界。'
  },
  charcoal: {
    en: 'In models we question; in evidence we trust.',
    zh: '对模型保持追问，以证据建立信任。'
  }
} satisfies Record<PortalPalette, LocalizedText>;

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

function withBasePath(pathname: string) {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');
  return basePath ? `${basePath}${pathname}` : pathname;
}

export function HomepagePortal({ directorySections, languageEntries }: Props) {
  const [language, setLanguage] = useState<SearchLanguage>('en');
  const [browseView, setBrowseView] = useState<BrowseView>('list');
  const [activeCubeFace, setActiveCubeFace] = useState<CubeFace | null>(null);
  const [cubeFaceSettled, setCubeFaceSettled] = useState(false);
  const [pinnedCubeFace, setPinnedCubeFace] = useState<CubeFace | null>(null);
  const [touchCubeAngle, setTouchCubeAngle] = useState<TouchCubeAngle>('front');
  const [touchCubeDragging, setTouchCubeDragging] = useState(false);
  const [touchCubeDragDegrees, setTouchCubeDragDegrees] = useState(0);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [newsOpen, setNewsOpen] = useState(false);
  const cubeHoverIntentRef = useRef<number | null>(null);
  const cubeStageRef = useRef<HTMLDivElement>(null);
  const touchCubeGestureRef = useRef<TouchCubeGesture | null>(null);
  const updatesWindowRef = useRef<HTMLDivElement>(null);
  const collapsibleSections = { browse: browseOpen, news: newsOpen };
  const allSectionsClosed = Object.values(collapsibleSections).every((open) => !open);
  const expandAllSections = () => {
    setBrowseOpen(true);
    setNewsOpen(true);
  };
  const collapseAllSections = () => {
    setBrowseOpen(false);
    setNewsOpen(false);
  };
  const toggleAllSections = () => {
    if (allSectionsClosed) {
      expandAllSections();
      return;
    }
    collapseAllSections();
  };
  const portalClassName = ['wiki-portal', allSectionsClosed ? 'wiki-portal-collapsed' : ''].filter(Boolean).join(' ');
  const latestUpdate = siteUpdates[language][0];

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
    const settleDelay = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 0
      : window.matchMedia('(hover: none), (pointer: coarse)').matches
        ? touchCubeTurnDurationMs
        : cubeTurnDurationMs;
    const settleTimer = window.setTimeout(() => setCubeFaceSettled(true), settleDelay);
    return () => window.clearTimeout(settleTimer);
  }, [activeCubeFace]);

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

  useLayoutEffect(() => {
    const viewport = updatesWindowRef.current;
    if (!viewport || !newsOpen) return;
    const list = viewport.querySelector('ol');
    if (!list) return;
    const visibleItems = Array.from(list.children).slice(0, 5) as HTMLElement[];
    if (!visibleItems.length) return;

    const measureWindow = () => {
      const lastItem = visibleItems.at(-1);
      if (!lastItem) return;
      const height = lastItem.getBoundingClientRect().bottom - list.getBoundingClientRect().top;
      viewport.style.setProperty('--portal-updates-window-height', `${Math.ceil(height)}px`);
    };

    viewport.scrollTop = 0;
    const resizeObserver = new ResizeObserver(measureWindow);
    visibleItems.forEach((item) => resizeObserver.observe(item));
    window.addEventListener('resize', measureWindow);
    measureWindow();
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', measureWindow);
    };
  }, [language, newsOpen]);

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
                <a
                  href={item.href}
                >
                  {item.title}
                </a>
                {item.summary && <span>{item.summary}</span>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );

  return (
    <article className={portalClassName} data-page-slug="Xinbao_Qiao">
      <section className="wiki-portal-hero" aria-labelledby="portal-title">
        <div className="wiki-portal-masthead">
          <div className="wiki-portal-brand">
            <div className="wiki-portal-name-wrap">
              <h1 className="wiki-portal-name" id="portal-title">
                <span className="wiki-portal-name-logos" aria-hidden="true">
                  <img
                    alt=""
                    className="wiki-portal-name-logo wiki-portal-name-logo-blue"
                    decoding="async"
                    height={158}
                    src={withBasePath('/site-logos/wordmark/xinbao-qiao-blue.png')}
                    width={641}
                  />
                  <img
                    alt=""
                    className="wiki-portal-name-logo wiki-portal-name-logo-gold"
                    decoding="async"
                    height={158}
                    src={withBasePath('/site-logos/wordmark/xinbao-qiao-gold.png')}
                    width={641}
                  />
                  <img
                    alt=""
                    className="wiki-portal-name-logo wiki-portal-name-logo-green"
                    decoding="async"
                    height={158}
                    src={withBasePath('/site-logos/wordmark/xinbao-qiao-green.png')}
                    width={641}
                  />
                  <img
                    alt=""
                    className="wiki-portal-name-logo wiki-portal-name-logo-charcoal"
                    decoding="async"
                    height={158}
                    src={withBasePath('/site-logos/wordmark/xinbao-qiao-charcoal.png')}
                    width={641}
                  />
                  <span
                    className="wiki-portal-name-logo wiki-portal-name-logo-tinted"
                    style={{
                      '--portal-wordmark-mask': `url("${withBasePath('/site-logos/wordmark/xinbao-qiao-charcoal.png')}")`
                    } as CSSProperties}
                  />
                </span>
                <span className="wiki-portal-name-text">Xinbao Qiao</span>
              </h1>
              <button
                type="button"
                aria-controls="portal-news portal-directory"
                aria-expanded={!allSectionsClosed}
                aria-label={allSectionsClosed ? sectionToggleLabels[language].expand : sectionToggleLabels[language].collapse}
                className="wiki-portal-name-button"
                onClick={toggleAllSections}
              />
            </div>
          </div>
        </div>
        <p aria-atomic="true" aria-live="polite" className="wiki-portal-tagline">
          {portalPalettes.map((palette) => (
            <span className={`wiki-portal-tagline-copy wiki-portal-tagline-${palette}`} key={palette}>
              {portalTaglines[palette][language]}
            </span>
          ))}
        </p>
        <div className="wiki-portal-search">
          <WikiSearch
            language={language}
            onLanguageChange={setLanguage}
            showLanguageSelect
            variant="portal"
          />
          <nav className="wiki-portal-editions" aria-label={entriesLabel[language]}>
            {languageEntries.map((item) => (
              <a className="wiki-portal-edition" href={item.href} key={item.href}>
                <strong>{item.label}</strong>
                <span>{item.detail}</span>
              </a>
            ))}
          </nav>
        </div>
      </section>

      <div className="wiki-portal-disclosures">
        <details
          className="wiki-portal-news wiki-portal-timeline"
          id="portal-news"
          onToggle={(event) => setNewsOpen(event.currentTarget.open)}
          open={newsOpen}
        >
          <summary>
            <span className="wiki-portal-timeline-heading">
              <strong>{updateLabels[language].title}</strong>
              <em>{siteUpdates[language].length} {language === 'zh' ? '条动态' : 'updates'}</em>
            </span>
            <span className="wiki-portal-news-preview">
              <time dateTime={latestUpdate.dateTime}>{latestUpdate.date}</time>
              <span>
                <b>{latestUpdate.title}</b>
                <small>{latestUpdate.detail}</small>
              </span>
            </span>
          </summary>
          <div
            aria-label={updateLabels[language].window}
            className="wiki-portal-updates-window"
            ref={updatesWindowRef}
            role="region"
            tabIndex={0}
          >
            <ol className="wiki-portal-news-list">
              {siteUpdates[language].map((item) => (
                <li key={`${item.dateTime}-${item.title}`}>
                  <time dateTime={item.dateTime}>{item.date}</time>
                  <div>
                    <a href={withBasePath(item.href)}>{item.title}</a>
                    <p>{item.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </details>

        <details
          className="wiki-portal-directory"
          id="portal-directory"
          onToggle={(event) => setBrowseOpen(event.currentTarget.open)}
          open={browseOpen}
        >
          <summary>
            <span>{browseLabels[language]}</span>
          </summary>
          <div className="wiki-portal-view-switcher" role="group" aria-label={browseViewLabels[language].group}>
            <span>{browseViewLabels[language].group}</span>
            <div>
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
            </div>
          </div>
          <div
            className={'wiki-portal-cube-stage wiki-portal-cube-stage-' + browseView}
            data-active-face={browseView === 'cube' ? activeCubeFace ?? undefined : undefined}
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
            style={browseView === 'cube' && activeCubeFace ? { perspective: 'none' } : undefined}
          >
            <div
              className={'wiki-portal-grid wiki-portal-grid-' + browseView}
              data-active-face={activeCubeFace ?? undefined}
              data-browse-view={browseView}
              data-face-settled={cubeFaceSettled ? '' : undefined}
              data-pinned-face={pinnedCubeFace ?? undefined}
              data-touch-cube-angle={touchCubeAngle}
              style={browseView === 'cube' && activeCubeFace ? {
                transform: 'none',
                transformStyle: 'flat',
                transition: cubeFaceSettled ? 'none' : undefined,
                willChange: 'auto',
              } : browseView === 'cube' ? {
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
                  style={browseView === 'cube' && activeCubeFace === cubeFace ? {
                    backfaceVisibility: 'visible',
                    transform: 'none',
                    transformStyle: 'flat',
                    transition: cubeFaceSettled ? 'none' : undefined,
                  } : undefined}
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
              <div className="wiki-portal-cube-touch-angles" role="group" aria-label={language === 'zh' ? '魔方观察角度' : 'Cube viewing angle'}>
                {touchCubeAngles.map((angle) => (
                  <button
                    aria-label={language === 'zh' ? `切换至${angle === 'top' ? '上方' : angle === 'front' ? '正面' : '右侧'}视角` : `Switch to ${angle} view`}
                    aria-pressed={touchCubeAngle === angle}
                    key={angle}
                    onClick={() => setTouchCubeAngle(angle)}
                    type="button"
                  />
                ))}
              </div>
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
                <span>Pin</span>
              </button>
            )}
          </div>
        </details>
      </div>
    </article>
  );
}
