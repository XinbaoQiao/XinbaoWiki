import type { Metadata } from 'next';
import { siteUpdates } from '@/lib/site-updates';
import { pathWithBasePath } from '@/lib/wiki';
import styles from './updates.module.css';

export const metadata: Metadata = {
  title: 'Updates',
  description: 'Recent academic milestones and research updates from Xinbao Qiao.',
  alternates: { canonical: '/updates/' }
};

const sectionCopy = {
  en: { heading: 'English', label: 'English updates', summary: 'Selected academic milestones and research news, listed newest first.' },
  zh: { heading: '中文', label: '中文动态', summary: '精选学术里程碑与研究动态，按时间倒序排列。' }
} as const;

export default function UpdatesPage() {
  return (
    <article className={`wiki-page ${styles.page}`} data-page-slug="Updates">
      <h1 className={`wiki-title ${styles.title}`}>Updates <span lang="zh-CN">/ 最新动态</span></h1>
      <p className={styles.intro}>
        A readable archive of recent academic milestones and research news.
        <span lang="zh-CN">这里收录近期学术里程碑与研究动态。</span>
      </p>

      <nav className={styles.languageNav} aria-label="Update languages / 动态语言">
        <a href="#updates-en">English</a>
        <a href="#updates-zh">中文</a>
      </nav>

      <div className={styles.columns}>
        {(Object.keys(sectionCopy) as Array<keyof typeof sectionCopy>).map((language) => {
          const copy = sectionCopy[language];
          return (
            <section aria-labelledby={`updates-${language}-title`} className={styles.section} id={`updates-${language}`} key={language} lang={language === 'zh' ? 'zh-CN' : 'en'}>
              <h2 id={`updates-${language}-title`}>{copy.heading}</h2>
              <p className={styles.sectionSummary}>{copy.summary}</p>
              <ol aria-label={copy.label} className={styles.list}>
                {siteUpdates[language].map((item) => (
                  <li key={`${item.dateTime}-${item.title}`}>
                    <time dateTime={item.dateTime}>{item.date}</time>
                    <div>
                      <a href={pathWithBasePath(item.href)}>{item.title}</a>
                      <p>{item.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>

      <aside className={styles.subscribe} aria-labelledby="updates-subscribe-title">
        <h2 id="updates-subscribe-title">Subscribe <span lang="zh-CN">/ 订阅</span></h2>
        <p>
          <a href={pathWithBasePath('/feed.xml')}>Atom feed</a> is intended for RSS/Atom readers; opening it directly in a browser may show XML source.
          <span lang="zh-CN"><a href={pathWithBasePath('/feed.xml')}>Atom 订阅源</a>专供 RSS/Atom 阅读器使用；在浏览器中直接打开时可能会显示 XML 源码。</span>
        </p>
      </aside>
    </article>
  );
}
