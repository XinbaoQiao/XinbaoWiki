'use client';

import { Children, isValidElement, useEffect, useRef, useState, type ReactNode } from 'react';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    const contentsNav = navRef.current;
    if (contentsNav == null) return;
    const root: HTMLElement = contentsNav;

    function clearFlashTimer() {
      if (flashTimerRef.current != null) {
        window.clearTimeout(flashTimerRef.current);
        flashTimerRef.current = null;
      }
    }

    function flashHeading(heading: HTMLElement) {
      clearFlashTimer();
      heading.classList.remove('wiki-heading-flash');
      void heading.offsetWidth;
      heading.classList.add('wiki-heading-flash');
      flashTimerRef.current = window.setTimeout(() => {
        heading.classList.remove('wiki-heading-flash');
        flashTimerRef.current = null;
      }, prefersReducedMotion() ? 700 : 1100);
    }

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest('a[href^="#"]');
      if (!(link instanceof HTMLAnchorElement) || !root.contains(link)) return;

      const href = link.getAttribute('href');
      if (!href || href === '#') return;

      let id = '';
      try {
        id = decodeURIComponent(href.slice(1));
      } catch {
        id = href.slice(1);
      }
      const heading = document.getElementById(id);
      if (!heading) return;

      event.preventDefault();
      const reduceMotion = prefersReducedMotion();
      heading.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      flashHeading(heading);
      if (typeof heading.focus === 'function') {
        try {
          heading.focus({ preventScroll: true });
        } catch {
          heading.focus();
        }
      }

      const details = root.querySelector('details.wiki-contents-mobile');
      if (details instanceof HTMLDetailsElement && details.open) {
        details.open = false;
      }

      if (window.location.hash !== href) {
        history.pushState(null, '', href);
      }
    }

    root.addEventListener('click', onClick);
    return () => {
      root.removeEventListener('click', onClick);
      clearFlashTimer();
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
