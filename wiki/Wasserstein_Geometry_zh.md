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
modified: '2026-10-07T07:07:23.985Z'
content_hash: 'sha256:76f33f274d62e0cdaef742b6b9f33a834dc354d082cfcc4f0de4930d20227f46'
reviewed_at: '2026-10-07T07:07:51.129Z'
review_due: '2027-04-05'
name: Wasserstein 几何
language: zh
summary: 利用最优传输几何比较概率分布。
occupation: 研究概念
translation_of: Wasserstein_Geometry
---
**Wasserstein 几何** 指使用最优传输距离及相关几何思想比较概率分布。与逐点指标不同，Wasserstein 距离考虑把概率质量从一个分布移动到另一个分布的代价，因此适合描述分布偏移和生成数据。[^ot]

## 研究背景

Wasserstein 几何用于 [[Synthetic_Data_and_Model_Collapse|合成数据]]分析、[[Collaborative_Evaluation|协作评估]] 和 [[Distributed_Wasserstein_Barycenter|分布式 Wasserstein barycenter]] 计算。当数据被切分在多个孤岛中时，分布比较可能比单个准确率数字更有信息量。Wasserstein 风格度量提供了描述生成数据如何在类别、模式或视觉特征上漂移的语言。

## 与乔鑫宝工作的关系

ICML 2026 论文 [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|样本选择偏差何以促成模型坍缩]] 使用协作 Wasserstein 风格信号分析低资源选择偏差下的模型坍缩。博士阶段对 [[Distributed_Wasserstein_Barycenter|分布式 Wasserstein barycenter]] 的研究进一步关注计算问题：如何从多个局部测度得到共享的参考分布。Wasserstein 几何因此可用于分析数据分散、无法直接检查全局分布时的分布变化。

## 参见

- [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|样本选择偏差何以促成模型坍缩]]
- [[Collaborative_Evaluation|协作评估]]
- [[Distributed_Wasserstein_Barycenter|分布式 Wasserstein barycenter]]
- [[Model_Collapse|模型坍缩]]
- [[Data_Silos|数据孤岛]]

[^ot]: Agueh 和 Carlier 关于 [Wasserstein 空间 barycenter](https://epubs.siam.org/doi/10.1137/100805741) 的 SIAM 论文、Cuturi 和 Doucet 关于[快速 Wasserstein barycenter 计算](https://proceedings.mlr.press/v32/cuturi14.html)的 ICML 论文，以及 Arjovsky、Chintala 和 Bottou 的 [Wasserstein GAN](https://arxiv.org/abs/1701.07875) 是相关背景文献。
