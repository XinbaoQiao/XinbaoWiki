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
  title: string;
  unavailable: string;
  uniqueBrowsers: (count: number) => string;
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
    error: 'The visitor map is temporarily unavailable.',
    high: 'High',
    intensity: 'Public intensity',
    loading: 'Loading activity map…',
    low: 'Low',
    mapDescription: 'A dotted world silhouette with low, medium, and high activity levels.',
    mapTitle: 'Visitor activity world map',
    medium: 'Medium',
    noPublicCell: 'Not public',
    summaryFallback: 'All history',
    summaryLoading: 'All history · loading',
    summaryUnavailable: 'Activity map · unavailable',
    title: 'Site activity',
    unavailable: 'Statistics are unavailable.',
    uniqueBrowsers: (count: number) => `≈ ${count.toLocaleString('en')} browsers · all history`
  },
  zh: {
    error: '访问地图暂时无法获取。',
    high: '高',
    intensity: '公开强度',
    loading: '正在载入访问地图……',
    low: '低',
    mapDescription: '点阵世界轮廓以低、中、高三级显示访问强度。',
    mapTitle: '访问足迹世界地图',
    medium: '中',
    noPublicCell: '未公开',
    summaryFallback: '全部历史',
    summaryLoading: '全部历史 · 正在载入',
    summaryUnavailable: '访问地图 · 暂不可用',
    title: '访问足迹',
    unavailable: '统计暂不可用。',
    uniqueBrowsers: (count: number) => `约 ${count.toLocaleString('zh-CN')} 个浏览器 · 全部历史`
  }
} satisfies Record<SearchLanguage, VisitorAtlasCopy>;

function withBasePath(pathname: string) {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');
  return basePath ? `${basePath}${pathname}` : pathname;
}

function waitForRetry(delay: number, signal: AbortSignal) {
  if (signal.aborted) {
    return Promise.reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
  }
  return new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
    };
    const timer = window.setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, delay);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

async function fetchSiteActivity(apiPath: string, signal: AbortSignal) {
  const retryDelays = [0, 500, 1500, 3000];
  for (let attempt = 0; attempt < retryDelays.length; attempt += 1) {
    if (retryDelays[attempt] > 0) await waitForRetry(retryDelays[attempt], signal);
    const response = await fetch(apiPath, {
      cache: 'no-store',
      credentials: 'same-origin',
      signal
    });
    if (response.status === 503 && attempt < retryDelays.length - 1) continue;
    if (!response.ok) throw new Error('site activity response failed');
    const payload = parseSiteActivityPayload(await response.json());
    if (!payload) throw new Error('site activity response was invalid');
    return payload;
  }
  throw new Error('site activity response failed');
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
    void fetchSiteActivity(apiPath, controller.signal)
      .then((nextPayload) => {
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
        : null;

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
        <figure>
          <svg
            aria-describedby="visitor-atlas-description"
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
          </figcaption>
        </figure>
        {statusMessage ? (
          <p aria-live="polite" className="wiki-visitor-atlas-status" role="status">{statusMessage}</p>
        ) : null}
      </div>
    </details>
  );
}
