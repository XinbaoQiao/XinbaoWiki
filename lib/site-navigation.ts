export type SiteLanguage = 'en' | 'zh';
export type LocalizedText = Record<SiteLanguage, string>;

export type CuratedLinkGroup = {
  label: LocalizedText;
  links: Record<SiteLanguage, string[]>;
};

export type CuratedDirectorySection = {
  title: LocalizedText;
  groups: CuratedLinkGroup[];
};

export const languageEntries = [
  { label: 'English', slug: 'Xinbao_Qiao', detail: 'Academic biography and research overview' },
  { label: '中文', slug: 'Qiao_Xinbao_zh', detail: '个人学术条目与研究概览' }
] as const;

export const directorySections: CuratedDirectorySection[] = [
  {
    title: { en: 'Research topics', zh: '研究主题' },
    groups: [
      {
        label: { en: 'Core research', zh: '核心研究' },
        links: {
          en: ['Research', 'AI_and_Networks', 'Data_Centric_Machine_Learning'],
          zh: ['Research_zh', 'AI_and_Networks_zh', 'Data_Centric_Machine_Learning_zh']
        }
      },
      {
        label: { en: 'Methods and geometry', zh: '方法与几何' },
        links: {
          en: ['Machine_Unlearning', 'Distributed_Wasserstein_Barycenter', 'Influence_Functions'],
          zh: ['Machine_Unlearning_zh', 'Distributed_Wasserstein_Barycenter_zh', 'Influence_Functions_zh']
        }
      },
      {
        label: { en: 'Reliability and trust', zh: '可靠性与可信' },
        links: {
          en: ['Synthetic_Data_and_Model_Collapse', 'Fairness_and_Robustness', 'LLM_Reliability'],
          zh: ['Synthetic_Data_and_Model_Collapse_zh', 'Fairness_and_Robustness_zh', 'LLM_Reliability_zh']
        }
      }
    ]
  },
  {
    title: { en: 'Publications and projects', zh: '论文与项目' },
    groups: [
      {
        label: { en: 'Indexes', zh: '索引' },
        links: {
          en: ['Publications', 'Projects'],
          zh: ['Publications_zh', 'Projects_zh']
        }
      },
      {
        label: { en: 'Selected publications', zh: '代表论文' },
        links: {
          en: [
            'Hessian_Free_Online_Certified_Unlearning',
            'Soft_Weighted_Machine_Unlearning',
            'When_Sample_Selection_Bias_Precipitates_Model_Collapse',
            'DynFrs'
          ],
          zh: [
            'Hessian_Free_Online_Certified_Unlearning_zh',
            'Soft_Weighted_Machine_Unlearning_zh',
            'When_Sample_Selection_Bias_Precipitates_Model_Collapse_zh',
            'DynFrs_zh'
          ]
        }
      },
      {
        label: { en: 'Project pages', zh: '项目页面' },
        links: {
          en: ['AI_and_Networks', 'Collaborative_Evaluation'],
          zh: ['AI_and_Networks_zh', 'Collaborative_Evaluation_zh']
        }
      }
    ]
  },
  {
    title: { en: 'Affiliations', zh: '学术经历与关系' },
    groups: [
      {
        label: { en: 'Profile', zh: '个人资料' },
        links: {
          en: ['CV', 'Education', 'Experience'],
          zh: ['CV_zh', 'Education_zh', 'Experience_zh']
        }
      },
      {
        label: { en: 'Institutions', zh: '机构' },
        links: {
          en: ['The_Chinese_University_of_Hong_Kong', 'Zhejiang_University', 'Shandong_University', 'NUSRI_CQ'],
          zh: ['The_Chinese_University_of_Hong_Kong_zh', 'Zhejiang_University_zh', 'Shandong_University_zh', 'NUSRI_CQ_zh']
        }
      },
      {
        label: { en: 'Academic network', zh: '学术网络' },
        links: {
          en: ['Angela_Yingjun_Zhang', 'Meng_Zhang'],
          zh: ['Angela_Yingjun_Zhang_zh', 'Meng_Zhang_zh']
        }
      }
    ]
  }
];

export const sidebarSections = [
  {
    key: 'navigation',
    label: { en: 'Navigation', zh: '导航' },
    links: ['Xinbao_Qiao', 'Publications', 'CV']
  },
  {
    key: 'researchTopics',
    label: { en: 'Research topics', zh: '研究主题' },
    links: ['AI_and_Networks', 'Machine_Unlearning', 'Synthetic_Data_and_Model_Collapse', 'Data_Centric_Machine_Learning']
  },
  {
    key: 'education',
    label: { en: 'Education', zh: '教育经历' },
    links: ['The_Chinese_University_of_Hong_Kong', 'Zhejiang_University', 'Shandong_University']
  },
  {
    key: 'experience',
    label: { en: 'Experience', zh: '研究经历' },
    links: ['NUSRI_CQ']
  }
] as const;

export const navigationLabels: Record<string, LocalizedText> = {
  Xinbao_Qiao: { en: 'Main page', zh: '主页' },
  Publications: { en: 'Publications', zh: '论文' },
  CV: { en: 'CV', zh: '简历' },
  AI_and_Networks: { en: 'AI and Networks', zh: 'AI 与网络' },
  Machine_Unlearning: { en: 'Machine Unlearning', zh: '机器遗忘' },
  Synthetic_Data_and_Model_Collapse: { en: 'Synthetic Data', zh: '合成数据' },
  Data_Centric_Machine_Learning: { en: 'Data Centric ML', zh: '数据中心 ML' },
  The_Chinese_University_of_Hong_Kong: { en: 'CUHK', zh: '香港中文大学' },
  NUSRI_CQ: { en: 'NUSRI-CQ', zh: 'NUSRI-CQ' },
  Zhejiang_University: { en: 'ZJU', zh: '浙江大学' },
  Shandong_University: { en: 'SDU', zh: '山东大学' }
};
