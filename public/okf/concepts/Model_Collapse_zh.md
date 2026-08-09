---
type: 研究概念
title: 模型坍缩
description: 解释递归模型训练中退化性分布漂移的概念页。
tags:
  - zh
  - research
  - concept
  - 研究概念
  - synthetic-data
timestamp: '2026-05-27T17:56:27+08:00'
modified: '2026-08-09T18:32:45.779Z'
content_hash: 'sha256:9d6e82dd8a993b7b97228f53c9525ae3a0918f82de2274633ab0ad0c52770b1f'
reviewed_at: '2026-08-10T02:34:00+08:00'
review_due: '2027-02-05'
language: zh
lifecycle:
  status: active
  confidence: 0.8
  review: periodic or when linked evidence changes
  retention: semantic memory with quality warnings
  reviewedAt: '2026-08-10T02:34:00+08:00'
  reviewDue: '2027-02-05'
  pendingReview: false
  overdue: false
retrieval:
  document_id: 'wiki:Model_Collapse_zh'
  chunking: markdown-heading-v1
source_ids:
  - src-3e9d5d7dceceebc1
source_path: wiki/Model_Collapse_zh.md
---
**模型坍缩** 是模型在递归使用生成或有偏数据训练时，逐渐丢失原始数据分布信息的退化过程。坍缩可以表现为模式丢失、多样性下降、类别比例扭曲或样本质量随代际恶化。[^collapse]

## 在本 wiki 中的作用

本页为更广泛的 [合成数据](./Synthetic_Data_and_Model_Collapse_zh.md) 专题提供失效概念。合成数据并非天然有害；失效取决于生成数据如何被选择、混合和复用。模型坍缩是负面终点，因此激励更谨慎的数据治理和协作验证。低资源视角在这里尤其重要：如果尾部区域一开始就覆盖不足，坍缩可能更早发生，并且更严重影响代表不足的内容。

## 与乔鑫宝工作的关系

乔鑫宝的 ICML 2026 论文研究样本选择偏差在低资源验证场景下如何促成模型坍缩。该工作连接 [Wasserstein 几何](./Wasserstein_Geometry_zh.md)，因为分布距离可以提供漂移信号；也连接 [数据孤岛](./Data_Silos_zh.md)，因为没有单一参与方掌握完整分布。在传记中，模型坍缩属于更广泛的可靠性议题：即使模型结构不变，数据过程也可能悄然退化模型。

## 参见

- [样本选择偏差何以促成模型坍缩](./When_Sample_Selection_Bias_Precipitates_Model_Collapse_zh.md)
- [递归合成数据训练](./Recursive_Synthetic_Data_Training_zh.md)
- [样本选择偏差](./Sample_Selection_Bias_zh.md)
- [协作评估](./Collaborative_Evaluation_zh.md)

[^collapse]: Shumailov 等人的 [“AI models collapse when trained on recursively generated data”](https://www.nature.com/articles/s41586-024-07566-y)（*Nature* 631，2024）在无差别递归使用生成数据的背景下定义模型坍缩，并在语言模型、变分自编码器和高斯混合模型中报告了该现象。
