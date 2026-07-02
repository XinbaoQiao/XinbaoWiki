---
type: 研究概念
title: 样本选择偏差
description: 解释非代表性样本选择引入的分布偏差。
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
source_path: wiki/Sample_Selection_Bias_zh.md
---
**样本选择偏差** 发生在被选用于训练或评估的数据不能代表模型应处理的人群或目标分布时。在本 wiki 中，该概念很重要，因为当模型反复训练在生成数据或本地过滤数据上时，选择偏差会逐代累积。

## 在本 wiki 中的作用

本页解释 [合成数据](./Synthetic_Data_and_Model_Collapse_zh.md) 失效背后的机制。选择偏差不只是“数据集有问题”的标签，而是一个过程：一旦某个子集被偏好，缺失模式获得的样本会更少，模型生成它们的概率会下降，下一轮数据也会进一步变窄。在低资源网络化设置中，这一机制会更尖锐，因为稀有模式在选择开始前就可能代表不足。

## 与乔鑫宝工作的关系

ICML 2026 论文 [样本选择偏差何以促成模型坍缩](./When_Sample_Selection_Bias_Precipitates_Model_Collapse_zh.md) 直接把该概念放入标题。论文研究局部选择行为如何在递归合成数据训练中促成坍缩，尤其关注低资源验证者只看到碎片化本地证据时的失效。本页因此是乔鑫宝合成数据研究线最直接的背景条目之一。

## 参见

- [样本选择偏差何以促成模型坍缩](./When_Sample_Selection_Bias_Precipitates_Model_Collapse_zh.md)
- [数据选择](./Data_Selection_zh.md)
- [模型坍缩](./Model_Collapse_zh.md)
- [数据孤岛](./Data_Silos_zh.md)
