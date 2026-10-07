---
type: 研究概念
title: 协作评估
description: 利用多方证据评估模型与数据处理过程。
tags:
  - zh
  - research
  - concept
  - 研究概念
timestamp: '2026-05-27T17:56:27+08:00'
modified: '2026-10-07T07:07:23.814Z'
content_hash: 'sha256:ad442fd1332465ff099ad95e917cf558450b50e1c1c0c5f86ee076cdbebfe8ab'
reviewed_at: '2026-10-07T07:07:51.129Z'
review_due: '2027-04-05'
name: 协作评估
language: zh
summary: 利用多方证据评估模型与数据处理过程。
occupation: 研究概念
translation_of: Collaborative_Evaluation
---
**协作评估** 指多个参与方共同提供关于模型行为、数据质量或分布漂移的证据。在跨数据孤岛设置中，每个参与者只有本地观测，没有任何一方完整掌握全局分布。

## 研究背景

协作评估涉及 [[Data_Silos|数据孤岛]]、[[Wasserstein_Geometry|Wasserstein 几何]] 和 [[AI_and_Networks|AI 与网络]]。中心化基准假设所有相关数据都能汇集并标注在一个地方；协作评估则追问：在局部且可能有偏的信号中，各方能共同推断出什么，尤其是当部分参与方处于低资源条件下时。

## 与乔鑫宝工作的关系

在 [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|样本选择偏差何以促成模型坍缩]] 中，协作评估用于分析原始数据分布被切分在多个低资源孤岛中时，递归合成数据训练为何会失败。该项目使用 基于 Wasserstein 几何的分布代理，把生成行为与多方证据进行比较。这体现了乔鑫宝的系统视角：可靠 AI 不只取决于模型如何训练，也取决于证据如何共享。

## 参见

- [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|样本选择偏差何以促成模型坍缩]]
- [[Data_Silos|数据孤岛]]
- [[Wasserstein_Geometry|Wasserstein 几何]]
- [[Synthetic_Data_and_Model_Collapse|合成数据]]
