'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  className?: string;
  enabled: boolean;
  language: 'en' | 'zh';
  onPointerActiveChange?: (active: boolean) => void;
  onReadyChange?: (ready: boolean) => void;
  wordmarkSrc: string;
};

type Particle = {
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
};

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isCoarsePointer() {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
}

function sampleWordmark(src: string, width: number, height: number, budget: number): Promise<Particle[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.floor(width));
      canvas.height = Math.max(1, Math.floor(height));
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        resolve([]);
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const candidates: Array<{ x: number; y: number; a: number }> = [];
      const step = Math.max(1, Math.round(Math.min(canvas.width, canvas.height) / 90));
      for (let y = 0; y < canvas.height; y += step) {
        for (let x = 0; x < canvas.width; x += step) {
          const i = (y * canvas.width + x) * 4;
          const a = data[i + 3];
          const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
          if (a > 40 && lum < 210) candidates.push({ x, y, a });
        }
      }
      if (!candidates.length) {
        resolve([]);
        return;
      }
      const stride = Math.max(1, Math.ceil(candidates.length / budget));
      const particles: Particle[] = [];
      for (let i = 0; i < candidates.length && particles.length < budget; i += stride) {
        const c = candidates[i];
        const jitter = (Math.random() - 0.5) * 0.6;
        particles.push({
          homeX: c.x + jitter,
          homeY: c.y + jitter,
          x: c.x + (Math.random() - 0.5) * 18,
          y: c.y + (Math.random() - 0.5) * 12,
          vx: 0,
          vy: 0,
          size: 0.9 + Math.random() * 1.35,
          alpha: 0.42 + (c.a / 255) * 0.45
        });
      }
      resolve(particles);
    };
    img.onerror = () => reject(new Error('wordmark-load-failed'));
    img.src = src;
  });
}

export function PortalParticleWordmark({
  className,
  enabled,
  language,
  onPointerActiveChange,
  onReadyChange,
  wordmarkSrc
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);
  const pointerRef = useRef<{ x: number; y: number; inside: boolean }>({ x: 0, y: 0, inside: false });
  const reduceRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    reduceRef.current = prefersReducedMotion();
    setHost(document.querySelector('.wiki-portal-name-wrap') as HTMLElement | null);
  }, []);

  useEffect(() => {
    onReadyChange?.(ready && !failed);
  }, [ready, failed, onReadyChange]);

  useEffect(() => {
    if (!enabled || reduceRef.current || !host) {
      setReady(false);
      return;
    }

    let cancelled = false;
    const rebuild = async () => {
      const rect = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = Math.max(1, rect.width);
      const cssH = Math.max(1, rect.height);
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      const budget = isCoarsePointer() ? 220 : cssW < 420 ? 280 : 480;
      try {
        const next = await sampleWordmark(wordmarkSrc, cssW, cssH, budget);
        if (cancelled) return;
        particlesRef.current = next;
        setReady(next.length > 0);
        setFailed(next.length === 0);
      } catch {
        if (!cancelled) {
          setFailed(true);
          setReady(false);
        }
      }
    };

    void rebuild();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => { void rebuild(); }) : null;
    ro?.observe(host);
    return () => {
      cancelled = true;
      ro?.disconnect();
    };
  }, [enabled, wordmarkSrc, host]);

  useEffect(() => {
    if (!enabled || !ready || reduceRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let running = true;
    const spring = 0.045;
    const damp = 0.86;
    const scatter = 18;

    const tick = () => {
      if (!running) return;
      if (document.hidden) {
        rafRef.current = window.setTimeout(() => {
          rafRef.current = requestAnimationFrame(tick) as unknown as number;
        }, 240) as unknown as number;
        return;
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const style = getComputedStyle(document.documentElement);
      const accent = style.getPropertyValue('--site-theme-accent').trim() || '#2c2a28';
      ctx.fillStyle = accent;
      const pointer = pointerRef.current;
      for (const p of particlesRef.current) {
        let ax = (p.homeX - p.x) * spring;
        let ay = (p.homeY - p.y) * spring;
        if (pointer.inside) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const dist2 = dx * dx + dy * dy;
          const radius = scatter * scatter * 9;
          if (dist2 < radius && dist2 > 0.01) {
            const dist = Math.sqrt(dist2);
            const force = (1 - dist / (scatter * 3)) * 0.55;
            ax += (dx / dist) * force;
            ay += (dy / dist) * force;
          }
        }
        p.vx = (p.vx + ax) * damp;
        p.vy = (p.vy + ay) * damp;
        p.x += p.vx;
        p.y += p.vy;
        ctx.globalAlpha = p.alpha * (pointer.inside ? 0.92 : 0.78);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(tick) as unknown as number;
    };

    rafRef.current = requestAnimationFrame(tick) as unknown as number;
    return () => {
      running = false;
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        window.clearTimeout(rafRef.current);
      }
    };
  }, [enabled, ready, language]);

  useEffect(() => {
    if (!host) return;
    const update = (event: PointerEvent, inside: boolean) => {
      const rect = host.getBoundingClientRect();
      pointerRef.current = {
        inside,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
      onPointerActiveChange?.(inside);
    };
    const onMove = (event: PointerEvent) => update(event, true);
    const onEnter = (event: PointerEvent) => update(event, true);
    const onLeave = (event: PointerEvent) => update(event, false);
    host.addEventListener('pointermove', onMove);
    host.addEventListener('pointerenter', onEnter);
    host.addEventListener('pointerleave', onLeave);
    return () => {
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerenter', onEnter);
      host.removeEventListener('pointerleave', onLeave);
      onPointerActiveChange?.(false);
    };
  }, [host, onPointerActiveChange]);

  if (!enabled || reduceRef.current || failed || !host) return null;

  return createPortal(
    <div
      aria-hidden="true"
      className={className ?? 'wiki-portal-particle-wordmark'}
      data-ready={ready ? '' : undefined}
      style={{ pointerEvents: 'none' } as CSSProperties}
    >
      <canvas className="wiki-portal-particle-canvas" ref={canvasRef} />
    </div>,
    host
  );
}
