import { pathWithBasePath } from '@/lib/wiki';

const navigation = ['Xinbao_Qiao', 'Publications'];
const researchTopics = ['AI_and_Networks', 'Machine_Unlearning', 'Synthetic_Data_and_Model_Collapse', 'Data_Centric_Machine_Learning'];
const experience = ['NUSRI_CQ'];
const education = ['The_Chinese_University_of_Hong_Kong', 'Zhejiang_University', 'Shandong_University'];

const navLabels: Record<string, string> = {
  'Xinbao_Qiao': 'Main page',
  'AI_and_Networks': 'AI and Networks',
  'Machine_Unlearning': 'Machine Unlearning',
  'Synthetic_Data_and_Model_Collapse': 'Synthetic Data',
  'Data_Centric_Machine_Learning': 'Data Centric ML',
  'The_Chinese_University_of_Hong_Kong': 'CUHK',
  'NUSRI_CQ': 'NUSRI-CQ',
  'Zhejiang_University': 'ZJU',
  'Shandong_University': 'SDU'
};

function wikiHref(slug: string) {
  return pathWithBasePath(`/wiki/${encodeURIComponent(slug)}/`);
}

function label(slug: string) {
  if (navLabels[slug]) return navLabels[slug];
  return slug.replaceAll('_', ' ');
}

export function Sidebar() {
  return (
    <aside className="wiki-sidebar" aria-label="Navigation">
      <h4>Navigation</h4>
      <ul>
        {navigation.map((item) => (
          <li key={item}><a href={wikiHref(item)}>{label(item)}</a></li>
        ))}
      </ul>

      <h4>Research topics</h4>
      <ul>
        {researchTopics.map((item) => (
          <li key={item}><a href={wikiHref(item)}>{label(item)}</a></li>
        ))}
      </ul>

      <h4>Education</h4>
      <ul>
        {education.map((item) => (
          <li key={item}><a href={wikiHref(item)}>{label(item)}</a></li>
        ))}
      </ul>

      <h4>Experience</h4>
      <ul>
        {experience.map((item) => (
          <li key={item}><a href={wikiHref(item)}>{label(item)}</a></li>
        ))}
      </ul>

      <h4>Contribute</h4>
      <ul>
        <li>
          <a
            className="external"
            href="https://www.linkedin.com/in/xinbaoqiao/"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn
          </a>
        </li>
        <li><a href="mailto:xinbaoqiao@cuhk.edu.hk">Email the author</a></li>
      </ul>
    </aside>
  );
}
