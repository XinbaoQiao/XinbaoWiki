import { getWikiPageBySlug, pathWithBasePath } from '@/lib/wiki';

const navigation = ['Xinbao_Qiao', 'Research', 'Publications', 'Projects', 'CV', 'index', 'log'];
const notableWorks = [
  'When_Sample_Selection_Bias_Precipitates_Model_Collapse',
  'Soft_Weighted_Machine_Unlearning',
  'Hessian_Free_Online_Certified_Unlearning',
  'DynFrs'
];
const experience = ['The_Chinese_University_of_Hong_Kong', 'NUSRI_CQ', 'Zhejiang_University'];
const education = ['Zhejiang_University', 'Shandong_University'];
const profiles: [string, string][] = [
  ['Google Scholar', 'https://scholar.google.com/citations?user=nhC_OfEAAAAJ&hl=en'],
  ['GitHub', 'https://github.com/XinbaoQiao'],
  ['OpenReview', 'https://openreview.net/profile?id=~Xinbao_Qiao1'],
  ['ORCID', 'https://orcid.org/0009-0007-8359-7701'],
  ['DBLP', 'https://dblp.uni-trier.de/pid/374/6619.html'],
  ['Hugging Face', 'https://huggingface.co/MrCiao']
];

function wikiHref(slug: string) {
  return pathWithBasePath(`/wiki/${encodeURIComponent(slug)}/`);
}

function label(slug: string) {
  return slug.replaceAll('_', ' ');
}

function NavSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="nav-section">
      <h2>{title}</h2>
      <nav className="nav-list">
        {items.map((item) => (
          <a key={item} href={wikiHref(item)}>
            {label(item)}
          </a>
        ))}
      </nav>
    </section>
  );
}

export function Sidebar() {
  const bio = getWikiPageBySlug('Xinbao_Qiao');
  const avatar = typeof bio?.data.avatar === 'string' ? bio.data.avatar : '';
  return (
    <aside className="sidebar">
      <a className="site-title" href={pathWithBasePath('/')}>Xinbaopedia</a>
      <div className="brand">
        {avatar && <img className="portrait" src={pathWithBasePath(avatar)} alt="Qiao Xinbao portrait" />}
        <h1>Xinbao Qiao</h1>
        <div className="native">乔鑫宝 · Xinbao Qiao</div>
      </div>
      <NavSection title="Navigation" items={navigation} />
      <NavSection title="Notable works" items={notableWorks} />
      <NavSection title="Experience" items={experience} />
      <NavSection title="Education" items={education} />
      <section className="nav-section">
        <h2>Contribute</h2>
        <nav className="nav-list">
          <a href="mailto:xinbaoqiao@cuhk.edu.hk">Email the author</a>
          <a href="https://github.com/XinbaoQiao" target="_blank" rel="noreferrer">GitHub</a>
        </nav>
      </section>
      <section className="nav-section">
        <h2>Profiles</h2>
        <div className="external-links">
          {profiles.map(([name, url]) => (
            <a key={name} className="pill" href={url} target="_blank" rel="noreferrer">{name}</a>
          ))}
        </div>
      </section>
    </aside>
  );
}
