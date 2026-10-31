/**
 * Homepage scroll-down destination (biography / introduction).
 * Language follows the portal search-bar EN/ZH toggle -- not separate entry cards.
 */
export type HomeScrollIntroLanguage = 'en' | 'zh';

export const HOME_SCROLL_INTRO_BY_LANG = {
  en: {
    slug: 'Xinbao_Qiao',
    path: '/wiki/Xinbao_Qiao/'
  },
  zh: {
    slug: 'Qiao_Xinbao_zh',
    path: '/wiki/Qiao_Xinbao_zh/'
  }
} as const;

/** Prefer HOME_SCROLL_INTRO_BY_LANG[language]; EN default for legacy callers. */
export const HOME_SCROLL_INTRO_SLUG = HOME_SCROLL_INTRO_BY_LANG.en.slug;

/** Prefer HOME_SCROLL_INTRO_BY_LANG[language]; EN default for legacy callers. */
export const HOME_SCROLL_INTRO_PATH = HOME_SCROLL_INTRO_BY_LANG.en.path;

export const homeScrollIntroLabels = {
  en: {
    affordance: 'Scroll for introduction',
    /** Narrow / touch UIs: match the finger gesture users expect. */
    touchAffordance: 'Swipe up for introduction',
    action: 'Open English introduction',
    progress: 'Entering introduction'
  },
  zh: {
    affordance: '下滑进入简介',
    /** Narrow / touch UIs: 上滑 matches the finger swipe into intro. */
    touchAffordance: '上滑进入简介',
    action: '打开中文简介',
    progress: '正在进入简介'
  }
} as const;
