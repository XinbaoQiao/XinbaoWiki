import type { SiteLanguage } from '@/lib/site-navigation';

export type SiteUpdate = {
  date: string;
  dateTime: string;
  detail: string;
  href: string;
  title: string;
  papers?: readonly AcceptedPaper[];
};

export type AcceptedPaper = {
  slug: string;
  title: string;
  image: string;
  width: number;
  height: number;
  pdf: string;
};

type LocalizedUpdate = Omit<SiteUpdate, 'dateTime'>;

type SiteUpdateEvent = {
  dateTime: string;
  en: LocalizedUpdate;
  zh: LocalizedUpdate;
};

type PaperAcceptance = {
  date: Record<SiteLanguage, string>;
  dateTime: string;
  href: Record<SiteLanguage, string>;
  papers: readonly AcceptedPaper[];
  venue: string;
};

function joinEnglishTitles(titles: readonly string[]) {
  const quoted = titles.map((title) => `“${title}”`);
  if (quoted.length === 1) return quoted[0];
  return `${quoted.slice(0, -1).join(', ')} and ${quoted.at(-1)}`;
}

function joinChineseTitles(titles: readonly string[]) {
  const quoted = titles.map((title) => `《${title}》`);
  if (quoted.length === 1) return quoted[0];
  return `${quoted.slice(0, -1).join('、')}和${quoted.at(-1)}`;
}

function paperAcceptance({ date, dateTime, href, papers, venue }: PaperAcceptance): SiteUpdateEvent {
  if (!papers.length || papers.some((paper) => !paper.title.trim() || !paper.image || !paper.pdf)) {
    throw new Error(`Paper acceptance at ${venue} must list every paper's full title.`);
  }
  const titles = papers.map((paper) => paper.title);
  return {
    dateTime,
    en: {
      date: date.en,
      detail: papers.length === 1 ? `Accepted paper at ${venue}.` : `${papers.length} papers accepted at ${venue}.`,
      href: href.en,
      title: `${joinEnglishTitles(titles)} accepted at ${venue}`,
      papers
    },
    zh: {
      date: date.zh,
      detail: papers.length === 1 ? `${venue} 录用论文。` : `${venue} 录用的 ${papers.length} 篇论文。`,
      href: href.zh,
      title: `${joinChineseTitles(titles)}获 ${venue} 录用`,
      papers
    }
  };
}

// Canonical ordered event data for both the homepage Updates disclosure and
// the readable Latest updates page linked under Contribute.
// TEMPLATE: replace these sample events with your own news. Newest first.
const siteUpdateEvents: readonly SiteUpdateEvent[] = [
  paperAcceptance({
    date: { en: 'Sep 2026', zh: '2026年9月' },
    dateTime: '2026-09',
    href: { en: '/wiki/Example_Paper/', zh: '/wiki/Example_Paper_zh/' },
    papers: [{
      slug: 'Example_Paper',
      title: 'An Example Paper Title for Your Template',
      image: '/papers/example-paper/first-page.svg',
      width: 1400,
      height: 1812,
      pdf: '/papers/example-paper/example-paper.pdf'
    }],
    venue: 'Example Conference 2026'
  }),
  {
    dateTime: '2026-08-01',
    en: {
      date: 'Aug 1, 2026',
      detail: 'Sample event: started a new position at Example University.',
      href: '/wiki/Example_University/',
      title: 'Started a new position'
    },
    zh: {
      date: '2026年8月1日',
      detail: '示例动态：在示例大学开始新的阶段。',
      href: '/wiki/Example_University_zh/',
      title: '开始新的阶段'
    }
  },
  {
    dateTime: '2025-06',
    en: { date: 'Jun 2025', detail: 'Sample event: joined Example Lab as a research intern.', href: '/wiki/Example_Lab/', title: 'Joined Example Lab' },
    zh: { date: '2025年6月', detail: '示例动态：加入示例实验室开展研究实习。', href: '/wiki/Example_Lab_zh/', title: '加入示例实验室' }
  }
];

function updatesFor(language: SiteLanguage): SiteUpdate[] {
  return siteUpdateEvents.map((event) => ({ dateTime: event.dateTime, ...event[language] }));
}

export const siteUpdates: Record<SiteLanguage, SiteUpdate[]> = {
  en: updatesFor('en'),
  zh: updatesFor('zh')
};

// Keep the full archive above. Month-only events describe a whole month, so
// they remain recent until that month lies entirely outside the four-year window.
export function getRecentSiteUpdates(language: SiteLanguage, asOf = new Date()): SiteUpdate[] {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(asOf);
  const [year, month, day] = today.split('-').map(Number);
  const cutoffYear = year - 4;
  const cutoffDay = Math.min(day, new Date(Date.UTC(cutoffYear, month, 0)).getUTCDate());
  const cutoff = Date.UTC(cutoffYear, month - 1, cutoffDay);
  const endOfToday = Date.UTC(year, month - 1, day);

  return siteUpdates[language].filter((item) => {
    const [eventYear, eventMonth, eventDay] = item.dateTime.split('-').map(Number);
    const start = Date.UTC(eventYear, eventMonth - 1, eventDay || 1);
    const end = eventDay ? start : Date.UTC(eventYear, eventMonth, 0);
    return end >= cutoff && start <= endOfToday;
  });
}
