import type { SiteLanguage } from '@/lib/site-navigation';

export type SiteUpdate = {
  date: string;
  dateTime: string;
  detail: string;
  href: string;
  title: string;
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
  papers: readonly string[];
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
  if (!papers.length || papers.some((paper) => !paper.trim())) {
    throw new Error(`Paper acceptance at ${venue} must list every paper's full title.`);
  }
  return {
    dateTime,
    en: {
      date: date.en,
      detail: papers.length === 1 ? `Accepted paper at ${venue}.` : `${papers.length} papers accepted at ${venue}.`,
      href: href.en,
      title: `${joinEnglishTitles(papers)} accepted at ${venue}`
    },
    zh: {
      date: date.zh,
      detail: papers.length === 1 ? `${venue} 录用论文。` : `${venue} 录用的 ${papers.length} 篇论文。`,
      href: href.zh,
      title: `${joinChineseTitles(papers)}获 ${venue} 录用`
    }
  };
}

// Canonical ordered event data for both the homepage Updates disclosure and
// the readable Latest updates page linked under Contribute.
const siteUpdateEvents: readonly SiteUpdateEvent[] = [
  paperAcceptance({
    date: { en: 'Apr 2026', zh: '2026年4月' },
    dateTime: '2026-04',
    href: {
      en: '/wiki/When_Sample_Selection_Bias_Precipitates_Model_Collapse/',
      zh: '/wiki/When_Sample_Selection_Bias_Precipitates_Model_Collapse_zh/'
    },
    papers: ['When Sample Selection Bias Precipitates Model Collapse'],
    venue: 'ICML 2026'
  }),
  {
    dateTime: '2025-12',
    en: { date: 'Dec 2025', detail: 'M.Eng. in Artificial Intelligence, Zhejiang University.', href: '/wiki/Zhejiang_University/', title: 'Completed master’s degree' },
    zh: { date: '2025年12月', detail: '浙江大学人工智能工学硕士。', href: '/wiki/Zhejiang_University_zh/', title: '完成硕士学位' }
  },
  paperAcceptance({
    date: { en: 'Nov 2025', zh: '2025年11月' },
    dateTime: '2025-11',
    href: {
      en: '/wiki/Soft_Weighted_Machine_Unlearning/',
      zh: '/wiki/Soft_Weighted_Machine_Unlearning_zh/'
    },
    papers: ['Beyond Binary Erasure: Soft-Weighted Unlearning for Fairness and Robustness'],
    venue: 'AAAI 2026'
  }),
  {
    dateTime: '2025-06',
    en: { date: 'Jun 2025', detail: 'Six-month full-time research internship on trustworthy LLMs at NUSRI-CQ.', href: '/wiki/NUSRI_CQ/', title: 'Started full-time research internship' },
    zh: { date: '2025年6月', detail: '在 NUSRI-CQ 开展为期六个月的可信大模型全职研究实习。', href: '/wiki/NUSRI_CQ_zh/', title: '开始全职研究实习' }
  },
  paperAcceptance({
    date: { en: 'Jan 2025', zh: '2025年1月' },
    dateTime: '2025-01',
    href: { en: '/wiki/Publications/', zh: '/wiki/Publications_zh/' },
    papers: [
      'Hessian-Free Online Certified Unlearning',
      'DynFrs: An Efficient Framework for Machine Unlearning in Random Forest'
    ],
    venue: 'ICLR 2025'
  }),
  {
    dateTime: '2022-09',
    en: { date: 'Sep 2022', detail: 'M.Eng. in Artificial Intelligence, Zhejiang University.', href: '/wiki/Education/', title: 'Started master’s degree' },
    zh: { date: '2022年9月', detail: '浙江大学人工智能工学硕士阶段。', href: '/wiki/Education_zh/', title: '开始硕士阶段' }
  },
  {
    dateTime: '2022-07',
    en: { date: 'Jul 2022', detail: 'B.Eng. in Communication Engineering, Shandong University.', href: '/wiki/Shandong_University/', title: 'Completed bachelor’s degree' },
    zh: { date: '2022年7月', detail: '山东大学通信工程工学学士。', href: '/wiki/Shandong_University_zh/', title: '完成本科学位' }
  }
];

function updatesFor(language: SiteLanguage): SiteUpdate[] {
  return siteUpdateEvents.map((event) => ({ dateTime: event.dateTime, ...event[language] }));
}

export const siteUpdates: Record<SiteLanguage, SiteUpdate[]> = {
  en: updatesFor('en'),
  zh: updatesFor('zh')
};
