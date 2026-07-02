---
type: 研究概念
title: 协作评估
description: 解释多方共同评估模型或数据过程的概念页。
tags:
  - zh
  - research
  - concept
  - 研究概念
timestamp: '2026-05-27T17:56:27+08:00'
language: zh
lifecycle:
  status: active
  confidence: 0.8
  review: periodic or when linked evidence changes
  retention: semantic memory with quality warnings
source_path: wiki/Collaborative_Evaluation_zh.md
---
**协作评估** 指多个参与方共同提供关于模型行为、数据质量或分布漂移的证据。在本 wiki 中，它主要用于跨数据孤岛设置：每个参与者只有本地观测，没有任何一方完整掌握全局分布。

## 在本 wiki 中的作用

本页连接 [数据孤岛](./Data_Silos_zh.md)、[Wasserstein 几何](./Wasserstein_Geometry_zh.md) 和 [AI 与网络](./AI_and_Networks_zh.md)。中心化基准假设所有相关数据都能汇集并标注在一个地方；协作评估则追问：在局部且可能有偏的信号中，各方能共同推断出什么，尤其是当部分参与方处于低资源条件下时。

## 与乔鑫宝工作的关系

在 [样本选择偏差何以促成模型坍缩](./When_Sample_Selection_Bias_Precipitates_Model_Collapse_zh.md) 中，协作评估用于分析原始数据分布被切分在多个低资源孤岛中时，递归合成数据训练为何会失败。该项目使用 Wasserstein 风格的分布代理，把生成行为与多方证据进行比较。这体现了乔鑫宝的系统视角：可靠 AI 不只取决于模型如何训练，也取决于证据如何共享。

## 参见

- [样本选择偏差何以促成模型坍缩](./When_Sample_Selection_Bias_Precipitates_Model_Collapse_zh.md)
- [数据孤岛](./Data_Silos_zh.md)
- [Wasserstein 几何](./Wasserstein_Geometry_zh.md)
- [合成数据](./Synthetic_Data_and_Model_Collapse_zh.md)
