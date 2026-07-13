'use client';

import { useState } from 'react';
import type { AtlasLanguage, AtlasNodeKind, ResearchAtlasData } from '@/lib/research-atlas';

type Props = {
  data: ResearchAtlasData;
};

const copy = {
  en: {
    back: 'Back to homepage',
    eyebrow: 'A guided map of the research arc',
    title: 'Research Atlas',
    alternateTitle: '研究图谱',
    intro: 'Follow four chapters from communication engineering to data lifecycle management, reliable AI, and networked intelligence. Every waypoint opens the underlying wiki evidence.',
    chapters: 'chapters',
    waypoints: 'waypoints',
    pages: 'public wiki pages',
    mapLabel: 'Research journey chapters and waypoints',
    selected: 'Selected waypoint',
    why: 'Why it matters',
    evidence: 'Open the evidence page',
    previous: 'Previous chapter',
    next: 'Next chapter',
    legend: 'Legend',
    kinds: {
      institution: 'Institution',
      topic: 'Research topic',
      method: 'Concept or method',
      publication: 'Publication'
    }
  },
  zh: {
    back: '返回主页',
    eyebrow: '研究主线的引导式地图',
    title: '研究图谱',
    alternateTitle: 'Research Atlas',
    intro: '沿四个章节了解研究如何从通信工程延伸到数据生命周期、可靠 AI 与网络化智能。每个节点都可打开对应的 wiki 证据页面。',
    chapters: '个章节',
    waypoints: '个节点',
    pages: '个公开 wiki 页面',
    mapLabel: '研究轨迹章节与节点',
    selected: '当前节点',
    why: '为什么重要',
    evidence: '打开证据页面',
    previous: '上一章',
    next: '下一章',
    legend: '图例',
    kinds: {
      institution: '机构',
      topic: '研究主题',
      method: '概念或方法',
      publication: '论文'
    }
  }
} satisfies Record<AtlasLanguage, {
  alternateTitle: string;
  back: string;
  chapters: string;
  evidence: string;
  eyebrow: string;
  intro: string;
  kinds: Record<AtlasNodeKind, string>;
  legend: string;
  mapLabel: string;
  next: string;
  pages: string;
  previous: string;
  selected: string;
  title: string;
  waypoints: string;
  why: string;
}>;

function withBasePath(pathname: string) {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');
  return basePath ? `${basePath}${pathname}` : pathname;
}

export function ResearchAtlas({ data }: Props) {
  const [language, setLanguage] = useState<AtlasLanguage>('en');
  const [stageIndex, setStageIndex] = useState(0);
  const [nodeIndex, setNodeIndex] = useState(0);
  const labels = copy[language];
  const stages = data.stages[language];
  const activeStage = stages[stageIndex];
  const activeNode = activeStage.nodes[nodeIndex] ?? activeStage.nodes[0];

  const selectStage = (nextStageIndex: number) => {
    setStageIndex(nextStageIndex);
    setNodeIndex(0);
  };

  const moveStage = (direction: -1 | 1) => {
    selectStage((stageIndex + direction + stages.length) % stages.length);
  };

  return (
    <article className="research-atlas" data-atlas-language={language}>
      <header className="research-atlas-hero">
        <div>
          <a className="research-atlas-back" href={withBasePath('/')}>← {labels.back}</a>
          <p className="research-atlas-eyebrow">{labels.eyebrow}</p>
          <h1>{labels.title}<span>{labels.alternateTitle}</span></h1>
          <p className="research-atlas-intro">{labels.intro}</p>
        </div>
        <div className="research-atlas-controls">
          <div className="research-atlas-language" aria-label="Atlas language">
            {(['en', 'zh'] as const).map((option) => (
              <button
                aria-pressed={language === option}
                className={language === option ? 'is-active' : ''}
                key={option}
                onClick={() => setLanguage(option)}
                type="button"
              >
                {option === 'en' ? 'English' : '中文'}
              </button>
            ))}
          </div>
          <p className="research-atlas-stats">
            <strong>{stages.length}</strong> {labels.chapters}
            <span>·</span>
            <strong>{data.waypointCount}</strong> {labels.waypoints}
            <span>·</span>
            <strong>{data.publicPageCount}</strong> {labels.pages}
          </p>
        </div>
      </header>

      <div className="research-atlas-panel">
        <nav className="research-atlas-map" aria-label={labels.mapLabel}>
          {stages.map((stage, currentStageIndex) => {
            const active = currentStageIndex === stageIndex;
            return (
              <section
                aria-labelledby={`atlas-stage-${stage.id}`}
                className={['research-atlas-stage', active ? 'is-active' : ''].filter(Boolean).join(' ')}
                data-atlas-stage={stage.id}
                key={stage.id}
              >
                <button
                  aria-current={active ? 'step' : undefined}
                  className="research-atlas-stage-button"
                  id={`atlas-stage-${stage.id}`}
                  onClick={() => selectStage(currentStageIndex)}
                  type="button"
                >
                  <span className="research-atlas-stage-number">{String(currentStageIndex + 1).padStart(2, '0')}</span>
                  <span>
                    <small>{stage.period}</small>
                    <strong>{stage.title}</strong>
                  </span>
                </button>
                <p className="research-atlas-stage-summary">{stage.description}</p>
                <div className="research-atlas-node-list">
                  {stage.nodes.map((node, currentNodeIndex) => {
                    const selected = active && currentNodeIndex === nodeIndex;
                    return (
                      <button
                        aria-pressed={selected}
                        className={['research-atlas-node', selected ? 'is-selected' : ''].filter(Boolean).join(' ')}
                        data-node-kind={node.kind}
                        key={node.id}
                        onClick={() => {
                          setStageIndex(currentStageIndex);
                          setNodeIndex(currentNodeIndex);
                        }}
                        type="button"
                      >
                        <span className="research-atlas-node-dot" aria-hidden="true" />
                        <span>{node.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </nav>

        <section className="research-atlas-detail" aria-live="polite" data-node-kind={activeNode.kind}>
          <p className="research-atlas-detail-kicker">
            {labels.selected} · {activeStage.period} · {labels.kinds[activeNode.kind]}
          </p>
          <h2>{activeNode.title}</h2>
          <p className="research-atlas-detail-summary">{activeNode.summary}</p>
          <div className="research-atlas-insight">
            <span>{labels.why}</span>
            <p>{activeNode.insight}</p>
          </div>
          <a className="research-atlas-evidence" href={activeNode.href}>{labels.evidence} <span aria-hidden="true">↗</span></a>
        </section>
      </div>

      <footer className="research-atlas-footer">
        <div className="research-atlas-legend" aria-label={labels.legend}>
          <strong>{labels.legend}</strong>
          {(Object.keys(labels.kinds) as AtlasNodeKind[]).map((kind) => (
            <span data-node-kind={kind} key={kind}><i aria-hidden="true" />{labels.kinds[kind]}</span>
          ))}
        </div>
        <div className="research-atlas-pager">
          <button onClick={() => moveStage(-1)} type="button">← {labels.previous}</button>
          <button onClick={() => moveStage(1)} type="button">{labels.next} →</button>
        </div>
      </footer>
    </article>
  );
}
