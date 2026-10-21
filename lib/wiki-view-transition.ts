/** Stable CSS view-transition-name for wiki title morphs (list <-> article H1). */
export function wikiTitleViewTransitionName(slug: string) {
  const safe = String(slug || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `wiki-title-${safe || 'page'}`;
}

export function wikiSlugFromHref(href: string) {
  try {
    const path = href.includes('://') ? new URL(href).pathname : href;
    const match = path.match(/\/wiki\/([^/]+)\/?/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

/** Collapse whitespace / underscores for morph label vs destination title checks. */
export function normalizeWikiMorphText(value: string) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_/\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Guess the destination H1 when we only have a slug (frontmatter title unknown).
 * Mirrors wikiPageTitle's slug fallback: underscores to spaces; drop trailing _zh.
 */
export function wikiSlugAsTitleGuess(slug: string) {
  const decoded = decodeURIComponent(String(slug || '').trim());
  if (!decoded) return '';
  if (decoded === 'Updates') return 'Updates';
  const withoutZh = decoded === 'Your_Name_zh'
    ? 'Your Name'
    : decoded.replace(/_zh$/i, '');
  return withoutZh.replaceAll('_', ' ').trim();
}

function englishStemSlug(slug: string) {
  const decoded = decodeURIComponent(String(slug || '').trim());
  if (decoded === 'Your_Name_zh') return 'Your_Name';
  return decoded.replace(/_zh$/i, '');
}

/* ---------- slug -> real H1 title cache (from /search-index.json) ---------- */

type WikiTitleCacheEntry = { title: string; aliases?: string[] };

let wikiTitleCache: Map<string, WikiTitleCacheEntry> | null = null;
let wikiTitleCachePromise: Promise<void> | null = null;
let wikiTitleCacheVersion = 0;
const wikiTitleCacheListeners = new Set<() => void>();

export function subscribeWikiTitleCache(onStoreChange: () => void) {
  wikiTitleCacheListeners.add(onStoreChange);
  return () => { wikiTitleCacheListeners.delete(onStoreChange); };
}

export function getWikiTitleCacheVersion() {
  return wikiTitleCacheVersion;
}

export function seedWikiTitleCache(items: Array<{ slug: string; title: string; aliases?: string[] }>) {
  const map = new Map<string, WikiTitleCacheEntry>();
  for (const item of items) {
    if (!item?.slug || !item?.title) continue;
    map.set(item.slug, { title: item.title, aliases: item.aliases });
  }
  wikiTitleCache = map;
  wikiTitleCacheVersion += 1;
  wikiTitleCacheListeners.forEach((listener) => listener());
}

export function lookupWikiTitle(slug: string | null | undefined): string | null {
  if (!slug || !wikiTitleCache) return null;
  const direct = wikiTitleCache.get(slug);
  if (direct?.title) return direct.title;
  try {
    const decoded = decodeURIComponent(slug);
    if (decoded !== slug) {
      const via = wikiTitleCache.get(decoded);
      if (via?.title) return via.title;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function lookupWikiTitleAliases(slug: string): string[] {
  if (!wikiTitleCache) return [];
  let entry = wikiTitleCache.get(slug);
  if (!entry) {
    try {
      const decoded = decodeURIComponent(slug);
      if (decoded !== slug) entry = wikiTitleCache.get(decoded);
    } catch {
      /* ignore */
    }
  }
  return entry?.aliases?.filter(Boolean) || [];
}

/** Prefetch search-index titles so body links can match real H1 text. */
export function ensureWikiTitleCache(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (wikiTitleCache) return Promise.resolve();
  if (wikiTitleCachePromise) return wikiTitleCachePromise;
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');
  wikiTitleCachePromise = fetch(`${basePath}/search-index.json`, { cache: 'force-cache' })
    .then(async (response) => {
      if (!response.ok) throw new Error(`title cache ${response.status}`);
      const payload = await response.json() as unknown;
      if (!Array.isArray(payload)) throw new Error('title cache not array');
      seedWikiTitleCache(payload as Array<{ slug: string; title: string; aliases?: string[] }>);
    })
    .catch(() => {
      wikiTitleCachePromise = null;
    })
    .then(() => undefined);
  return wikiTitleCachePromise;
}

/**
 * Known short nav / body labels that still identify the same destination H1.
 * (e.g. sidebar "CV" <-> page title "Curriculum Vitae")
 */
function wikiMorphLabelAliases(slug: string, destTitle: string): string[] {
  const stem = englishStemSlug(slug);
  const aliases = new Set<string>();
  const add = (value: string) => {
    const n = normalizeWikiMorphText(value);
    if (n) aliases.add(n);
  };
  add(destTitle);
  add(wikiSlugAsTitleGuess(slug));
  add(stem.replaceAll('_', ' '));
  for (const extra of lookupWikiTitleAliases(slug)) add(extra);

  if (stem === 'CV') {
    add('CV');
    add('Curriculum Vitae');
    add('简历');
    add('Resume');
    add('Résumé');
    add('Resumé');
  }
  if (stem === 'Publications') {
    add('Publications');
    add('论文');
  }
  if (stem === 'Updates') {
    add('Updates');
    add('最新动态');
    add('Latest updates');
  }
  if (stem === 'Your_Name') {
    add('Your Name');
    add('你的名字');
    add('Main page');
  }
  if (stem === 'Example_University') {
    add('EU');
    add('Example University');
  }
  return [...aliases];
}


/** True when clicked label identifies the destination H1 content. */
function significantTokens(value: string) {
  return value
    .split(' ')
    .map((t) => t.replace(/[^a-z0-9\u4e00-\u9fff]+/gi, ''))
    .filter((t) => t.length >= 4 || /^(ml|cv|ai|ot)$/i.test(t));
}

function tokenVariants(token: string) {
  const out = new Set<string>([token]);
  if (token.endsWith('s') && token.length >= 5) out.add(token.slice(0, -1));
  else out.add(`${token}s`);
  return out;
}

function morphLabelMatchesTitle(label: string, expected: string, slug: string) {
  if (!label || !expected) return false;
  if (label === expected) return true;

  const shorter = label.length <= expected.length ? label : expected;
  const longer = label.length <= expected.length ? expected : label;
  if (shorter.length >= 4 && longer.includes(shorter)) return true;

  const stem = normalizeWikiMorphText(englishStemSlug(slug).replaceAll('_', ' '));
  if (stem.length >= 2) {
    if (label === stem) return true;
    if (label.startsWith(`${stem}:`) || label.startsWith(`${stem} `) || label.startsWith(`${stem}-`)) return true;
    if (expected.startsWith(`${stem}:`) || expected.startsWith(`${stem} `)) {
      if (label.startsWith(stem)) return true;
    }
  }

  // Token overlap: all significant tokens of the shorter label appear in the longer title.
  const shortTokens = significantTokens(shorter);
  const longTokens = new Set(significantTokens(longer));
  if (shortTokens.length >= 2 && shortTokens.every((t) => [...tokenVariants(t)].some((v) => longTokens.has(v)))) return true;

  return false;
}

/**
 * Morph only when the clicked label is the content that will appear as the
 * destination H1 (or an accepted short alias for that same title). Language
 * toggles / mismatched chrome labels must not arm a shared view-transition-name.
 */
export function shouldPrepareWikiTitleMorph(
  slug: string | null | undefined,
  labelText: string | null | undefined,
  destTitle?: string | null
) {
  if (!slug) return false;
  const label = normalizeWikiMorphText(labelText || '');
  if (!label) return false;

  // Language-toggle chrome must never morph, even if a slug was passed by mistake.
  if (label === '中文' || label === 'english' || label === 'en') return false;

  const resolved =
    (destTitle && String(destTitle).trim()) ||
    lookupWikiTitle(slug) ||
    wikiSlugAsTitleGuess(slug);
  const expected = normalizeWikiMorphText(resolved);
  if (!expected) return false;
  if (label === expected) return true;

  const aliases = wikiMorphLabelAliases(slug, resolved);
  if (aliases.includes(label)) return true;

  if (morphLabelMatchesTitle(label, expected, slug)) return true;

  // Updates H1 is "Updates / 最新动态" — allow either stem alone.
  if (englishStemSlug(slug) === 'Updates' && (label === 'updates' || label === '最新动态' || label === 'latest updates')) {
    return true;
  }

  return false;
}

export function clearWikiMorphIntent() {
  if (typeof document === 'undefined') return;
  delete document.documentElement.dataset.wikiMorphTo;
  document.documentElement.removeAttribute('data-wiki-morph-to');
  clearWikiMorphScrollTheater();
}

/** Drop off-viewport scroll theater attrs used during a title morph. */
export function clearWikiMorphScrollTheater() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  delete root.dataset.wikiMorphScroll;
  root.removeAttribute('data-wiki-morph-scroll');
  delete root.dataset.wikiMorphOriginScroll;
  root.removeAttribute('data-wiki-morph-origin-scroll');
  root.style.removeProperty('--wiki-morph-scroll-from');
}

/** Remember scrollY at morph click so off-viewport lift can ease even if Next resets scroll first. */
export function rememberWikiMorphOriginScroll() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  document.documentElement.dataset.wikiMorphOriginScroll = String(
    Math.round(window.scrollY || document.documentElement.scrollTop || 0)
  );
}

/**
 * Ease wiki-main from the pre-navigation scroll offset during the title flight.
 * Snapshot geometry stays correct (page already at dest); this only softens the lift.
 */
export function armWikiMorphScrollTheater(deltaPx: number) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!Number.isFinite(deltaPx) || Math.abs(deltaPx) < 48) return;
  const vh = window.innerHeight || document.documentElement.clientHeight || 800;
  // Lighter than the old 42% vh full-bitmap lift: soft lift only, capped.
  const vhCap = Math.max(88, Math.round(vh * 0.26));
  const softened = deltaPx * 0.62;
  const visual = Math.max(-vhCap, Math.min(vhCap, softened));
  if (Math.abs(visual) < 40) return;
  const rootEl = document.documentElement;
  rootEl.dataset.wikiMorphScroll = '1';
  rootEl.style.setProperty('--wiki-morph-scroll-from', `${Math.round(visual)}px`);
}

export function applyWikiMorphScrollTheaterFromOrigin() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  const raw = document.documentElement.dataset.wikiMorphOriginScroll;
  if (raw == null || raw === '') return;
  const origin = Number(raw);
  if (!Number.isFinite(origin)) return;
  const current = window.scrollY || document.documentElement.scrollTop || 0;
  armWikiMorphScrollTheater(origin - current);
}

export function armWikiMorphIntent(slug: string) {
  if (typeof document === 'undefined' || !slug) return;
  document.documentElement.dataset.wikiMorphTo = slug;
  rememberWikiMorphOriginScroll();
}

export function peekWikiMorphIntent() {
  if (typeof document === 'undefined') return null;
  return document.documentElement.dataset.wikiMorphTo || null;
}

function restoreWikiTitleMorphSources() {
  if (typeof document === 'undefined') return;
  document
    .querySelectorAll<HTMLElement>(
      '[data-wiki-vt-source], [data-wiki-vt-source-row], [data-wiki-vt-muted], [data-wiki-vt-dest-hide], [data-wiki-vt-muted-active], a.wiki-link-page[data-wiki-vt-muted], li[data-wiki-vt-muted]'
    )
    .forEach((node) => {
      delete node.dataset.wikiVtSource;
      delete node.dataset.wikiVtSourceRow;
      delete node.dataset.wikiVtMuted;
      delete node.dataset.wikiVtDestHide;
      delete node.dataset.wikiVtActive;
      delete node.dataset.wikiVtMutedActive;
      if (node.style.viewTransitionName === 'none') {
        if (!node.classList.contains('wiki-title-morph')) {
          node.style.removeProperty('view-transition-name');
        }
      }
    });
  // Drop destination H1 names after the flight so the next soft nav (language
  // toggle, mismatch, etc.) cannot inherit an unpaired title transition.
  document.querySelectorAll<HTMLElement>('h1 .wiki-title-morph').forEach((node) => {
    node.style.viewTransitionName = 'none';
    delete node.dataset.wikiVtDestHide;
  });
}

/**
 * Clear peer title chips, then name the active chip when the label matches the
 * destination title. Prefer `activeChip` (the clicked node).
 *
 * Morph keyframes live in globals.css (view-transition-class). Do not inject <style>
 * or force layout here: both hitch the click → startViewTransition path.
 */
export function prepareWikiTitleMorph(
  slug: string | null | undefined,
  activeChip?: HTMLElement | null,
  options?: { labelText?: string | null; destTitle?: string | null }
) {
  if (typeof document === 'undefined' || !slug) return null;

  // Cache should already be warm from idle prefetch; never await here.
  void ensureWikiTitleCache();

  const labelText =
    options?.labelText ??
    activeChip?.textContent ??
    null;
  const destTitle = options?.destTitle ?? lookupWikiTitle(slug);
  const eligible = shouldPrepareWikiTitleMorph(slug, labelText, destTitle);

  let chip = activeChip && activeChip.matches('[data-wiki-title-vt]')
    ? activeChip
    : (activeChip?.querySelector?.('[data-wiki-title-vt]') as HTMLElement | null);

  // Clear only prior morph sources / muted flags — avoid walking every title chip on click (hitch).
  document.querySelectorAll<HTMLElement>('[data-wiki-vt-source], [data-wiki-vt-muted], [data-wiki-vt-dest-hide], a.wiki-link-page[data-wiki-vt-muted]').forEach((node) => {
    const isDestH1 =
      node.classList.contains('wiki-title-morph') && Boolean(node.closest('h1'));
    delete node.dataset.wikiVtSource;
    delete node.dataset.wikiVtMuted;
    delete node.dataset.wikiVtDestHide;
    delete node.dataset.wikiVtActive;
    if (isDestH1) return;
    if (node.style.viewTransitionName && node.style.viewTransitionName !== 'none') {
      node.style.viewTransitionName = 'none';
    } else if (node.style.viewTransitionName === 'none' && !node.classList.contains('wiki-title-morph')) {
      node.style.removeProperty('view-transition-name');
    }
  });

  if (!eligible) {
    clearWikiMorphIntent();
    return null;
  }

  // Fallback chip lookup only when click didn't hand us one — no getBoundingClientRect.
  if (!chip) {
    const escaped = typeof CSS !== 'undefined' && 'escape' in CSS ? CSS.escape(slug) : slug.replace(/["\\]/g, '');
    chip = document.querySelector<HTMLElement>(`[data-wiki-title-vt][data-vt-slug="${escaped}"]`);
  }

  const name = wikiTitleViewTransitionName(slug);
  armWikiMorphIntent(slug);
  if (chip) {
    chip.style.viewTransitionName = name;
    // Mark as source only — must stay visible until the old VT snapshot.
    chip.dataset.wikiVtSource = '1';
    const srcAnchor = chip.closest('a.wiki-link-page') as HTMLElement | null;
    const srcRow = (srcAnchor?.closest('li') || chip.closest('li')) as HTMLElement | null;
    if (srcRow) srcRow.dataset.wikiVtSourceRow = '1';
  }
  return name;
}

/**
 * Shared chrome keeps click-time view-transition-name across soft navigations.
 * If that name still exists when the new page H1 is snapshotted, Chrome aborts
 * (duplicate name). Called from useLayoutEffect on pathname change — after the
 * old snapshot, before the new one.
 *
 * Clearing the name would let the live chip (and the pinned sidebar bitmap)
 * paint under the flying title. Mute with data-wiki-vt-muted so CSS hides it
 * for the rest of the flight without affecting the already-taken old snapshot.
 */

/** Fully suppress a live source chip / sidebar row under the VT overlay. */
function muteWikiMorphSourceChip(node: HTMLElement) {
  node.dataset.wikiVtMuted = '1';
  delete node.dataset.wikiVtSource;
  delete node.dataset.wikiVtActive;
  // Name already captured in the old snapshot; clear so dest H1 can take it.
  node.style.viewTransitionName = 'none';

  const anchor =
    (node.closest('a.wiki-link-page') as HTMLElement | null) ||
    (node.matches('a.wiki-link-page') ? node : null);
  if (anchor) {
    anchor.dataset.wikiVtMuted = '1';
    // Kill active-page chrome that can look like a second copy at the origin.
    if (anchor.getAttribute('aria-current') === 'page') {
      anchor.dataset.wikiVtMutedActive = '1';
    }
  }

  const row =
    (anchor?.closest('li') as HTMLElement | null) ||
    (node.closest('.wiki-sidebar li, .wiki-sidebar-content li') as HTMLElement | null);
  if (row) {
    row.dataset.wikiVtMuted = '1';
  }
}

export function clearWikiTitleMorphPeers() {
  if (typeof document === 'undefined') return;
  const morphTo = document.documentElement.dataset.wikiMorphTo || null;

  document.querySelectorAll<HTMLElement>('[data-wiki-title-vt]').forEach((node) => {
    const isDestinationTitle =
      node.classList.contains('wiki-title-morph') && Boolean(node.closest('h1.wiki-title, h1'));
    if (isDestinationTitle) return;

    const wasSource =
      node.dataset.wikiVtSource === '1' ||
      (Boolean(node.style.viewTransitionName) && node.style.viewTransitionName !== 'none');
    // New-page sidebar/body chips for the same slug still paint inside the pinned
    // wiki-sidebar snapshot — mute them too or the origin shows a ghost under the flight.
    const sameSlug = Boolean(morphTo) && node.dataset.vtSlug === morphTo;

    node.style.viewTransitionName = 'none';
    delete node.dataset.wikiVtSource;
    delete node.dataset.wikiVtActive;
    if (wasSource || sameSlug) {
      muteWikiMorphSourceChip(node);
    } else {
      delete node.dataset.wikiVtMuted;
    }
  });

  // Belt-and-suspenders: any sidebar row whose link targets the morph slug.
  if (morphTo) {
    const escaped =
      typeof CSS !== 'undefined' && 'escape' in CSS
        ? CSS.escape(morphTo)
        : morphTo.replace(/["\\]/g, '');
    document
      .querySelectorAll<HTMLElement>(
        `.wiki-sidebar a.wiki-link-page[href*="${escaped}"], .wiki-sidebar-content a.wiki-link-page[href*="${escaped}"], [data-wiki-title-vt][data-vt-slug="${escaped}"]`
      )
      .forEach((node) => {
        if (node.classList.contains('wiki-title-morph') && node.closest('h1')) return;
        muteWikiMorphSourceChip(node);
      });
  }
}

/**
 * After the new snapshot (transition.ready), mute the source chip only.
 * Do NOT hide the live destination H1 — that caused a vanish/flash at landing
 * when the VT overlay tore down. morph-new stays opaque; live H1 sits under it
 * and is revealed continuously when the overlay ends.
 */

/**
 * Scroll the destination H1 into the viewport so the new VT snapshot captures an
 * on-screen end position (morph lands on a visible title).
 *
 * The correction must be instant before the snapshot — View Transitions freeze
 * geometry there. Continuity with the ~800ms title flight comes from
 * `armWikiMorphScrollTheater` / CSS easing wiki-main from the pre-nav offset
 * (including when Next already reset scroll before this runs). No floating overlay.
 */
let cachedTopbarHeight: number | null = null;

function wikiTopbarHeight() {
  if (cachedTopbarHeight != null) return cachedTopbarHeight;
  const topbar = document.querySelector('.wiki-topbar') as HTMLElement | null;
  cachedTopbarHeight = topbar ? topbar.getBoundingClientRect().height : 0;
  return cachedTopbarHeight;
}

export function scrollWikiTitleIntoViewForMorph(node: HTMLElement) {
  if (typeof document === 'undefined' || !node) return;

  const target = (node.closest('h1') as HTMLElement | null) || node;
  const rect = target.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const padTop = 8;
  const padBottom = 48;
  const fullyVisible = rect.top >= padTop && rect.bottom <= vh - padBottom;

  if (!fullyVisible) {
    // Pages scroll the window; skip getComputedStyle parent walks (layout thrash in VT).
    const sticky = wikiTopbarHeight();
    const scrollMargin = sticky > 0 ? sticky + 8 : 72;
    const before = window.scrollY || document.documentElement.scrollTop || 0;
    const targetY = Math.max(0, before + rect.top - scrollMargin);
    window.scrollTo({ top: targetY, left: 0, behavior: 'instant' as ScrollBehavior });
  }

  // Soften the lift even when Next (or us) already put H1 on-screen.
  applyWikiMorphScrollTheaterFromOrigin();
}

export function installWikiTitleMorphHooks() {
  if (typeof document === 'undefined') return () => {};
  const doc = document as Document & {
    startViewTransition?: (callback: unknown) => {
      ready: Promise<void>;
      finished: Promise<void>;
    };
    __wikiVtHooksInstalled?: boolean;
  };
  if (!doc.startViewTransition) {
    return () => {};
  }
  const current = doc.startViewTransition as ((callback: unknown) => {
    ready: Promise<void>;
    finished: Promise<void>;
  }) & { __wikiVtBound?: boolean };
  if (current.__wikiVtBound) {
    return () => {};
  }
  const original = current.bind(doc);
  const wrapped = ((callback: unknown) => {
    const muteSourcesNow = () => {
      const morphTo = document.documentElement.dataset.wikiMorphTo || null;
      // Old snapshot already captured. Hide live origin chips / whole sidebar
      // rows before the new snapshot so pinned wiki-sidebar cannot ghost.
      document.querySelectorAll<HTMLElement>('[data-wiki-vt-source="1"], [data-wiki-vt-source-row="1"]').forEach((node) => {
        muteWikiMorphSourceChip(node);
      });
      if (morphTo) {
        const escaped =
          typeof CSS !== 'undefined' && 'escape' in CSS
            ? CSS.escape(morphTo)
            : morphTo.replace(/["\\]/g, '');
        document
          .querySelectorAll<HTMLElement>(`[data-wiki-title-vt][data-vt-slug="${escaped}"]`)
          .forEach((node) => {
            if (node.classList.contains('wiki-title-morph') && node.closest('h1')) return;
            muteWikiMorphSourceChip(node);
          });
        document
          .querySelectorAll<HTMLElement>(
            `.wiki-sidebar a.wiki-link-page[href*="/${escaped}"], .wiki-sidebar-content a.wiki-link-page[href*="/${escaped}"]`
          )
          .forEach((node) => muteWikiMorphSourceChip(node));
      }
      // Do not dest-hide live H1 — landing stays continuous under opaque morph-new.
      document.querySelectorAll<HTMLElement>('[data-wiki-vt-dest-hide]').forEach((node) => {
        delete node.dataset.wikiVtDestHide;
      });
    };
    const run = typeof callback === 'function' ? callback : () => {};
    const transition = original(() => {
      muteSourcesNow();
      const result = (run as () => unknown)();
      // If React update is sync, mute new-page same-slug chips before new snapshot.
      // (async callbacks still rely on useLayoutEffect clearWikiTitleMorphPeers.)
      if (result && typeof (result as Promise<unknown>).then === 'function') {
        return (result as Promise<unknown>).then((value) => {
          muteSourcesNow();
          return value;
        });
      }
      muteSourcesNow();
      return result;
    });
    transition.ready.then(muteSourcesNow).catch(() => {});
    transition.finished.finally(() => {
      restoreWikiTitleMorphSources();
      clearWikiMorphIntent();
    });
    return transition;
  }) as typeof doc.startViewTransition & { __wikiVtBound?: boolean };
  wrapped.__wikiVtBound = true;
  doc.startViewTransition = wrapped;
  doc.__wikiVtHooksInstalled = true;

  return () => {
    // Do not clear morph intent here: page H1 unmount during a soft nav would
    // abort an in-flight title morph if cleanup wiped data-wiki-morph-to.
    if (doc.startViewTransition && (doc.startViewTransition as { __wikiVtBound?: boolean }).__wikiVtBound) {
      doc.startViewTransition = original as typeof doc.startViewTransition;
    }
    delete doc.__wikiVtHooksInstalled;
  };
}
