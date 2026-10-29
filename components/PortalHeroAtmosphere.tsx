'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PortalParticleWordmark } from '@/components/PortalParticleWordmark';

type Language = 'en' | 'zh';

type Props = {
  language: Language;
  wordmarkSrc: string;
};

const statusCopy = {
  en: [
    { id: 'field', label: 'quiet field' },
    { id: 'orbit', label: 'slow orbit' },
    { id: 'link', label: 'soft link' }
  ],
  zh: [
    { id: 'field', label: '静默场域' },
    { id: 'orbit', label: '缓轨' },
    { id: 'link', label: '轻链' }
  ]
} as const;

const muteCopy = {
  en: { mute: 'Mute title tone', unmute: 'Unmute title tone', muted: 'Tone off', live: 'Tone soft' },
  zh: { mute: '关闭标题音色', unmute: '开启标题音色', muted: '音色关', live: '音色轻' }
} as const;

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function createTitleTone() {
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  const ctx = new AudioCtx();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  return { ctx, master };
}

/** Sparse music-box fragments (synthesized). No copyrighted recordings. */
function scheduleSparseNotes(bundle: { ctx: AudioContext; master: GainNode }, muted: boolean) {
  if (muted || bundle.ctx.state === 'closed') return () => undefined;
  const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
  let timer: number | null = null;
  let stopped = false;

  const play = () => {
    if (stopped || document.hidden) return;
    const now = bundle.ctx.currentTime;
    const freq = scale[Math.floor(Math.random() * scale.length)] * (Math.random() > 0.7 ? 2 : 1);
    const osc = bundle.ctx.createOscillator();
    const gain = bundle.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.018, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6 + Math.random() * 0.8);
    osc.connect(gain);
    gain.connect(bundle.master);
    osc.start(now);
    osc.stop(now + 2.6);
    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {
        /* ignore */
      }
    };
    timer = window.setTimeout(play, 900 + Math.random() * 1600);
  };

  bundle.master.gain.cancelScheduledValues(bundle.ctx.currentTime);
  bundle.master.gain.setTargetAtTime(muted ? 0 : 0.55, bundle.ctx.currentTime, 0.25);
  play();

  return () => {
    stopped = true;
    if (timer != null) window.clearTimeout(timer);
    bundle.master.gain.setTargetAtTime(0, bundle.ctx.currentTime, 0.2);
  };
}

export function PortalHeroAtmosphere({ language, wordmarkSrc }: Props) {
  const bgRef = useRef<HTMLCanvasElement>(null);
  const toneRef = useRef<ReturnType<typeof createTitleTone> | null>(null);
  const stopNotesRef = useRef<(() => void) | null>(null);
  const [muted, setMuted] = useState(true);
  const [pointerOnTitle, setPointerOnTitle] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [effectsOn, setEffectsOn] = useState(false);
  const [particlesReady, setParticlesReady] = useState(false);

  useEffect(() => {
    const reduce = prefersReducedMotion();
    setEffectsOn(!reduce);
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setEffectsOn(!mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  useEffect(() => {
    const hero = document.querySelector('.wiki-portal-hero');
    if (!hero) return;
    if (particlesReady) hero.setAttribute('data-particles-ready', '');
    else hero.removeAttribute('data-particles-ready');
  }, [particlesReady]);

  useEffect(() => {
    if (!effectsOn) return;
    const canvas = bgRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    let raf = 0;
    let start = performance.now();
    const nodes = Array.from({ length: 14 }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.6 + (i % 4) * 0.25,
      phase: Math.random() * Math.PI * 2,
      speed: 0.00004 + Math.random() * 0.00005
    }));

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    if (canvas.parentElement) ro?.observe(canvas.parentElement);

    const draw = (t: number) => {
      if (document.hidden) {
        raf = window.setTimeout(() => {
          raf = requestAnimationFrame(draw) as unknown as number;
        }, 300) as unknown as number;
        return;
      }
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const elapsed = t - start;
      const g = ctx.createRadialGradient(w * 0.5, h * 0.35, 12, w * 0.5, h * 0.4, Math.max(w, h) * 0.55);
      g.addColorStop(0, 'rgba(120, 150, 190, 0.07)');
      g.addColorStop(0.55, 'rgba(40, 55, 80, 0.04)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(150, 170, 200, 0.10)';
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i += 1) {
        const a = nodes[i];
        const b = nodes[(i + 3) % nodes.length];
        const ax = (a.x + Math.sin(elapsed * a.speed + a.phase) * 0.04) * w;
        const ay = (a.y + Math.cos(elapsed * a.speed * 0.9 + a.phase) * 0.03) * h;
        const bx = (b.x + Math.sin(elapsed * b.speed + b.phase) * 0.04) * w;
        const by = (b.y + Math.cos(elapsed * b.speed * 0.9 + b.phase) * 0.03) * h;
        const dx = ax - bx;
        const dy = ay - by;
        if (dx * dx + dy * dy < (Math.min(w, h) * 0.42) ** 2) {
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }
      }
      for (const n of nodes) {
        const x = (n.x + Math.sin(elapsed * n.speed + n.phase) * 0.04) * w;
        const y = (n.y + Math.cos(elapsed * n.speed * 0.9 + n.phase) * 0.03) * h;
        ctx.fillStyle = 'rgba(180, 200, 230, 0.22)';
        ctx.beginPath();
        ctx.arc(x, y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw) as unknown as number;
    };
    raf = requestAnimationFrame(draw) as unknown as number;
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(raf);
      ro?.disconnect();
    };
  }, [effectsOn]);

  const unlockAudio = useCallback(async () => {
    if (!toneRef.current) toneRef.current = createTitleTone();
    const bundle = toneRef.current;
    if (!bundle) return;
    if (bundle.ctx.state === 'suspended') {
      try {
        await bundle.ctx.resume();
      } catch {
        return;
      }
    }
    setAudioUnlocked(true);
  }, []);

  useEffect(() => {
    return () => {
      stopNotesRef.current?.();
      stopNotesRef.current = null;
      const bundle = toneRef.current;
      if (bundle) {
        try {
          bundle.ctx.close();
        } catch {
          /* ignore */
        }
      }
      toneRef.current = null;
    };
  }, []);

  useEffect(() => {
    stopNotesRef.current?.();
    stopNotesRef.current = null;
    if (!effectsOn || !pointerOnTitle || muted || !audioUnlocked) return;
    const bundle = toneRef.current;
    if (!bundle) return;
    stopNotesRef.current = scheduleSparseNotes(bundle, muted);
    return () => {
      stopNotesRef.current?.();
      stopNotesRef.current = null;
    };
  }, [effectsOn, pointerOnTitle, muted, audioUnlocked]);

  const onPointerActiveChange = useCallback(
    (active: boolean) => {
      setPointerOnTitle(active);
      if (active) void unlockAudio();
    },
    [unlockAudio]
  );

  const statuses = statusCopy[language];
  const muteLabel = muted ? muteCopy[language].unmute : muteCopy[language].mute;
  const muteState = muted ? muteCopy[language].muted : muteCopy[language].live;

  return (
    <>
      <canvas aria-hidden="true" className="wiki-portal-hero-atmosphere" ref={bgRef} />
      <ul aria-hidden="true" className="wiki-portal-hero-status">
        {statuses.map((item, index) => (
          <li className={`wiki-portal-hero-status-item is-${item.id}`} data-index={index} key={item.id}>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
      {effectsOn ? (
        <PortalParticleWordmark
          enabled={effectsOn}
          language={language}
          onPointerActiveChange={onPointerActiveChange}
          onReadyChange={setParticlesReady}
          wordmarkSrc={wordmarkSrc}
        />
      ) : null}
      {effectsOn ? (
        <button
          aria-label={muteLabel}
          aria-pressed={!muted}
          className="wiki-portal-hero-tone"
          data-muted={muted ? '' : undefined}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void unlockAudio().then(() => setMuted((value) => !value));
          }}
          type="button"
        >
          <span aria-hidden="true">{muteState}</span>
        </button>
      ) : null}
    </>
  );
}
