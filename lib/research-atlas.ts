import graph from '@/wiki/graph.json';
import { pathWithBasePath } from '@/lib/wiki';

export type AtlasLanguage = 'en' | 'zh';
export type AtlasNodeKind = 'institution' | 'topic' | 'method' | 'publication';

export type AtlasNode = {
  href: string;
  id: string;
  insight: string;
  kind: AtlasNodeKind;
  label: string;
  summary: string;
  title: string;
};

export type AtlasStage = {
  description: string;
  id: string;
  nodes: AtlasNode[];
  period: string;
  title: string;
};

export type ResearchAtlasData = {
  publicPageCount: number;
  stages: Record<AtlasLanguage, AtlasStage[]>;
  waypointCount: number;
};

type GraphNode = {
  hidden: boolean;
  language: AtlasLanguage;
  slug: string;
  summary: string;
  title: string;
};

type LocalizedText = Record<AtlasLanguage, string>;

type NodeBlueprint = {
  insight: LocalizedText;
  kind: AtlasNodeKind;
  label: LocalizedText;
  slug: string;
};

type StageBlueprint = {
  description: LocalizedText;
  id: string;
  nodes: NodeBlueprint[];
  period: string;
  title: LocalizedText;
};

const stageBlueprints: StageBlueprint[] = [
  {
    id: 'foundations',
    period: '2018–2022',
    title: { en: 'Communication foundations', zh: '通信与分布式基础' },
    description: {
      en: 'Communication engineering supplied the systems lens: information moves through constrained networks, not abstract centralized pipelines.',
      zh: '通信工程提供了系统视角：信息在受约束的网络中流动，而不是只存在于抽象的中心化流水线中。'
    },
    nodes: [
      {
        slug: 'Shandong_University',
        kind: 'institution',
        label: { en: 'Communication engineering', zh: '通信工程训练' },
        insight: {
          en: 'Established the signal, network, and distributed-systems vocabulary behind later learning problems.',
          zh: '建立了信号、网络和分布式系统的基础语言，为后续学习问题提供技术来源。'
        }
      },
      {
        slug: 'Distributed_Learning',
        kind: 'method',
        label: { en: 'Distributed learning', zh: '分布式学习' },
        insight: {
          en: 'Turned communication constraints into a first-class part of how models learn from separated data.',
          zh: '把通信约束提升为模型如何从分散数据中学习的核心组成部分。'
        }
      }
    ]
  },
  {
    id: 'data-lifecycle',
    period: '2022–2025',
    title: { en: 'The data lifecycle', zh: '数据生命周期' },
    description: {
      en: 'The central question shifted from model architecture to data influence: which examples matter, how influence changes, and how data should leave a model.',
      zh: '核心问题从模型结构转向数据影响：哪些样本重要、影响如何变化，以及数据应当如何离开模型。'
    },
    nodes: [
      {
        slug: 'Zhejiang_University',
        kind: 'institution',
        label: { en: 'Data-centric training', zh: '数据中心训练' },
        insight: {
          en: 'Connected artificial-intelligence training with a sustained focus on data selection, influence, and deletion.',
          zh: '把人工智能训练与数据选择、影响和删除的持续研究联系起来。'
        }
      },
      {
        slug: 'Data_Centric_Machine_Learning',
        kind: 'topic',
        label: { en: 'What data matters?', zh: '什么数据重要？' },
        insight: {
          en: 'Reframed improvement as a data problem rather than only a model-scaling problem.',
          zh: '把性能改进重新表述为数据问题，而不只是模型规模问题。'
        }
      },
      {
        slug: 'Machine_Unlearning',
        kind: 'topic',
        label: { en: 'How should data leave?', zh: '数据如何离开？' },
        insight: {
          en: 'Made deletion, correction, and influence control part of the model lifecycle.',
          zh: '把删除、修正和影响控制纳入模型生命周期。'
        }
      },
      {
        slug: 'Hessian_Free_Online_Certified_Unlearning',
        kind: 'publication',
        label: { en: 'Certified deletion at scale', zh: '可扩展的认证删除' },
        insight: {
          en: 'Replaced explicit Hessian inversion with reusable trajectory statistics for online certified updates.',
          zh: '用可复用的轨迹统计替代显式 Hessian 求逆，实现在线认证更新。'
        }
      },
      {
        slug: 'DynFrs',
        kind: 'publication',
        label: { en: 'Exact tree unlearning', zh: '精确树模型遗忘' },
        insight: {
          en: 'Showed that exact deletion can exploit model structure instead of defaulting to full retraining.',
          zh: '说明精确删除可以利用模型结构，而不必默认完整重训。'
        }
      },
      {
        slug: 'Soft_Weighted_Machine_Unlearning',
        kind: 'publication',
        label: { en: 'Influence beyond deletion', zh: '超越二元删除的影响控制' },
        insight: {
          en: 'Generalized binary erasure into continuous influence control for fairness and robustness.',
          zh: '将二元擦除推广为连续影响控制，用于公平性和鲁棒性修正。'
        }
      }
    ]
  },
  {
    id: 'reliability',
    period: '2025–2026',
    title: { en: 'Reliability under imperfect evidence', zh: '不完美证据下的可靠性' },
    description: {
      en: 'The lifecycle view expanded to generated data and evaluation: weak verification can amplify selection bias and make errors persist across generations.',
      zh: '生命周期视角扩展到生成数据与评估：薄弱验证会放大选择偏差，使错误跨代持续。'
    },
    nodes: [
      {
        slug: 'NUSRI_CQ',
        kind: 'institution',
        label: { en: 'Trustworthy LLM systems', zh: '可信大模型系统' },
        insight: {
          en: 'Extended data-quality questions into synthetic feedback loops and evidence-sensitive language-model behavior.',
          zh: '把数据质量问题扩展到合成反馈循环和依赖证据的大模型行为。'
        }
      },
      {
        slug: 'Synthetic_Data_and_Model_Collapse',
        kind: 'topic',
        label: { en: 'Synthetic feedback loops', zh: '合成数据反馈循环' },
        insight: {
          en: 'Asked how generated data reshapes future training distributions when it is recursively reused.',
          zh: '研究生成数据被递归复用时如何重塑未来训练分布。'
        }
      },
      {
        slug: 'When_Sample_Selection_Bias_Precipitates_Model_Collapse',
        kind: 'publication',
        label: { en: 'Selection bias → collapse', zh: '选择偏差 → 模型坍缩' },
        insight: {
          en: 'Connected low-resource verification, persistent tail pruning, and model collapse in collaborative synthetic-data training.',
          zh: '连接低资源验证、尾部数据持续剪除与协作式合成数据训练中的模型坍缩。'
        }
      },
      {
        slug: 'LLM_Reliability',
        kind: 'method',
        label: { en: 'Evidence-aware reliability', zh: '证据感知可靠性' },
        insight: {
          en: 'Keeps evaluation grounded when patterns, generated content, or weak evidence invite overconfident inference.',
          zh: '在模式、生成内容或薄弱证据诱发过度自信推断时，让评估保持有据可依。'
        }
      }
    ]
  },
  {
    id: 'networked-ai',
    period: '2026–',
    title: { en: 'Networked AI systems', zh: '网络化 AI 系统' },
    description: {
      en: 'The current arc joins data lifecycle management with AI for Networks and Networks for AI: distributed evidence, communication, geometry, and collaboration.',
      zh: '当前主线把数据生命周期管理与 AI for Networks、Networks for AI 结合起来：分布式证据、通信、几何与协作。'
    },
    nodes: [
      {
        slug: 'The_Chinese_University_of_Hong_Kong',
        kind: 'institution',
        label: { en: 'Information Engineering at CUHK', zh: '香港中文大学信息工程' },
        insight: {
          en: 'Places data-centric learning inside communication systems and networked computation.',
          zh: '把数据中心学习置于通信系统与网络化计算环境中。'
        }
      },
      {
        slug: 'AI_and_Networks',
        kind: 'topic',
        label: { en: 'AI ↔ Networks', zh: 'AI ↔ 网络' },
        insight: {
          en: 'Studies both directions: learning methods for networks and network-aware foundations for distributed AI.',
          zh: '同时研究两个方向：面向网络的学习方法，以及面向分布式 AI 的网络感知基础。'
        }
      },
      {
        slug: 'Distributed_Wasserstein_Barycenter',
        kind: 'method',
        label: { en: 'Geometry across silos', zh: '跨孤岛表示几何' },
        insight: {
          en: 'Uses Wasserstein geometry to summarize and align heterogeneous representations without centralizing raw data.',
          zh: '用 Wasserstein 几何汇总并对齐异构表示，同时避免集中原始数据。'
        }
      },
      {
        slug: 'Collaborative_Evaluation',
        kind: 'method',
        label: { en: 'Collaborative evidence', zh: '协作式证据' },
        insight: {
          en: 'Turns privacy, communication, and local uncertainty into explicit design constraints for joint evaluation.',
          zh: '把隐私、通信和本地不确定性转化为联合评估中的显式设计约束。'
        }
      }
    ]
  }
];

const graphNodes = graph.nodes as GraphNode[];

function localizedSlug(slug: string, language: AtlasLanguage) {
  return language === 'zh' ? `${slug}_zh` : slug;
}

function findPublicNode(slug: string, language: AtlasLanguage) {
  const resolvedSlug = localizedSlug(slug, language);
  const node = graphNodes.find((candidate) => candidate.slug === resolvedSlug);
  if (!node || node.hidden || node.language !== language) {
    throw new Error(`Research Atlas waypoint must resolve to a public ${language} graph node: ${resolvedSlug}`);
  }
  return node;
}

function buildStages(language: AtlasLanguage): AtlasStage[] {
  return stageBlueprints.map((stage) => ({
    id: stage.id,
    period: stage.period,
    title: stage.title[language],
    description: stage.description[language],
    nodes: stage.nodes.map((blueprint) => {
      const graphNode = findPublicNode(blueprint.slug, language);
      return {
        id: graphNode.slug,
        href: pathWithBasePath(`/wiki/${encodeURIComponent(graphNode.slug)}/`),
        title: graphNode.title,
        summary: graphNode.summary,
        label: blueprint.label[language],
        insight: blueprint.insight[language],
        kind: blueprint.kind
      };
    })
  }));
}

export function getResearchAtlasData(): ResearchAtlasData {
  const waypointCount = stageBlueprints.reduce((count, stage) => count + stage.nodes.length, 0);
  return {
    publicPageCount: graph.stats.publicPages,
    waypointCount,
    stages: {
      en: buildStages('en'),
      zh: buildStages('zh')
    }
  };
}
