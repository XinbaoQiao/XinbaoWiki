---
type: 研究概念
title: 数据选择
description: 解释在可靠性约束下选择训练或评估数据的概念页。
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
source_path: wiki/Data_Selection_zh.md
---
**数据选择** 是为训练、剪枝、评估或合成数据复用选择样本的过程。在本 wiki 中，它是核心的数据中心操作：选择可以降低成本、提升质量，但有偏选择也会扭曲模型对目标分布的理解。

## 在本 wiki 中的作用

本页把 [数据中心 ML](./Data_Centric_Machine_Learning_zh.md) 同 [AI 与网络](./AI_and_Networks_zh.md) 和 [合成数据](./Synthetic_Data_and_Model_Collapse_zh.md) 连接起来。在去中心化或数据孤岛设置中，选择通常是局部的：每个参与方只看到一部分数据，并按本地目标或约束选择样本。因此，选择不是单纯的统计预处理，而是网络化学习问题的一部分。

## 与乔鑫宝工作的关系

数据选择出现在 [样本选择偏差何以促成模型坍缩](./When_Sample_Selection_Bias_Precipitates_Model_Collapse_zh.md) 中：有偏的本地选择会加剧递归合成数据训练的分布退化，并使低资源社区更容易发生尾部模式损失。在机器遗忘论文中，选择又以删除或重加权的形式出现。

## 参见

- [样本选择偏差](./Sample_Selection_Bias_zh.md)
- [数据中心 ML](./Data_Centric_Machine_Learning_zh.md)
- [分布式学习](./Distributed_Learning_zh.md)
- [合成数据（概念）](./Synthetic_Data_zh.md)
