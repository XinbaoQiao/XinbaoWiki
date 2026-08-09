import type { Metadata } from 'next';
import { SiteActivityPreferences } from '@/components/SiteActivityPreferences';
import styles from './preferences.module.css';

export const metadata: Metadata = {
  title: 'Site activity preference',
  description: 'Control whether this browser contributes to the public Xinbaopedia activity map.',
  robots: { index: false, follow: false }
};

export default function SiteActivityPreferencesPage() {
  return (
    <article className={`wiki-page ${styles.page}`} data-page-slug="Site_activity_preferences">
      <h1 className={`wiki-title ${styles.title}`}>Site activity preference <span lang="zh-CN">/ 访问统计偏好</span></h1>
      <p className={styles.intro}>
        Choose whether this browser contributes to the public activity map.
        <span lang="zh-CN">选择是否让此浏览器计入公开访问地图。</span>
      </p>
      <SiteActivityPreferences />
    </article>
  );
}
