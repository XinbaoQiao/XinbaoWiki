import { PublicationLinkIcon, PublicationLinkLegend } from '@/components/PublicationLinkLegend';
import { WikiHrefLink } from '@/components/WikiHrefLink';
import { getCvDocument, type CvLanguage } from '@/lib/cv-document-data';
import { pathWithBasePath } from '@/lib/wiki';
import styles from './CvDocument.module.css';

type Props = {
  language: CvLanguage;
  editLabel: string;
  sourceHref?: string;
};

function ContactIcon({ kind }: { kind: 'phone' | 'mail' | 'home' | 'github' | 'linkedin' | 'scholar' }) {
  const common = { className: styles.serviceIcon, viewBox: '0 0 512 512', 'aria-hidden': true, focusable: 'false' as const };
  if (kind === 'phone') {
    return (
      <svg {...common}>
        <path d="M493.4 24.6l-104-24c-11.3-2.6-22.9 3.3-27.5 13.9l-48 112c-4.2 9.8-1.4 21.3 6.9 28l60.6 49.6c-36 76.7-98.9 140.5-177.2 177.2l-49.6-60.6c-6.8-8.3-18.2-11.1-28-6.9l-112 48C8.3 366.5 2.4 378.1 5 389.4l24 104C32.5 504.4 42.9 512 54.5 512 306.6 512 512 306.6 512 54.5c0-11.5-7.6-21.9-18.6-29.9z" />
      </svg>
    );
  }
  if (kind === 'mail') {
    return (
      <svg {...common}>
        <path d="M502.3 190.8c3.9-3.1 9.7-.2 9.7 4.7V400c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V195.6c0-5 5.7-7.8 9.7-4.7 22.4 17.4 52.1 39.5 154.1 113.6 21.1 15.4 56.7 47.8 92.2 47.6 35.7.3 72-32.8 92.3-47.6 102-74.1 131.6-96.3 154-113.7zM256 320c23.2.4 56.6-29.2 73.4-41.4 132.7-96.3 142.8-104.7 173.4-128.7 5.8-4.5 9.2-11.5 9.2-18.9v-19c0-26.5-21.5-48-48-48H48C21.5 64 0 85.5 0 112v19c0 7.4 3.4 14.3 9.2 18.9 30.6 23.9 40.7 32.4 173.4 128.7 16.8 12.2 50.2 41.8 73.4 41.4z" />
      </svg>
    );
  }
  if (kind === 'home') {
    return (
      <svg {...common}>
        <path d="M488 261.9V502.7c0 5.2-4.2 9.3-9.3 9.3h-146c-5.1 0-9.3-4.2-9.3-9.3V368.1c0-5.2-4.2-9.3-9.3-9.3h-93.3c-5.1 0-9.3 4.2-9.3 9.3v134.6c0 5.2-4.2 9.3-9.3 9.3H33.3c-5.1 0-9.3-4.2-9.3-9.3V261.9c0-2.6 1.1-5.1 3-6.9L244.1 21.1c6.4-6.8 17.3-6.8 23.8 0L485 255c1.9 1.8 3 4.3 3 6.9z" />
      </svg>
    );
  }
  if (kind === 'github') {
    return (
      <svg {...common} viewBox="0 0 496 512">
        <path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8z" />
      </svg>
    );
  }
  if (kind === 'linkedin') {
    return (
      <svg {...common}>
        <path d="M100.3 448H7.4V148.9h92.9V448zM53.8 108.1C24.1 108.1 0 83.5 0 53.8S24.1-.4 53.8-.4s53.8 24.6 53.8 54.3-24.1 54.2-53.8 54.2zM447.9 448h-92.7V302.4c0-34.7-.7-79.2-48.3-79.2-48.3 0-55.7 37.7-55.7 76.7V448h-92.8V148.9h89.1v40.8h1.3c12.4-23.5 42.7-48.3 87.9-48.3 94 0 111.3 61.9 111.3 142.3V448z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M496 128v16a48.03 48.03 0 0 1-48 48H48a48.03 48.03 0 0 1-48-48v-16a48 48 0 0 1 48-48h136V48c0-26.51 21.49-48 48-48h48c26.51 0 48 21.49 48 48v32h136a48 48 0 0 1 48 48zM160 464V192h32v272c0 8.84-7.16 16-16 16s-16-7.16-16-16zm80 0V192h32v272c0 8.84-7.16 16-16 16s-16-7.16-16-16zm80 0V192h32v272c0 8.84-7.16 16-16 16s-16-7.16-16-16z" />
    </svg>
  );
}

function serviceIcon(kind: 'github' | 'home' | 'scholar') {
  return <ContactIcon kind={kind === 'scholar' ? 'scholar' : kind} />;
}

function hrefWithBase(href: string) {
  if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return href;
  return pathWithBasePath(href);
}

export function CvDocument({ language, editLabel, sourceHref }: Props) {
  const cv = getCvDocument(language);
  const contactKinds = ['phone', 'mail', 'home', 'github', 'linkedin', 'scholar'] as const;

  return (
    <div className={`wiki-body ${styles.cvDocument}`} data-cv-document={language}>
      <header className={styles.header}>
        <h2 className={styles.name}>
          {cv.name}
          {sourceHref ? (
            <span className="edit-link">
              <a href={sourceHref} target="_blank" rel="noreferrer">{editLabel}</a>
            </span>
          ) : null}
        </h2>
        <ul className={styles.contact}>
          {cv.contact.map((item, index) => (
            <li key={item.href}>
              <ContactIcon kind={contactKinds[index]} />
              <WikiHrefLink href={item.href} applyBasePath={false}>{item.label}</WikiHrefLink>
            </li>
          ))}
          <li className={styles.contactPdf} key={cv.pdfHref}>
            <WikiHrefLink href={cv.pdfHref}>{cv.pdfLabel}</WikiHrefLink>
          </li>
        </ul>
      </header>

      <section className={styles.section} aria-labelledby="cv-education">
        <h3 id="cv-education" className={styles.sectionTitle}>{cv.sections.education}</h3>
        {cv.education.map((entry) => (
          <div key={entry.school}>
            <div className={styles.row}>
              <div>
                <span className={styles.school}>{entry.school}</span>{' '}
                <span className={styles.detail}>{entry.detail}</span>
              </div>
              <div className={styles.when}>{entry.when}</div>
            </div>
            {entry.researchAreas ? (
              <p className={styles.researchAreas}>
                <strong>{entry.researchAreas.label}</strong>
                {entry.researchAreas.text}
              </p>
            ) : null}
          </div>
        ))}
      </section>

      <section className={styles.section} aria-labelledby="cv-experience">
        <h3 id="cv-experience" className={styles.sectionTitle}>{cv.sections.experience}</h3>
        {cv.experience.map((stage) => (
          <div className={styles.experienceBlock} key={stage.title}>
            <div className={styles.row}>
              <div className={styles.school}>{stage.title}</div>
              <div className={styles.when}>{stage.when}</div>
            </div>
            <p className={styles.stageBrief}>{stage.brief}</p>
            <ul className={styles.paperList}>
              {stage.papers.map((paper) => (
                <li className={styles.paperItem} key={paper.label}>
                  <span className={styles.paperText}>{paper.text}</span>
                  <span className={styles.paperLabel}>{paper.label}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className={styles.section} aria-labelledby="cv-service">
        <h3 id="cv-service" className={styles.sectionTitle}>{cv.sections.service}</h3>
        <ul className={styles.serviceList}>
          {cv.service.map((item) => (
            <li className={styles.serviceItem} key={item.title}>
              {item.href ? (
                <WikiHrefLink href={item.href} applyBasePath={false} aria-label={item.title}>{serviceIcon(item.icon)}</WikiHrefLink>
              ) : (
                serviceIcon(item.icon)
              )}
              <span>
                {item.titleHref ? (
                  <WikiHrefLink className={styles.serviceTitle} href={item.titleHref}>{item.title}</WikiHrefLink>
                ) : (
                  <span className={styles.serviceTitle}>{item.title}</span>
                )}
                {', '}
                {item.detail}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="cv-publications">
        <h3 id="cv-publications" className={styles.sectionTitle}>{cv.sections.publications}</h3>
        <p className={styles.note}>{cv.authorshipNote}</p>
        <PublicationLinkLegend language={language} />
        <ol className={styles.pubList}>
          {cv.publications.map((pub) => (
            <li className={styles.pubItem} key={pub.number} data-cv-paper={pub.number}>
              <span className={styles.pubNum}>{pub.number}.</span>
              <div className={styles.pubMain}>
                <div className={styles.pubTop}>
                  <div className={styles.pubTitle}>
                    {pub.titleParts.map((part, index) => (
                      <span key={`${pub.number}-${index}`} className={part.emph ? styles.emph : undefined}>{part.text}</span>
                    ))}
                  </div>
                  <div className={styles.pubMeta}>
                    {pub.links.length > 0 ? (
                      <span className={styles.pubLinks}>
                        {pub.links.map((link) => (
                          <a
                            key={link.href}
                            className="publication-resource-link"
                            href={hrefWithBase(link.href)}
                            aria-label={link.label}
                            title={link.label}
                          >
                            <PublicationLinkIcon href={link.href} />
                          </a>
                        ))}
                      </span>
                    ) : null}
                    <span>{pub.venue}</span>
                  </div>
                </div>
                <p className={styles.pubAuthors}>{pub.authors}</p>
                <p className={styles.pubSummary}>{pub.summary}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
