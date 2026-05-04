import type { ReactNode } from 'react';
import type { LinkItem, WikiFrontmatter } from '@/lib/wiki';
import { pathWithBasePath } from '@/lib/wiki';

type Props = { data: WikiFrontmatter };

const labels: Record<string, string> = {
  native_name: 'Native name',
  born: 'Born',
  birth_place: 'Birthplace',
  nationality: 'Nationality',
  residence: 'Residence',
  occupation: 'Occupation',
  affiliation: 'Affiliation',
  education: 'Education',
  type: 'Type',
  authors: 'Authors',
  venue: 'Venue',
  year: 'Year',
  status: 'Status',
  publication_type: 'Publication type',
  categories: 'Categories',
  links: 'Contact'
};

const order = [
  'native_name',
  'born',
  'birth_place',
  'nationality',
  'residence',
  'occupation',
  'affiliation',
  'education',
  'type',
  'authors',
  'venue',
  'year',
  'status',
  'publication_type',
  'categories'
];

function empty(value: unknown) {
  return value === null || value === undefined || (typeof value === 'string' && !value.trim()) || (Array.isArray(value) && value.length === 0);
}

function isLink(value: unknown): value is LinkItem {
  return typeof value === 'object' && value !== null && 'label' in value && 'url' in value;
}

function scalar(value: string | number | boolean) {
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

function render(value: unknown): ReactNode {
  if (empty(value)) return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return scalar(value);
  if (Array.isArray(value)) {
    return (
      <ul className="infobox-list">
        {value.map((item, index) => (
          <li key={index}>{render(item)}</li>
        ))}
      </ul>
    );
  }
  if (isLink(value)) {
    return (
      <>
        <a href={pathWithBasePath(value.url)} target={value.url.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
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

export function Infobox({ data }: Props) {
  const title = typeof data.name === 'string' ? data.name : 'Infobox';
  const image = typeof data.image === 'string' ? data.image : '';
  const caption = typeof data.image_caption === 'string' ? data.image_caption : '';
  const rows = order
    .filter((key) => !empty(data[key]))
    .map((key) => (
      <tr key={key}>
        <th>{labels[key] || key.replaceAll('_', ' ')}</th>
        <td>{render(data[key])}</td>
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
          <div className="wiki-infobox-section">Contact</div>
          <table>
            <tbody>
              {links.map((item) => {
                const label = item.title || (item.url.startsWith('mailto:') ? 'Email' : item.label);
                return (
                  <tr key={`${item.label}-${item.url}`}>
                    <th>{label}</th>
                    <td>{render(item)}</td>
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
