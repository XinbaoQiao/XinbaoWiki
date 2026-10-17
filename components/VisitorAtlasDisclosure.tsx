'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { SearchLanguage } from '@/components/WikiSearch';
import {
  parseSiteActivityPayload,
  SITE_ACTIVITY_API_PATH,
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
type OwnerGateStatus = 'checking' | 'error' | 'idle' | 'rate-limited' | 'saving' | 'success' | 'unavailable';
type OwnerNetwork = { ip: string | null; country: string; region: string; city: string | null; browser: string; os: string; device: string };
type OwnerReceipt = { network: OwnerNetwork; checkedAt: string; auditSaved?: boolean; actionId?: string | null };

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
  ownerCancel: string;
  ownerClose: string;
  ownerDescription: string;
  ownerExcluded: string;
  ownerIncluded: string;
  ownerInvalid: string;
  ownerLabel: string;
  ownerRateLimited: string;
  ownerSubmitExclude: string;
  ownerSubmitInclude: string;
  ownerTitle: string;
  ownerUnavailable: string;
  ownerWorking: string;
  ownerInspect: string;
  ownerCurrentIp: string;
  ownerCurrentStatus: string;
  ownerStatusExcluded: string;
  ownerStatusIncluded: string;
  ownerScope: string;
  ownerAuditSaved: string;
  ownerAuditMissing: string;
  ownerUnknownIp: string;
  retry: string;
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
    ownerCancel: 'Cancel',
    ownerClose: 'Close activity controls',
    ownerDescription: 'Enter the private password. Changes apply to future visits from this browser.',
    ownerExcluded: 'This browser is now excluded from future activity.',
    ownerIncluded: 'This browser will be included in future activity.',
    ownerInvalid: 'Password not accepted.',
    ownerLabel: 'Password',
    ownerRateLimited: 'Too many attempts. Try again later.',
    ownerSubmitExclude: 'Exclude this browser',
    ownerSubmitInclude: 'Include this browser',
    ownerTitle: 'Activity controls',
    ownerUnavailable: 'Private controls are temporarily unavailable.',
    ownerWorking: 'Verifying…',
    ownerInspect: 'Check this browser and IP',
    ownerCurrentIp: 'Current public IP',
    ownerCurrentStatus: 'This browser',
    ownerStatusExcluded: 'Excluded from future visits',
    ownerStatusIncluded: 'Included in future visits',
    ownerScope: 'Applies to this browser across network changes. Other browsers need their own setting. Earlier visits remain recorded.',
    ownerAuditSaved: 'Private action receipt saved for 30 calendar days.',
    ownerAuditMissing: 'The browser setting was applied, but its private action receipt could not be saved.',
    ownerUnknownIp: 'Unavailable for this request',
    retry: 'Retry',
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
    ownerCancel: '取消',
    ownerClose: '关闭访问统计设置',
    ownerDescription: '请输入私密密码。设置仅影响此浏览器验证后的未来访问。',
    ownerExcluded: '此浏览器之后的访问将不再计入。',
    ownerIncluded: '此浏览器之后的访问将重新计入。',
    ownerInvalid: '密码未通过验证。',
    ownerLabel: '密码',
    ownerRateLimited: '尝试次数过多，请稍后再试。',
    ownerSubmitExclude: '排除此浏览器',
    ownerSubmitInclude: '重新计入此浏览器',
    ownerTitle: '访问统计设置',
    ownerUnavailable: '私密设置暂时不可用。',
    ownerWorking: '正在验证……',
    ownerInspect: '核对本浏览器与 IP',
    ownerCurrentIp: '当前公网 IP',
    ownerCurrentStatus: '当前浏览器',
    ownerStatusExcluded: '之后的访问已排除',
    ownerStatusIncluded: '之后的访问仍计入',
    ownerScope: '设置跟随本浏览器，更换网络后仍有效。其他浏览器需分别设置；之前的访问记录保留。',
    ownerAuditSaved: '私密操作凭据已保存，保留 30 个日历日。',
    ownerAuditMissing: '浏览器设置已生效，但本次私密操作凭据未能保存。',
    ownerUnknownIp: '本次请求无法获取',
    retry: '重试',
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
    let response: Response;
    try {
      response = await fetch(apiPath, {
        cache: 'no-store',
        credentials: 'same-origin',
        signal
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      if (attempt < retryDelays.length - 1) continue;
      throw error;
    }
    const retryable = response.status === 408 || response.status === 429 || response.status >= 500;
    if (retryable && attempt < retryDelays.length - 1) continue;
    if (!response.ok) throw new Error('site activity response failed');
    try {
      const payload = parseSiteActivityPayload(await response.json());
      if (!payload) throw new Error('site activity response was invalid');
      return payload;
    } catch (error) {
      if (attempt < retryDelays.length - 1) continue;
      throw error;
    }
  }
  throw new Error('site activity response failed');
}

export function VisitorAtlasDisclosure({ language, onOpenChange, open }: Props) {
  const [payload, setPayload] = useState<SiteActivityPayload | null>(null);
  const [status, setStatus] = useState<ActivityStatus>('loading');
  const [requestVersion, setRequestVersion] = useState(0);
  const [ownerDialogOpen, setOwnerDialogOpen] = useState(false);
  const [ownerExcluded, setOwnerExcluded] = useState(false);
  const [ownerGateStatus, setOwnerGateStatus] = useState<OwnerGateStatus>('idle');
  const [ownerReceipt, setOwnerReceipt] = useState<OwnerReceipt | null>(null);
  const [password, setOwnerPassword] = useState('');
  const ownerDialogRef = useRef<HTMLDialogElement>(null);
  const ownerRequestRef = useRef<AbortController | null>(null);
  const labels = copy[language];
  const apiPath = withBasePath(SITE_ACTIVITY_API_PATH);
  const preferencePath = withBasePath('/api/site-activity/preference/');

  useEffect(() => {
    const dialog = ownerDialogRef.current;
    if (!dialog) return;
    if (ownerDialogOpen && !dialog.open) dialog.showModal();
    if (!ownerDialogOpen && dialog.open) dialog.close();
  }, [ownerDialogOpen]);

  useEffect(() => {
    if (!ownerDialogOpen) return;
    const controller = new AbortController();
    setOwnerGateStatus('checking');
    void fetch(preferencePath, {
      cache: 'no-store',
      credentials: 'same-origin',
      signal: controller.signal
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('preference status failed');
        const next = await response.json() as { enabled?: boolean; excluded?: boolean };
        if (!next.enabled) {
          setOwnerGateStatus('unavailable');
          return;
        }
        setOwnerExcluded(Boolean(next.excluded));
        setOwnerGateStatus('idle');
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setOwnerGateStatus('unavailable');
      });
    return () => controller.abort();
  }, [ownerDialogOpen, preferencePath]);

  async function updateOwnerPreference(inspect = false) {
    if (ownerGateStatus === 'checking' || ownerGateStatus === 'saving') return;
    setOwnerGateStatus('saving');
    setOwnerReceipt(null);
    const controller = new AbortController();
    ownerRequestRef.current?.abort();
    ownerRequestRef.current = controller;
    try {
      const response = await fetch(preferencePath, {
        body: inspect ? JSON.stringify({ inspect: true, password }) : JSON.stringify({ excluded: !ownerExcluded, password }),
        cache: 'no-store',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        signal: controller.signal
      });
      if (response.status === 401) {
        setOwnerGateStatus('error');
        return;
      }
      if (response.status === 429) {
        setOwnerGateStatus('rate-limited');
        return;
      }
      if (!response.ok) {
        setOwnerGateStatus('unavailable');
        return;
      }
      const next = await response.json() as { excluded?: boolean } & Partial<OwnerReceipt>;
      if (typeof next.excluded !== 'boolean') throw new Error('preference response invalid');
      setOwnerExcluded(next.excluded);
      if (!inspect) {
        const confirmation = await fetch(preferencePath, { cache: 'no-store', credentials: 'same-origin', signal: controller.signal });
        if (!confirmation.ok) throw new Error('preference confirmation failed');
        const confirmed = await confirmation.json() as { excluded?: boolean };
        if (confirmed.excluded !== next.excluded) throw new Error('preference cookie not applied');
      }
      setOwnerReceipt(next.network && next.checkedAt ? { network: next.network, checkedAt: next.checkedAt,
        auditSaved: next.auditSaved, actionId: next.actionId } : null);
      setOwnerPassword('');
      setOwnerGateStatus('success');
    } catch {
      if (controller.signal.aborted) return;
      setOwnerGateStatus('unavailable');
    }
  }

  function submitOwnerPreference(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void updateOwnerPreference();
  }

  function openOwnerDialog() {
    setOwnerGateStatus('checking');
    setOwnerDialogOpen(true);
  }

  function closeOwnerDialog() {
    ownerRequestRef.current?.abort();
    setOwnerDialogOpen(false);
    setOwnerPassword('');
    setOwnerReceipt(null);
    setOwnerGateStatus('idle');
  }

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
  }, [apiPath, requestVersion]);

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
              <button
                aria-controls="visitor-atlas-owner-dialog"
                aria-expanded={ownerDialogOpen}
                aria-haspopup="dialog"
                className="wiki-visitor-atlas-legend-trigger"
                onClick={openOwnerDialog}
                type="button"
              >
                {labels.intensity}
              </button>
              <span className="wiki-visitor-atlas-legend-scale">
                <span><i className="level-0" />{labels.noPublicCell}</span>
                <span><i className="level-1" />{labels.low}</span>
                <span><i className="level-2" />{labels.medium}</span>
                <span><i className="level-3" />{labels.high}</span>
              </span>
            </span>
          </figcaption>
          <dialog
            aria-describedby="visitor-atlas-owner-description"
            aria-labelledby="visitor-atlas-owner-title"
            aria-modal="true"
            className="wiki-visitor-atlas-owner-dialog"
            id="visitor-atlas-owner-dialog"
            onCancel={closeOwnerDialog}
            onClose={() => {
              // A queued close event can arrive after a quick keyboard reopen.
              if (!ownerDialogRef.current?.open) closeOwnerDialog();
            }}
            ref={ownerDialogRef}
          >
            <form onSubmit={submitOwnerPreference}>
              <header>
                <strong id="visitor-atlas-owner-title">{labels.ownerTitle}</strong>
                <button aria-label={labels.ownerClose} onClick={closeOwnerDialog} type="button">×</button>
              </header>
              <div className="wiki-visitor-atlas-owner-body">
                <p id="visitor-atlas-owner-description">{labels.ownerDescription}</p>
                {ownerGateStatus !== 'checking' && ownerGateStatus !== 'unavailable' ? (
                  <p><strong>{labels.ownerCurrentStatus}：{ownerExcluded ? labels.ownerStatusExcluded : labels.ownerStatusIncluded}</strong></p>
                ) : null}
                <p>{labels.ownerScope}</p>
                <label htmlFor="visitor-atlas-owner-password">{labels.ownerLabel}</label>
                <input
                  autoComplete="current-password"
                  autoFocus
                  id="visitor-atlas-owner-password"
                  maxLength={256}
                  minLength={8}
                  onChange={(event) => setOwnerPassword(event.currentTarget.value)}
                  required
                  type="password"
                  value={password}
                />
                <button disabled={password.length < 8 || ownerGateStatus === 'checking' || ownerGateStatus === 'saving' || ownerGateStatus === 'unavailable'}
                  onClick={() => void updateOwnerPreference(true)} type="button">{labels.ownerInspect}</button>
                {ownerReceipt ? (
                  <div className="wiki-visitor-atlas-owner-receipt" aria-live="polite">
                    <p>{labels.ownerCurrentIp}：<strong>{ownerReceipt.network.ip ?? labels.ownerUnknownIp}</strong></p>
                    <p>{[ownerReceipt.network.country, ownerReceipt.network.city, ownerReceipt.network.browser, ownerReceipt.network.os].filter(Boolean).join(' · ')}</p>
                    <p><time dateTime={ownerReceipt.checkedAt}>{new Date(ownerReceipt.checkedAt).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-GB', { timeZoneName: 'short' })}</time></p>
                    {typeof ownerReceipt.auditSaved === 'boolean' ? <p>{ownerReceipt.auditSaved ? labels.ownerAuditSaved : labels.ownerAuditMissing}</p> : null}
                    {ownerReceipt.actionId ? <p><code>{ownerReceipt.actionId}</code></p> : null}
                  </div>
                ) : null}
                {ownerGateStatus === 'error' ? <p className="wiki-visitor-atlas-owner-message" role="alert">{labels.ownerInvalid}</p> : null}
                {ownerGateStatus === 'rate-limited' ? <p className="wiki-visitor-atlas-owner-message" role="alert">{labels.ownerRateLimited}</p> : null}
                {ownerGateStatus === 'unavailable' ? <p className="wiki-visitor-atlas-owner-message" role="alert">{labels.ownerUnavailable}</p> : null}
                {ownerGateStatus === 'success' ? (
                  <p aria-live="polite" className="wiki-visitor-atlas-owner-message is-success" role="status">
                    {ownerReceipt && ownerReceipt.auditSaved === undefined ? labels.ownerCurrentStatus : ownerExcluded ? labels.ownerExcluded : labels.ownerIncluded}
                  </p>
                ) : null}
              </div>
              <footer>
                <button onClick={closeOwnerDialog} type="button">{labels.ownerCancel}</button>
                <button
                  disabled={ownerGateStatus === 'checking' || ownerGateStatus === 'saving' || ownerGateStatus === 'unavailable'}
                  type="submit"
                >
                  {ownerGateStatus === 'saving'
                    ? labels.ownerWorking
                    : ownerExcluded
                      ? labels.ownerSubmitInclude
                      : labels.ownerSubmitExclude}
                </button>
              </footer>
            </form>
          </dialog>
        </figure>
        {statusMessage ? (
          <div className="wiki-visitor-atlas-status-row">
            <p aria-live="polite" className="wiki-visitor-atlas-status" role="status">{statusMessage}</p>
            {status === 'error' ? (
              <button
                className="wiki-visitor-atlas-retry"
                onClick={() => setRequestVersion((version) => version + 1)}
                type="button"
              >
                {labels.retry}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </details>
  );
}
