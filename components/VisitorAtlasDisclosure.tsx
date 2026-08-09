'use client';

import { useEffect, useRef, useState } from 'react';
import type { SearchLanguage } from '@/components/WikiSearch';
import {
  parseSiteActivityPayload,
  SITE_ACTIVITY_MAP_HEIGHT,
  SITE_ACTIVITY_MAP_WIDTH,
  type SiteActivityPayload
} from '@/lib/site-activity';

type Props = {
  language: SearchLanguage;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

type ActivityStatus = 'empty' | 'error' | 'loading' | 'ready' | 'unavailable';

type VisitorAtlasCopy = {
  caveat: string;
  empty: string;
  error: string;
  high: string;
  intensity: string;
  loading: string;
  low: string;
  mapDescription: string;
  mapTitle: string;
  medium: string;
  noPublicCell: string;
  summaryFallback: string;
  summaryLoading: string;
  summaryUnavailable: string;
  threshold: (count: number) => string;
  title: string;
  unavailable: string;
  uniqueBrowsers: (count: number) => string;
  updated: (date: string) => string;
};

const clusterOffsets = [
  [0, 0],
  [-8, 0],
  [8, 0],
  [0, -8],
  [0, 8],
  [-6, -6],
  [6, 6]
] as const;

const copy = {
  en: {
    caveat: 'Approximate IP-derived activity. The browser receives no raw IP, exact geographic coordinates, or region list.',
    empty: 'No map cell has reached the public display threshold yet.',
    error: 'The visitor map is temporarily unavailable.',
    high: 'High',
    intensity: 'Public intensity',
    loading: 'Loading the anonymous visitor map…',
    low: 'Low',
    mapDescription: 'A dotted world silhouette with coarse, delayed activity clusters. Colors represent ranges, not exact visitor counts.',
    mapTitle: 'Anonymous visitor activity world map',
    medium: 'Medium',
    noPublicCell: 'Not public',
    summaryFallback: '30 days · anonymous aggregate',
    summaryLoading: '30 days · loading',
    summaryUnavailable: 'Anonymous map · not configured',
    threshold: (count: number) => `Cells appear only after at least ${count} estimated browsers.`,
    title: 'Site activity',
    unavailable: 'Statistics are not configured yet. The map will remain neutral until collection begins.',
    uniqueBrowsers: (count: number) => `≈ ${count.toLocaleString('en')} browsers · 30 complete days`,
    updated: (date: string) => `Updated ${date} · UTC days · one-day delay`
  },
  zh: {
    caveat: '基于 IP 推断的近似访问密度；浏览器不会收到原始 IP、地理经纬度或地区列表。',
    empty: '目前还没有地图单元达到公开显示阈值。',
    error: '访问地图暂时无法获取。',
    high: '高',
    intensity: '公开强度',
    loading: '正在载入匿名访问地图……',
    low: '低',
    mapDescription: '点阵世界轮廓显示经过延迟和粗化的访问密度。颜色代表区间，不代表精确访客数。',
    mapTitle: '匿名访问足迹世界地图',
    medium: '中',
    noPublicCell: '未公开',
    summaryFallback: '近 30 天 · 匿名聚合',
    summaryLoading: '近 30 天 · 正在载入',
    summaryUnavailable: '匿名地图 · 尚未配置',
    threshold: (count: number) => `单元达到至少 ${count} 个估算浏览器后才会显示。`,
    title: '访问足迹',
    unavailable: '统计尚未配置；开始收集前，地图会保持中性。',
    uniqueBrowsers: (count: number) => `近 30 个完整日约 ${count.toLocaleString('zh-CN')} 个浏览器`,
    updated: (date: string) => `更新于 ${date} · UTC 完整日 · 延迟一天`
  }
} satisfies Record<SearchLanguage, VisitorAtlasCopy>;

function withBasePath(pathname: string) {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');
  return basePath ? `${basePath}${pathname}` : pathname;
}

function formatDate(isoDate: string, language: SearchLanguage) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate.slice(0, 10);
  return new Intl.DateTimeFormat(language === 'zh' ? 'zh-CN' : 'en', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric'
  }).format(date);
}

export function VisitorAtlasDisclosure({ language, onOpenChange, open }: Props) {
  const [payload, setPayload] = useState<SiteActivityPayload | null>(null);
  const [status, setStatus] = useState<ActivityStatus>('loading');
  const recordedRef = useRef(false);
  const labels = copy[language];
  const apiPath = withBasePath('/api/site-activity/');

  useEffect(() => {
    if (recordedRef.current) return;
    recordedRef.current = true;
    void fetch(apiPath, {
      cache: 'no-store',
      credentials: 'same-origin',
      keepalive: true,
      method: 'POST'
    }).catch(() => {
      // Public statistics must never block or disturb the homepage.
    });
  }, [apiPath]);

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    void fetch(apiPath, {
      cache: 'no-store',
      credentials: 'same-origin',
      signal: controller.signal
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('site activity response failed');
        const nextPayload = parseSiteActivityPayload(await response.json());
        if (!nextPayload) throw new Error('site activity response was invalid');
        setPayload(nextPayload);
        if (!nextPayload.enabled) {
          setStatus('unavailable');
        } else if (nextPayload.uniqueBrowsersEstimate === null || nextPayload.cells.length === 0) {
          setStatus('empty');
        } else {
          setStatus('ready');
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setStatus('error');
      });
    return () => controller.abort();
  }, [apiPath]);

  const summary = status === 'loading'
    ? labels.summaryLoading
    : status === 'unavailable'
      ? labels.summaryUnavailable
      : payload?.uniqueBrowsersEstimate !== null && payload?.uniqueBrowsersEstimate !== undefined
        ? labels.uniqueBrowsers(payload.uniqueBrowsersEstimate)
        : labels.summaryFallback;
  const statusMessage = status === 'loading'
    ? labels.loading
    : status === 'unavailable'
      ? labels.unavailable
      : status === 'error'
        ? labels.error
        : status === 'empty'
          ? labels.empty
          : payload
            ? labels.updated(formatDate(payload.generatedAt, language))
            : labels.error;
  const threshold = payload?.thresholds.cell ?? 5;

  return (
    <details
      className="wiki-portal-activity wiki-portal-timeline"
      id="portal-activity"
      onToggle={(event) => onOpenChange(event.currentTarget.open)}
      open={open}
    >
      <summary>
        <span className="wiki-portal-timeline-heading">
          <strong>{labels.title}</strong>
          <em>{summary}</em>
        </span>
      </summary>
      <div
        aria-busy={status === 'loading'}
        className="wiki-visitor-atlas"
        data-status={status}
      >
        <figure aria-describedby="visitor-atlas-note">
          <svg
            aria-describedby="visitor-atlas-description visitor-atlas-note"
            aria-labelledby="visitor-atlas-title"
            className="wiki-visitor-atlas-map"
            role="img"
            viewBox={`0 0 ${SITE_ACTIVITY_MAP_WIDTH} ${SITE_ACTIVITY_MAP_HEIGHT}`}
          >
            <title id="visitor-atlas-title">{labels.mapTitle}</title>
            <desc id="visitor-atlas-description">{labels.mapDescription}</desc>
            <image
              height={SITE_ACTIVITY_MAP_HEIGHT}
              href={withBasePath('/maps/world-land-dots.svg')}
              width={SITE_ACTIVITY_MAP_WIDTH}
              x="0"
              y="0"
            />
            {payload?.cells.map((cell, index) => (
              <g className={`wiki-visitor-atlas-cluster level-${cell.level}`} key={`${cell.x}-${cell.y}-${index}`}>
                {clusterOffsets.map(([offsetX, offsetY]) => (
                  <circle
                    cx={cell.x + offsetX}
                    cy={cell.y + offsetY}
                    key={`${offsetX}-${offsetY}`}
                    r={cell.level === 3 ? 3.8 : cell.level === 2 ? 3.35 : 3}
                  />
                ))}
              </g>
            ))}
          </svg>
          <figcaption>
            <span className="wiki-visitor-atlas-legend" aria-label={labels.intensity}>
              <b>{labels.intensity}</b>
              <span><i className="level-0" />{labels.noPublicCell}</span>
              <span><i className="level-1" />{labels.low}</span>
              <span><i className="level-2" />{labels.medium}</span>
              <span><i className="level-3" />{labels.high}</span>
            </span>
            <span>{labels.threshold(threshold)}</span>
          </figcaption>
        </figure>
        <p aria-live="polite" className="wiki-visitor-atlas-status" role="status">{statusMessage}</p>
        <p className="wiki-visitor-atlas-note" id="visitor-atlas-note">{labels.caveat}</p>
      </div>
    </details>
  );
}
