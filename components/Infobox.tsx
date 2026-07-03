import { Fragment, type ReactNode } from 'react';
import type { LinkItem, WikiFrontmatter } from '@/lib/wiki';
import { pathWithBasePath, toChineseSlug, toEnglishSlug } from '@/lib/wiki';

type InfoboxLanguage = 'en' | 'zh';
type Props = { data: WikiFrontmatter; language?: InfoboxLanguage };

const labels: Record<string, string> = {
  native_name: 'Native name',
  born: 'Born',
  nationality: 'Nationality',
  residence: 'Residence',
  occupation: 'Occupation',
  affiliation: 'Affiliation',
  education: 'Education',
  person: 'Person',
  program: 'Program',
  school: 'School',
  department: 'Department',
  dates: 'Dates',
  place: 'Location',
  focus: 'Focus',
  type: 'Type',
  authors: 'Authors',
  venue: 'Venue',
  location: 'Conference location',
  year: 'Year',
  status: 'Status',
  publication_type: 'Publication type',
  links: 'Contact'
};

const zhLabels: Record<string, string> = {
  native_name: '本名',
  born: '出生',
  nationality: '国籍',
  residence: '居住地',
  occupation: '职业',
  affiliation: '现机构',
  education: '教育经历',
  person: '人物',
  program: '项目',
  school: '学院',
  department: '系所',
  dates: '时间',
  place: '地点',
  focus: '方向',
  type: '类型',
  authors: '作者',
  venue: '会议',
  location: '会议地点',
  year: '年份',
  status: '状态',
  publication_type: '论文类型',
  links: '联系方式'
};

const order = [
  'native_name',
  'born',
  'nationality',
  'residence',
  'occupation',
  'affiliation',
  'education',
  'type',
  'person',
  'program',
  'school',
  'department',
  'dates',
  'place',
  'focus',
  'authors',
  'venue',
  'location',
  'year',
  'status',
  'publication_type'
];

function empty(value: unknown) {
  return value === null || value === undefined || (typeof value === 'string' && !value.trim()) || (Array.isArray(value) && value.length === 0);
}

function infoboxTextValues(value: unknown): string[] {
  if (empty(value)) return [];
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return [String(value)];
  if (Array.isArray(value)) return value.flatMap(infoboxTextValues);
  return [];
}

function normalizeInfoboxText(value: string) {
  return value.replace(/\s+/g, ' ').trim().toLocaleLowerCase();
}

function sameInfoboxText(left: unknown, right: unknown) {
  const rightValues = new Set(infoboxTextValues(right).map(normalizeInfoboxText).filter(Boolean));
  return infoboxTextValues(left).map(normalizeInfoboxText).some((value) => rightValues.has(value));
}

function isLink(value: unknown): value is LinkItem {
  return typeof value === 'object' && value !== null && 'label' in value && 'url' in value;
}

function localizeUrl(url: string, language: InfoboxLanguage) {
  const wikiMatch = url.match(/^\/wiki\/([^/?#]+)\/?([?#].*)?$/);
  if (!wikiMatch) return pathWithBasePath(url);
  const slug = decodeURIComponent(wikiMatch[1] || '');
  const suffix = wikiMatch[2] || '';
  const localizedSlug = language === 'zh' ? toChineseSlug(slug) : toEnglishSlug(slug);
  return pathWithBasePath(`/wiki/${encodeURIComponent(localizedSlug)}/${suffix}`);
}

function scalar(value: string | number | boolean, language: InfoboxLanguage) {
  const text = String(value);
  const href = pathWithBasePath(text);
  if (/^https?:\/\//.test(text) || text.startsWith('mailto:') || text.startsWith('/')) {
    return (
      <a href={href} target={text.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
        {text.replace(/^mailto:/, '')}
      </a>
    );
  }
  return text;
}

function lineGroup(lines: ReactNode[]) {
  return (
    <span className="infobox-lines">
      {lines.map((line, index) => (
        <span className="infobox-line" key={index}>{line}</span>
      ))}
    </span>
  );
}

function renderString(value: string, language: InfoboxLanguage) {
  const lines = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length > 1) return lineGroup(lines.map((line) => scalar(line, language)));
  return scalar(value, language);
}

function render(value: unknown, language: InfoboxLanguage): ReactNode {
  if (empty(value)) return null;
  if (typeof value === 'string') return renderString(value, language);
  if (typeof value === 'number' || typeof value === 'boolean') return scalar(value, language);
  if (Array.isArray(value)) {
    return lineGroup(value.map((item, index) => <Fragment key={index}>{render(item, language)}</Fragment>));
  }
  if (isLink(value)) {
    return (
      <>
        <a href={localizeUrl(value.url, language)} target={value.url.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
          {value.label}
        </a>
        {value.detail && (
          <>
            <br />
            <span className="infobox-detail">{value.detail}</span>
          </>
        )}
      </>
    );
  }
  if (typeof value === 'object') return <span>{Object.values(value as Record<string, unknown>).filter(Boolean).join(', ')}</span>;
  return null;
}

export function Infobox({ data, language = 'en' }: Props) {
  const title = typeof data.name === 'string' ? data.name : 'Infobox';
  const image = typeof data.image === 'string' ? data.image : '';
  const caption = typeof data.image_caption === 'string' ? data.image_caption : '';
  const rowLabels = language === 'zh' ? zhLabels : labels;
  const rows = order
    .filter((key) => !empty(data[key]) && (key !== 'type' || !sameInfoboxText(data.type, data.occupation)))
    .map((key) => (
      <tr key={key}>
        <th>{rowLabels[key] || labels[key] || key.replaceAll('_', ' ')}</th>
        <td>{render(data[key], language)}</td>
      </tr>
    ));
  const links = Array.isArray(data.links) ? data.links.filter(isLink) : [];
  if (!rows.length && !image) return null;
  return (
    <aside className="wiki-infobox">
      <div className="wiki-infobox-title">{title}</div>
      {image && (
        <div className="wiki-infobox-image">
          <img src={pathWithBasePath(image)} alt={`${title} image`} />
          {caption && <div className="wiki-infobox-caption">{caption}</div>}
        </div>
      )}
      {rows.length > 0 && (
        <table>
          <tbody>{rows}</tbody>
        </table>
      )}
      {links.length > 0 && (
        <>
          <div className="wiki-infobox-section">{language === 'zh' ? '联系方式' : 'Contact'}</div>
          <table>
            <tbody>
              {links.map((item) => {
                const label = item.title || (item.url.startsWith('mailto:') ? (language === 'zh' ? '邮箱' : 'Email') : item.label);
                return (
                  <tr key={`${item.label}-${item.url}`}>
                    <th>{label}</th>
                    <td>{render(item, language)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </aside>
  );
}
