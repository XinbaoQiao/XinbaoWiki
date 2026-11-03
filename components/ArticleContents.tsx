'use client';

import { Children, isValidElement, useEffect, useRef, useState, type ReactNode } from 'react';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function decodeHashId(href: string) {
  const raw = href.startsWith('#') ? href.slice(1) : href;
  if (!raw) return '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function ArticleContents({ children, label }: { children: ReactNode; label: string }) {
  const [compact, setCompact] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const flashTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 720px)');
    const update = () => setCompact(mobile.matches);
    update();
    mobile.addEventListener('change', update);
    return () => mobile.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const nav = navRef.current;
    const page = document.querySelector('.wiki-page');
    const target = page instanceof HTMLElement ? page : document.documentElement;
    const GAP_PX = 14;
    let debounceTimer: number | null = null;

    function applyOffset() {
      if (window.matchMedia('(max-width: 720px)').matches) {
        target.style.setProperty('--wiki-sticky-toc-offset', '12px');
        return;
      }
      if (!nav) {
        target.style.setProperty('--wiki-sticky-toc-offset', '168px');
        return;
      }
      const sticky = getComputedStyle(nav).position === 'sticky';
      const height = sticky ? nav.getBoundingClientRect().height : 0;
      const px = sticky ? Math.ceil(height + GAP_PX) : 12;
      target.style.setProperty('--wiki-sticky-toc-offset', `${Math.max(px, 12)}px`);
    }

    function scheduleOffset() {
      if (debounceTimer != null) window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => {
        debounceTimer = null;
        applyOffset();
      }, 80);
    }

    applyOffset();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => scheduleOffset()) : null;
    if (nav && ro) ro.observe(nav);
    window.addEventListener('resize', scheduleOffset);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', scheduleOffset);
      if (debounceTimer != null) window.clearTimeout(debounceTimer);
      target.style.removeProperty('--wiki-sticky-toc-offset');
    };
  }, [compact]);

  useEffect(() => {
    const contentsNav = navRef.current;
    if (contentsNav == null) return;
    const root: HTMLElement = contentsNav;

    let sectionCache: HTMLElement[] = [];
    let linkCache: HTMLAnchorElement[] = [];
    let locked = false;
    let unlockTimer: number | null = null;
    let spyQueued = false;
    let spyLastRun = 0;
    const SPY_MIN_MS = 100;

    function clearFlashTimer() {
      if (flashTimerRef.current != null) {
        window.clearTimeout(flashTimerRef.current);
        flashTimerRef.current = null;
      }
    }

    function flashHeading(heading: HTMLElement) {
      clearFlashTimer();
      heading.classList.remove('wiki-heading-flash');
      // Restart animation on next frame without sync layout thrash.
      window.requestAnimationFrame(() => {
        heading.classList.add('wiki-heading-flash');
      });
      flashTimerRef.current = window.setTimeout(() => {
        heading.classList.remove('wiki-heading-flash');
        flashTimerRef.current = null;
      }, prefersReducedMotion() ? 420 : 560);
    }

    function refreshCaches() {
      linkCache = [...root.querySelectorAll('a[href^="#"]')].filter(
        (node): node is HTMLAnchorElement => node instanceof HTMLAnchorElement,
      );
      sectionCache = linkCache
        .map((link) => {
          const id = decodeHashId(link.getAttribute('href') || '');
          return id ? document.getElementById(id) : null;
        })
        .filter((node): node is HTMLElement => node instanceof HTMLElement);
    }

    function markCurrent(id: string) {
      for (const link of linkCache) {
        const linkId = decodeHashId(link.getAttribute('href') || '');
        if (linkId && linkId === id) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      }
    }

    function pickCurrent() {
      if (!sectionCache.length) refreshCaches();
      if (!sectionCache.length) return;

      let current = sectionCache[0];
      const threshold = window.innerHeight * 0.28;
      for (const section of sectionCache) {
        if (section.getBoundingClientRect().top <= threshold) current = section;
      }
      if (
        window.scrollY > 0
        && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      ) {
        current = sectionCache[sectionCache.length - 1];
      }
      markCurrent(current.id);
    }

    function onScroll() {
      if (locked) {
        if (unlockTimer != null) window.clearTimeout(unlockTimer);
        unlockTimer = window.setTimeout(() => {
          locked = false;
          unlockTimer = null;
        }, 120);
        return;
      }
      if (spyQueued) return;
      spyQueued = true;
      window.requestAnimationFrame(() => {
        spyQueued = false;
        const now = performance.now();
        if (now - spyLastRun < SPY_MIN_MS) return;
        spyLastRun = now;
        pickCurrent();
      });
    }

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const eventTarget = event.target;
      if (!(eventTarget instanceof Element)) return;
      const link = eventTarget.closest('a[href^="#"]');
      if (!(link instanceof HTMLAnchorElement) || !root.contains(link)) return;

      const href = link.getAttribute('href');
      if (!href || href === '#') return;

      const id = decodeHashId(href);
      const heading = id ? document.getElementById(id) : null;
      if (!heading) return;

      event.preventDefault();

      // Immediate active-state feedback before scroll.
      if (!linkCache.length) refreshCaches();
      markCurrent(id);

      locked = true;
      if (unlockTimer != null) window.clearTimeout(unlockTimer);
      unlockTimer = window.setTimeout(() => {
        locked = false;
        unlockTimer = null;
      }, 120);

      // Collapse mobile TOC before scrolling so layout height matches final state.
      const details = root.querySelector('details.wiki-contents-mobile');
      if (details instanceof HTMLDetailsElement && details.open) {
        details.open = false;
      }

      // Instant jump: native smooth has no duration control and feels lagged.
      heading.scrollIntoView({ behavior: 'auto', block: 'start' });
      flashHeading(heading);
      if (typeof heading.focus === 'function') {
        try {
          heading.focus({ preventScroll: true });
        } catch {
          heading.focus();
        }
      }

      if (window.location.hash !== href) {
        history.pushState(null, '', href);
      }
    }

    refreshCaches();
    root.addEventListener('click', onClick);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', refreshCaches);
    window.addEventListener('resize', pickCurrent);
    pickCurrent();

    return () => {
      root.removeEventListener('click', onClick);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', refreshCaches);
      window.removeEventListener('resize', pickCurrent);
      clearFlashTimer();
      if (unlockTimer != null) window.clearTimeout(unlockTimer);
    };
  }, []);

  const links = Children.toArray(children).filter((child) => (
    !isValidElement<{ className?: string }>(child) || child.props.className !== 'wiki-contents-label'
  ));

  return (
    <>
      <nav aria-label={label} className="wiki-article-contents" id="wiki-on-this-page" ref={navRef}>
        {compact ? (
          <details className="wiki-contents-mobile">
            <summary>{label}</summary>
            {links}
          </details>
        ) : children}
      </nav>
    </>
  );
}
