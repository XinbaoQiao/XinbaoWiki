---
type: 研究概念
title: 数据选择
description: 可靠性约束下的训练与评估数据选择。
tags:
  - zh
  - research
  - concept
  - 研究概念
timestamp: '2026-05-27T17:56:27+08:00'
modified: '2026-10-07T07:07:23.826Z'
content_hash: 'sha256:7a04836cb0ff56ee638c73e86fe0651fc744bf8d7bf66dc0145024ad1e0fdc80'
reviewed_at: '2026-10-07T07:07:51.129Z'
review_due: '2027-04-05'
name: 数据选择
language: zh
summary: 可靠性约束下的训练与评估数据选择。
occupation: 研究概念
translation_of: Data_Selection
---
**数据选择** 是为训练、剪枝、评估或合成数据复用选择样本的过程。选择可以降低成本、提升质量，但有偏选择也会扭曲模型对目标分布的理解。

## 研究背景

数据选择是 [[Data_Centric_Machine_Learning|数据中心 ML]]、[[AI_and_Networks|AI 与网络]] 和 [[Synthetic_Data_and_Model_Collapse|合成数据]] 研究中的共同问题。在去中心化或数据孤岛设置中，选择通常是局部的：每个参与方只看到一部分数据，并按本地目标或约束选择样本。因此，选择不是单纯的统计预处理，而是网络化学习问题的一部分。

## 与乔鑫宝工作的关系

数据选择出现在 [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|样本选择偏差何以促成模型坍缩]] 中：有偏的本地选择会加剧递归合成数据训练的分布退化，并使低资源社区更容易发生尾部模式损失。在机器遗忘论文中，选择又以删除或重加权的形式出现。

## 参见

- [[Sample_Selection_Bias|样本选择偏差]]
- [[Data_Centric_Machine_Learning|数据中心 ML]]
- [[Distributed_Learning|分布式学习]]
- [[Synthetic_Data|合成数据（概念）]]
