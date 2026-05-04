import { pathWithBasePath } from '@/lib/wiki';

const navigation = ['Xinbao_Qiao'];
const notableWorks = [
  'When_Sample_Selection_Bias_Precipitates_Model_Collapse',
  'Soft_Weighted_Machine_Unlearning',
  'Hessian_Free_Online_Certified_Unlearning',
  'DynFrs'
];
const experience = ['The_Chinese_University_of_Hong_Kong', 'NUSRI_CQ', 'Zhejiang_University'];
const education = ['Zhejiang_University', 'Shandong_University'];

function wikiHref(slug: string) {
  return pathWithBasePath(`/wiki/${encodeURIComponent(slug)}/`);
}

function label(slug: string) {
  return slug.replaceAll('_', ' ');
}

function NavSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="nav-section">
      <h4>{title}</h4>
      <ul>
        {items.map((item) => (
          <li key={item}>
            <a href={wikiHref(item)}>{item === 'Xinbao_Qiao' ? 'Main page' : label(item)}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Sidebar() {
  return (
    <aside className="wiki-sidebar">
      <NavSection title="Navigation" items={navigation} />
      <NavSection title="Notable works" items={notableWorks} />
      <NavSection title="Experience" items={experience} />
      <NavSection title="Education" items={education} />
      <section className="nav-section">
        <h4>Contribute</h4>
        <ul>
          <li><a className="external" href="mailto:xinbaoqiao@cuhk.edu.hk">Email the author</a></li>
          <li><a className="external" href="https://github.com/XinbaoQiao/XinbaoWiki" target="_blank" rel="noreferrer">Source repository</a></li>
        </ul>
      </section>
    </aside>
  );
}
