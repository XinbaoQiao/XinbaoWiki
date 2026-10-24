---
type: 研究概念
title: Wasserstein 几何
description: 利用最优传输几何比较概率分布。
tags:
  - zh
  - research
  - concept
  - 研究概念
  - wasserstein
timestamp: '2026-05-27T17:56:27+08:00'
modified: '2026-10-24T14:48:31.202Z'
content_hash: 'sha256:b8fdcae57019a61197cbe5c39dbbee0fe7dd1840d7b5f723f9afec89f54aa560'
reviewed_at: '2026-10-24T14:48:55.704Z'
review_due: '2027-04-22'
language: zh
lifecycle:
  status: active
  confidence: 0.8
  review: periodic or when linked evidence changes
  retention: semantic memory with quality warnings
  reviewedAt: '2026-10-24T14:48:55.704Z'
  reviewDue: '2027-04-22'
  pendingReview: false
  overdue: false
retrieval:
  document_id: 'wiki:Wasserstein_Geometry_zh'
  chunking: markdown-heading-v1
source_ids:
  - src-de7219537378d237
source_path: wiki/Wasserstein_Geometry_zh.md
---
**Wasserstein 几何** 指使用最优传输距离及相关几何思想比较概率分布。与逐点指标不同，Wasserstein 距离考虑把概率质量从一个分布移动到另一个分布的代价，因此适合描述分布偏移和生成数据。

## 研究背景

Wasserstein 几何用于 [合成数据](./Synthetic_Data_and_Model_Collapse_zh.md)分析、[协作评估](./Collaborative_Evaluation_zh.md) 与 [分布式 Wasserstein barycenter](./Distributed_Wasserstein_Barycenter_zh.md) 计算。当数据被切分在多个孤岛中时，分布比较可能比单个准确率数字更有信息量。Wasserstein 风格度量提供了描述生成数据如何在类别、模式或视觉特征上漂移的语言。

这一几何并不限于欧氏域。近期关于黎曼流形上 Wasserstein 空间生成建模的工作，用示意图说明了 McCann 位移插值如何把底流形 $(\mathcal{M}, d_g)$ 上的概率测度，连接到上方 Wasserstein 流形 $(\mathcal{P}_2(\mathcal{M}), W_2)$ 中的测地路径——这也是比较与合成分布时所依赖的传输几何。[^rwefm]

![黎曼底流形上测度之间的 McCann 插值及其在 Wasserstein 空间中的提升](/related/rwefm/mccann-interpolant.webp)

## 与乔鑫宝工作的关系

ICML 2026 论文 [样本选择偏差何以促成模型坍缩](./When_Sample_Selection_Bias_Precipitates_Model_Collapse_zh.md) 使用协作 Wasserstein 风格信号分析低资源选择偏差下的模型坍缩。博士阶段对 [分布式 Wasserstein barycenter](./Distributed_Wasserstein_Barycenter_zh.md) 的研究进一步关注计算问题：如何从多个局部测度得到共享的参考分布。Wasserstein 几何因此可用于分析数据分散、无法直接检查全局分布时的分布变化。

## 参见

- [样本选择偏差何以促成模型坍缩](./When_Sample_Selection_Bias_Precipitates_Model_Collapse_zh.md)
- [协作评估](./Collaborative_Evaluation_zh.md)
- [分布式 Wasserstein barycenter](./Distributed_Wasserstein_Barycenter_zh.md)
- [模型坍缩](./Model_Collapse_zh.md)
- [数据孤岛](./Data_Silos_zh.md)

[^rwefm]: Doron Haviv、Edward De Brouwer、Rishabh Anand、Rex Ying、Aïcha Bentaieb、Gabriele Scalia 与 Hector Corrada Bravo，"[When Riemann flows with Wasserstein: Generative Modeling of Probability Distributions on Manifolds](https://arxiv.org/abs/2609.25659)"，arXiv:2609.25659，2026。上图来自该论文（其关于 Riemannian Wasserstein Entropic Flow Matching 与 McCann 插值的概览图），此处仅作示意并保留署名，并非乔鑫宝的工作成果。
