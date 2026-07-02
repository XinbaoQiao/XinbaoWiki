import { WikiSearch } from '@/components/WikiSearch';
import { getSearchIndex, getWikiPageBySlug, pathWithBasePath } from '@/lib/wiki';

const languageEntries = [
  { label: 'English', slug: 'Xinbao_Qiao', detail: 'Academic biography and research overview' },
  { label: '中文', slug: 'Qiao_Xinbao_zh', detail: '个人学术条目与研究概览' }
];

const directorySections = [
  {
    title: 'Research topics',
    links: [
      'AI_and_Networks',
      'Data_Centric_Machine_Learning',
      'Machine_Unlearning',
      'Synthetic_Data_and_Model_Collapse',
      'Distributed_Wasserstein_Barycenter',
      'Fairness_and_Robustness'
    ]
  },
  {
    title: 'Publications and projects',
    links: [
      'Publications',
      'Projects',
      'Hessian_Free_Online_Certified_Unlearning',
      'Soft_Weighted_Machine_Unlearning',
      'DynFrs',
      'When_Sample_Selection_Bias_Precipitates_Model_Collapse'
    ]
  },
  {
    title: 'Affiliations',
    links: [
      'The_Chinese_University_of_Hong_Kong',
      'Zhejiang_University',
      'Shandong_University',
      'NUSRI_CQ',
      'Angela_Yingjun_Zhang',
      'Meng_Zhang'
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
  const biography = getWikiPageBySlug('Xinbao_Qiao');
  const englishCount = searchIndex.filter((item) => item.language === 'en').length;
  const chineseCount = searchIndex.filter((item) => item.language === 'zh').length;

  return (
    <article className="wiki-portal" data-page-slug="Xinbao_Qiao">
      <section className="wiki-portal-hero" aria-labelledby="portal-title">
        <img
          className="wiki-portal-emblem"
          src={pathWithBasePath('/xinbaopedia-icon.svg')}
          alt=""
          aria-hidden="true"
        />
        <h1 id="portal-title">Xinbaopedia</h1>
        <p className="wiki-portal-tagline">The academic wiki of Xinbao Qiao</p>
        <div className="wiki-portal-search">
          <WikiSearch items={searchIndex} showChat={false} variant="portal" />
        </div>
        <p className="wiki-portal-count">
          {englishCount} English entries · {chineseCount} Chinese entries
        </p>
        <div className="wiki-portal-languages" aria-label="Primary languages">
          {languageEntries.map((item) => (
            <a className="wiki-portal-language" href={wikiHref(item.slug)} key={item.slug}>
              <strong>{item.label}</strong>
              <span>{item.detail}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="wiki-portal-featured" aria-labelledby="featured-entry-title">
        <div>
          <p className="wiki-portal-kicker">Featured entry</p>
          <h2 id="featured-entry-title">{biography?.title || 'Xinbao Qiao'}</h2>
          {biography?.summary && <p>{biography.summary}</p>}
        </div>
        <ul className="wiki-portal-actions" aria-label="Featured entry links">
          <li><a href={wikiHref('Xinbao_Qiao')}>Read English article</a></li>
          <li><a href={wikiHref('Qiao_Xinbao_zh')}>阅读中文条目</a></li>
          <li><a href={wikiHref('Publications')}>View publications</a></li>
        </ul>
      </section>

      <section className="wiki-portal-directory" aria-labelledby="directory-title">
        <h2 id="directory-title">Browse Xinbaopedia</h2>
        <div className="wiki-portal-grid">
          {directorySections.map((section) => {
            const sectionId = `portal-${section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
            return (
              <section className="wiki-portal-block" aria-labelledby={sectionId} key={section.title}>
                <h3 id={sectionId}>{section.title}</h3>
                <ul>
                  {section.links.map((slug) => {
                    const item = entry(slug);
                    return (
                      <li key={slug}>
                        <a href={item.href}>{item.title}</a>
                        {item.summary && <span>{item.summary}</span>}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </section>
    </article>
  );
}
