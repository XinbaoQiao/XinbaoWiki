---
type: 研究专题
title: 合成数据
description: 关于合成数据、递归训练、低资源验证、选择偏差和模型坍缩的研究专题。
tags:
  - zh
  - research
  - topic
  - 研究专题
  - synthetic-data
timestamp: '2026-05-27T17:56:27+08:00'
language: zh
aliases:
  - Synthetic Data and Model Collapse
relations:
  - type: depends-on
    target: Synthetic_Data_zh
    label: 概念基础
lifecycle:
  status: active
  confidence: 0.9
  review: periodic
  retention: semantic memory
source_path: wiki/Synthetic_Data_and_Model_Collapse_zh.md
---
**合成数据** 是本 wiki 对乔鑫宝关于生成数据、递归训练和模型坍缩研究的简短专题名。完整研究簇还包括 [递归合成数据训练](./Recursive_Synthetic_Data_Training_zh.md)、[数据选择](./Data_Selection_zh.md)、[样本选择偏差](./Sample_Selection_Bias_zh.md)、[模型坍缩](./Model_Collapse_zh.md)、[数据孤岛](./Data_Silos_zh.md) 和 [Wasserstein 几何](./Wasserstein_Geometry_zh.md)。[^collapse]

## 引言

该专题把合成数据同时视为资源和风险。生成样本可以降低真实数据访问成本、支持隐私友好的工作流，但若被选择后反复用于后续训练，也可能使训练分布逐代变窄。本页记录的核心张力正是低资源验证、偏置本地选择与协作评估之间的关系。

## 在本 wiki 中的作用

主页只需要用“合成数据”提示研究方向；本页则展开长技术背景。合成样本可能提高覆盖面，也可能在递归使用中放大偏差、抹去模式或扭曲目标分布。新版重点是：低资源社区不只是数据更少，也更容易在本地验证器把稀有但有效样本误认为低质量生成时发生尾部损失。因此，本 wiki 同时把合成数据当作可用资产和潜在失效模式。

## 论文

| 论文 | 会议/状态 |
| --- | --- |
| [样本选择偏差何以促成模型坍缩](./When_Sample_Selection_Bias_Precipitates_Model_Collapse_zh.md) | ICML 2026，2026年7月6日至11日，首尔。 |

## 与乔鑫宝工作的关系

[样本选择偏差何以促成模型坍缩](./When_Sample_Selection_Bias_Precipitates_Model_Collapse_zh.md) 研究局部选择偏差如何在低资源、数据孤岛化的递归训练中触发坍缩，并使用协作 Wasserstein 风格信号诊断该问题。这把合成数据可靠性连接到 [AI 与网络](./AI_and_Networks_zh.md)：关键困难不仅是生成质量，也包括各方对目标分布证据的分布式访问。

## 参见

- [样本选择偏差何以促成模型坍缩](./When_Sample_Selection_Bias_Precipitates_Model_Collapse_zh.md)
- [合成数据（概念）](./Synthetic_Data_zh.md)
- [模型坍缩](./Model_Collapse_zh.md)
- [数据孤岛](./Data_Silos_zh.md)
- [协作评估](./Collaborative_Evaluation_zh.md)

[^collapse]: Shumailov 等人的 “AI models collapse when trained on recursively generated data”（Nature 2024）是递归模型坍缩问题的常见参考。
