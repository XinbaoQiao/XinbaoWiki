/**
 * Homepage scroll-down destination (biography / introduction).
 * Language follows the portal search-bar EN/ZH toggle -- not separate entry cards.
 */
export type HomeScrollIntroLanguage = 'en' | 'zh';

export const HOME_SCROLL_INTRO_BY_LANG = {
  en: {
    slug: 'Your_Name',
    path: '/wiki/Your_Name/'
  },
  zh: {
    slug: 'Your_Name_zh',
    path: '/wiki/Your_Name_zh/'
  }
} as const;

/** Prefer HOME_SCROLL_INTRO_BY_LANG[language]; EN default for legacy callers. */
export const HOME_SCROLL_INTRO_SLUG = HOME_SCROLL_INTRO_BY_LANG.en.slug;

/** Prefer HOME_SCROLL_INTRO_BY_LANG[language]; EN default for legacy callers. */
export const HOME_SCROLL_INTRO_PATH = HOME_SCROLL_INTRO_BY_LANG.en.path;

export const homeScrollIntroLabels = {
  en: {
    affordance: 'Scroll for introduction',
    action: 'Open English introduction',
    progress: 'Entering introduction'
  },
  zh: {
    affordance: '下滑进入简介',
    action: '打开中文简介',
    progress: '正在进入简介'
  }
} as const;
