import { HomepagePortal } from '@/components/HomepagePortal';
import { getSearchIndex, getWikiPageBySlug, pathWithBasePath } from '@/lib/wiki';

const languageEntries = [
  { label: 'English', slug: 'Xinbao_Qiao', detail: 'Academic biography and research overview' },
  { label: '中文', slug: 'Qiao_Xinbao_zh', detail: '个人学术条目与研究概览' }
];

const directorySections = [
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
            'When_Sample_Selection_Bias_Precipitates_Model_Collapse'
          ],
          zh: [
            'Hessian_Free_Online_Certified_Unlearning_zh',
            'Soft_Weighted_Machine_Unlearning_zh',
            'When_Sample_Selection_Bias_Precipitates_Model_Collapse_zh'
          ]
        }
      },
      {
        label: { en: 'Project pages', zh: '项目页面' },
        links: {
          en: ['DynFrs', 'Collaborative_Evaluation', 'Learn_What_Matters_Data_Pruning_for_Efficient_Decentralized_Learning'],
          zh: ['DynFrs_zh', 'Collaborative_Evaluation_zh', 'Learn_What_Matters_Data_Pruning_for_Efficient_Decentralized_Learning_zh']
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

function wikiHref(slug: string) {
  return pathWithBasePath(`/wiki/${encodeURIComponent(slug)}/`);
}

function entry(slug: string) {
  const page = getWikiPageBySlug(slug);
  return {
    href: wikiHref(slug),
    summary: page?.summary || '',
    title: page?.title || slug.replaceAll('_', ' ')
  };
}

export default function HomePage() {
  const searchIndex = getSearchIndex();
  const portalLanguageEntries = languageEntries.map((item) => ({
    detail: item.detail,
    href: wikiHref(item.slug),
    label: item.label
  }));
  const portalDirectorySections = directorySections.map((section) => ({
    title: section.title,
    groups: section.groups.map((group) => ({
      label: group.label,
      links: {
        en: group.links.en.map(entry),
        zh: group.links.zh.map(entry)
      }
    }))
  }));

  return (
    <HomepagePortal
      directorySections={portalDirectorySections}
      languageEntries={portalLanguageEntries}
      searchIndex={searchIndex}
    />
  );
}
