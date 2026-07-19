import type { SiteLanguage } from '@/lib/site-navigation';

export type SiteUpdate = {
  date: string;
  dateTime: string;
  detail: string;
  href: string;
  title: string;
};

export const siteUpdates: Record<SiteLanguage, SiteUpdate[]> = {
  en: [
    { date: 'Apr 2026', dateTime: '2026-04', detail: '“When Sample Selection Bias Precipitates Model Collapse”.', href: '/wiki/When_Sample_Selection_Bias_Precipitates_Model_Collapse/', title: 'ICML 2026 paper accepted' },
    { date: 'Dec 2025', dateTime: '2025-12', detail: 'M.Eng. in Artificial Intelligence, Zhejiang University.', href: '/wiki/Zhejiang_University/', title: 'Completed master’s degree' },
    { date: 'Nov 2025', dateTime: '2025-11', detail: '“Beyond Binary Erasure: Soft-Weighted Unlearning for Fairness and Robustness”.', href: '/wiki/Soft_Weighted_Machine_Unlearning/', title: 'AAAI 2026 paper accepted' },
    { date: 'Jun 2025', dateTime: '2025-06', detail: 'Six-month full-time research internship on trustworthy LLMs at NUSRI-CQ.', href: '/wiki/NUSRI_CQ/', title: 'Started full-time research internship' },
    { date: 'Jan 2025', dateTime: '2025-01', detail: '“Hessian-Free Online Certified Unlearning” and “DynFrs”.', href: '/wiki/Publications/', title: 'Two ICLR 2025 papers accepted' },
    { date: 'Sep 2022', dateTime: '2022-09', detail: 'M.Eng. in Artificial Intelligence, Zhejiang University.', href: '/wiki/Education/', title: 'Started master’s degree' },
    { date: 'Jul 2022', dateTime: '2022-07', detail: 'B.Eng. in Communication Engineering, Shandong University.', href: '/wiki/Shandong_University/', title: 'Completed bachelor’s degree' }
  ],
  zh: [
    { date: '2026年4月', dateTime: '2026-04', detail: '《When Sample Selection Bias Precipitates Model Collapse》。', href: '/wiki/When_Sample_Selection_Bias_Precipitates_Model_Collapse_zh/', title: 'ICML 2026 论文录用' },
    { date: '2025年12月', dateTime: '2025-12', detail: '浙江大学人工智能工学硕士。', href: '/wiki/Zhejiang_University_zh/', title: '完成硕士学位' },
    { date: '2025年11月', dateTime: '2025-11', detail: '《Beyond Binary Erasure: Soft-Weighted Unlearning for Fairness and Robustness》。', href: '/wiki/Soft_Weighted_Machine_Unlearning_zh/', title: 'AAAI 2026 论文录用' },
    { date: '2025年6月', dateTime: '2025-06', detail: '在 NUSRI-CQ 开展为期六个月的可信大模型全职研究实习。', href: '/wiki/NUSRI_CQ_zh/', title: '开始全职研究实习' },
    { date: '2025年1月', dateTime: '2025-01', detail: '《Hessian-Free Online Certified Unlearning》和《DynFrs》。', href: '/wiki/Publications_zh/', title: '两篇 ICLR 2025 论文录用' },
    { date: '2022年9月', dateTime: '2022-09', detail: '浙江大学人工智能工学硕士阶段。', href: '/wiki/Education_zh/', title: '开始硕士阶段' },
    { date: '2022年7月', dateTime: '2022-07', detail: '山东大学通信工程工学学士。', href: '/wiki/Shandong_University_zh/', title: '完成本科学位' }
  ]
};
