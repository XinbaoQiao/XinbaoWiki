'use client';

import { useEffect, useState } from 'react';
import styles from '@/app/site-activity-preferences/preferences.module.css';

type PreferenceStatus = 'error' | 'included' | 'excluded' | 'loading' | 'saving' | 'unavailable';

function withBasePath(pathname: string) {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');
  return basePath ? `${basePath}${pathname}` : pathname;
}

async function readPreference(endpoint: string, signal?: AbortSignal): Promise<PreferenceStatus> {
  const response = await fetch(endpoint, {
    cache: 'no-store',
    credentials: 'same-origin',
    signal
  });
  if (!response.ok) throw new Error('preference status failed');
  const payload = await response.json() as { enabled?: boolean; excluded?: boolean };
  if (!payload.enabled) return 'unavailable';
  return payload.excluded ? 'excluded' : 'included';
}

export function SiteActivityPreferences() {
  const [status, setStatus] = useState<PreferenceStatus>('loading');
  const endpoint = withBasePath('/api/site-activity/preference/');

  useEffect(() => {
    const controller = new AbortController();
    void readPreference(endpoint, controller.signal)
      .then(setStatus)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setStatus('error');
      });
    return () => controller.abort();
  }, [endpoint]);

  async function updatePreference(excluded: boolean) {
    setStatus('saving');
    try {
      const response = await fetch(endpoint, {
        cache: 'no-store',
        credentials: 'same-origin',
        method: excluded ? 'POST' : 'DELETE'
      });
      if (!response.ok) throw new Error('preference update failed');
      setStatus(excluded ? 'excluded' : 'included');
    } catch {
      try {
        setStatus(await readPreference(endpoint));
      } catch {
        setStatus('error');
      }
    }
  }

  const excluded = status === 'excluded';
  const busy = status === 'loading' || status === 'saving';
  const disabled = busy || status === 'unavailable';
  const stateCopy = status === 'loading'
    ? 'Checking this browser… / 正在检查此浏览器……'
    : status === 'saving'
      ? 'Saving… / 正在保存……'
      : status === 'excluded'
        ? 'Excluded / 已排除'
        : status === 'included'
          ? 'Included / 已计入'
          : status === 'unavailable'
            ? 'Statistics are not configured / 统计尚未配置'
            : 'Preference unavailable / 偏好设置暂不可用';

  return (
    <section aria-labelledby="site-activity-preference-title" className={styles.panel}>
      <div className={styles.stateRow}>
        <h2 id="site-activity-preference-title">This browser / 此浏览器</h2>
        <strong aria-live="polite" data-state={status}>{stateCopy}</strong>
      </div>
      <p>
        Exclusion follows this browser across countries and regions. A different browser, device,
        private window, or cleared cookie must be excluded separately.
        <span lang="zh-CN">排除设置会跟随此浏览器，不受国家或地区变化影响；其他浏览器、设备、无痕窗口或清除 Cookie 后需要分别设置。</span>
      </p>
      <p>
        Existing lifetime aggregates cannot remove one earlier browser entry. This setting prevents
        new activity from this browser after it is enabled.
        <span lang="zh-CN">已有全历史聚合无法单独删除某个较早的浏览器记录；启用后，此浏览器的新访问将不再计入。</span>
      </p>
      <button
        className={styles.button}
        disabled={disabled}
        onClick={() => void updatePreference(!excluded)}
        type="button"
      >
        {excluded ? 'Include this browser / 重新计入此浏览器' : 'Exclude this browser / 排除此浏览器'}
      </button>
    </section>
  );
}
