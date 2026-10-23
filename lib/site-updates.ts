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
const siteUpdateEvents: readonly SiteUpdateEvent[] = [
  {
    dateTime: '2026-10',
    en: {
      date: 'Oct 2026',
      detail: 'Recognition for contributions to peer review.',
      href: '/wiki/Xinbao_Qiao/#section-academic-service',
      title: 'Recognized as a NeurIPS 2026 Top Reviewer'
    },
    zh: {
      date: '2026年10月',
      detail: '乔鑫宝因 NeurIPS 2026 审稿贡献获得认可。',
      href: '/wiki/Qiao_Xinbao_zh/#section-%E5%AD%A6%E6%9C%AF%E6%9C%8D%E5%8A%A1',
      title: '获 NeurIPS 2026 Top Reviewer 荣誉'
    }
  },
  paperAcceptance({
    date: { en: 'Sep 2026', zh: '2026年9月' },
    dateTime: '2026-09',
    href: {
      en: '/wiki/Illusory_Pattern_Perception_Drives_Spurious_Inference_in_Large_Language_Models/',
      zh: '/wiki/Illusory_Pattern_Perception_Drives_Spurious_Inference_in_Large_Language_Models_zh/'
    },
    papers: [{
      slug: 'Illusory_Pattern_Perception_Drives_Spurious_Inference_in_Large_Language_Models',
      title: 'Illusory Pattern Perception Drives Spurious Inference in Large Language Models',
      image: '/papers/illusory-pattern/camera-ready-first-page.webp',
      width: 1200,
      height: 1553,
      // Author-confirmed Camera-Ready version, 2026-10-19.
      pdf: 'https://arxiv.org/pdf/2610.07791'
    }],
    venue: 'NeurIPS 2026'
  }),
  {
    dateTime: '2026-08-01',
    en: {
      date: 'Aug 1, 2026',
      detail: 'PhD in Information Engineering, The Chinese University of Hong Kong.',
      href: '/wiki/The_Chinese_University_of_Hong_Kong/',
      title: 'Started PhD studies at CUHK'
    },
    zh: {
      date: '2026年8月1日',
      detail: '香港中文大学信息工程博士阶段。',
      href: '/wiki/The_Chinese_University_of_Hong_Kong_zh/',
      title: '开始在香港中文大学攻读博士学位'
    }
  },
  paperAcceptance({
    date: { en: 'Apr 2026', zh: '2026年4月' },
    dateTime: '2026-04',
    href: {
      en: '/wiki/When_Sample_Selection_Bias_Precipitates_Model_Collapse/',
      zh: '/wiki/When_Sample_Selection_Bias_Precipitates_Model_Collapse_zh/'
    },
    papers: [{
      slug: 'When_Sample_Selection_Bias_Precipitates_Model_Collapse',
      title: 'When Sample Selection Bias Precipitates Model Collapse',
      image: '/papers/model-collapse/camera-ready-first-page.webp',
      width: 1200,
      height: 1553,
      pdf: 'https://raw.githubusercontent.com/mlresearch/v306/main/assets/qiao26c/qiao26c.pdf'
    }],
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
    papers: [{
      slug: 'Soft_Weighted_Machine_Unlearning',
      title: 'Beyond Binary Erasure: Soft-Weighted Unlearning for Fairness and Robustness',
      image: '/papers/soft-weighted/camera-ready-first-page.webp',
      width: 1200,
      height: 1553,
      pdf: 'https://ojs.aaai.org/index.php/AAAI/article/view/39681/43642'
    }],
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
      {
        slug: 'Hessian_Free_Online_Certified_Unlearning',
        title: 'Hessian-Free Online Certified Unlearning',
        image: '/papers/hessian-free/camera-ready-first-page.webp',
        width: 1200,
        height: 1553,
        pdf: 'https://proceedings.iclr.cc/paper_files/paper/2025/file/50ee6db59fca8643dc625829d4a0eab9-Paper-Conference.pdf'
      },
      {
        slug: 'DynFrs',
        title: 'DynFrs: An Efficient Framework for Machine Unlearning in Random Forest',
        image: '/papers/dynfrs/camera-ready-first-page.webp',
        width: 1200,
        height: 1553,
        pdf: 'https://proceedings.iclr.cc/paper_files/paper/2025/file/1caf09c9f4e6b0150b06a07e77f2710c-Paper-Conference.pdf'
      }
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
