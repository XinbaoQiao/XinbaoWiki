import { pathWithBasePath } from '@/lib/wiki';

const navigation = ['Xinbao_Qiao'];
const researchTopics = ['AI_and_Networks', 'Machine_Unlearning', 'Synthetic_Data_and_Model_Collapse', 'Data_Centric_Machine_Learning'];
const experience = ['The_Chinese_University_of_Hong_Kong', 'NUSRI_CQ', 'Zhejiang_University'];
const education = ['The_Chinese_University_of_Hong_Kong', 'Zhejiang_University', 'Shandong_University'];

const topicLabels: Record<string, string> = {
  'AI_and_Networks': 'AI and Networks',
  'Machine_Unlearning': 'Machine Unlearning',
  'Synthetic_Data_and_Model_Collapse': 'Synthetic Data',
  'Data_Centric_Machine_Learning': 'Data Centric ML'
};

function wikiHref(slug: string) {
  return pathWithBasePath(`/wiki/${encodeURIComponent(slug)}/`);
}

function label(slug: string) {
  if (topicLabels[slug]) return topicLabels[slug];
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
      <NavSection title="Research topics" items={researchTopics} />
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
