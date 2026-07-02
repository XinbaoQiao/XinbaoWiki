import { WikiSearch } from '@/components/WikiSearch';
import { getSearchIndex, getWikiPageBySlug, pathWithBasePath } from '@/lib/wiki';

const languageEntries = [
  { label: 'English', slug: 'Xinbao_Qiao', detail: 'Academic biography and research overview' },
  { label: '中文', slug: 'Qiao_Xinbao_zh', detail: '个人学术条目与研究概览' }
];

const directorySections = [
  {
    title: 'Research topics',
    groups: [
      {
        label: 'Core research',
        links: ['Research', 'AI_and_Networks', 'Data_Centric_Machine_Learning']
      },
      {
        label: 'Methods and geometry',
        links: ['Machine_Unlearning', 'Distributed_Wasserstein_Barycenter', 'Influence_Functions']
      },
      {
        label: 'Reliability and trust',
        links: ['Synthetic_Data_and_Model_Collapse', 'Fairness_and_Robustness', 'LLM_Reliability']
      }
    ]
  },
  {
    title: 'Publications and projects',
    groups: [
      {
        label: 'Indexes',
        links: ['Publications', 'Projects']
      },
      {
        label: 'Selected publications',
        links: [
          'Hessian_Free_Online_Certified_Unlearning',
          'Soft_Weighted_Machine_Unlearning',
          'When_Sample_Selection_Bias_Precipitates_Model_Collapse'
        ]
      },
      {
        label: 'Project pages',
        links: ['DynFrs', 'Collaborative_Evaluation', 'Learn_What_Matters_Data_Pruning_for_Efficient_Decentralized_Learning']
      }
    ]
  },
  {
    title: 'Affiliations',
    groups: [
      {
        label: 'Profile',
        links: ['CV', 'Education', 'Experience']
      },
      {
        label: 'Institutions',
        links: ['The_Chinese_University_of_Hong_Kong', 'Zhejiang_University', 'Shandong_University', 'NUSRI_CQ']
      },
      {
        label: 'Academic network',
        links: ['Angela_Yingjun_Zhang', 'Meng_Zhang']
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

  return (
    <article className="wiki-portal" data-page-slug="Xinbao_Qiao">
      <section className="wiki-portal-hero" aria-labelledby="portal-title">
        <div className="wiki-portal-masthead">
          <div className="wiki-portal-brand">
            <img
              className="wiki-portal-emblem"
              src={pathWithBasePath('/xinbaopedia-icon.png')}
              alt=""
              aria-hidden="true"
            />
            <h1 className="wiki-portal-name" id="portal-title">Xinbao Qiao</h1>
          </div>
        </div>
        <div className="wiki-portal-search">
          <WikiSearch items={searchIndex} showLanguageSelect variant="portal" />
        </div>
        <nav className="wiki-portal-editions" aria-label="Primary academic entries">
          {languageEntries.map((item) => (
            <a className="wiki-portal-edition" href={wikiHref(item.slug)} key={item.slug}>
              <strong>{item.label}</strong>
              <span>{item.detail}</span>
            </a>
          ))}
        </nav>
      </section>

      <details className="wiki-portal-directory" open>
        <summary>
          <span>Browse Xinbaopedia</span>
        </summary>
        <div className="wiki-portal-grid">
          {directorySections.map((section) => {
            const sectionId = `portal-${section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
            return (
              <section className="wiki-portal-block" aria-labelledby={sectionId} key={section.title}>
                <h3 id={sectionId}>{section.title}</h3>
                {section.groups.map((group) => (
                  <div className="wiki-portal-group" key={group.label}>
                    <p className="wiki-portal-group-label">{group.label}</p>
                    <ul>
                      {group.links.map((slug) => {
                        const item = entry(slug);
                        return (
                          <li key={slug}>
                            <a href={item.href}>{item.title}</a>
                            {item.summary && <span>{item.summary}</span>}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </section>
            );
          })}
        </div>
      </details>
    </article>
  );
}
