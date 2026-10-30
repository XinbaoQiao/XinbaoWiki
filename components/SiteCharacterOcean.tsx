"use client";

import { useEffect, useRef } from 'react';
import {
  createCharacterOceanEngine,
  type CharacterOceanEngine,
} from '@/lib/character-ocean/engine';
import type { ActiveOceanStyle } from '@/lib/character-ocean/alphabets';
import type { CharacterOceanLanguage, OceanSharkKind } from '@/lib/site-character-ocean';

type Props = {
  style: ActiveOceanStyle;
  language: CharacterOceanLanguage;
  /** Soft wash over wallpaper (site). Preview can set false for solid demo look. */
  wash?: boolean;
  density?: number;
  opacity?: number;
  kinds?: OceanSharkKind[];
  className?: string;
};

export function SiteCharacterOcean({
  style,
  language,
  wash = true,
  density = 1,
  opacity = 0.92,
  kinds,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<CharacterOceanEngine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const engine = createCharacterOceanEngine(canvas, {
      style,
      language,
      reducedMotion,
      wash,
      density,
      opacity,
      kinds,
    });
    engineRef.current = engine;

    return () => {
      engine.stop();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setOptions({ style, language, wash, density, opacity, kinds });
  }, [style, language, wash, density, opacity, kinds]);

  return (
    <div className={className ?? 'site-character-ocean'} aria-hidden="true">
      <canvas ref={canvasRef} className="site-character-ocean-canvas" />
    </div>
  );
}
