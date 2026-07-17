---
type: 研究概念
title: 合成数据（概念）
description: 解释用于训练、评估或隐私友好协作的生成数据。
tags:
  - zh
  - research
  - concept
  - 研究概念
  - synthetic-data
timestamp: '2026-05-27T17:56:27+08:00'
modified: '2026-07-02T20:03:20+08:00'
content_hash: 'sha256:0be9d0fd4d48f569a4a98be5a8e262abd0f666adf14656d58b7af7e19b57194d'
reviewed_at: '2026-07-02T20:03:20+08:00'
review_due: '2026-12-29'
language: zh
lifecycle:
  status: active
  confidence: 0.8
  review: periodic or when linked evidence changes
  retention: semantic memory with quality warnings
  reviewedAt: '2026-07-02T20:03:20+08:00'
  reviewDue: '2026-12-29'
  pendingReview: false
  overdue: false
retrieval:
  document_id: 'wiki:Synthetic_Data_zh'
  chunking: markdown-heading-v1
source_ids: []
source_path: wiki/Synthetic_Data_zh.md
---
**合成数据** 指被用来替代、补充或代理真实数据的生成样本。在机器学习中，合成数据可以扩大覆盖面、降低标注成本、保护隐私，或在真实数据稀缺时支持评估；但如果缺乏真实数据锚点并被递归复用，也会引入失效模式。

## 在本 wiki 中的作用

本页提供狭义概念定义；[合成数据](./Synthetic_Data_and_Model_Collapse_zh.md) 专题页则覆盖乔鑫宝的完整研究簇。这个区分有用：作为工具的合成数据可能有益，而递归合成数据训练是一种具有独立风险的过程。读者可以从本页进入模型坍缩研究线。

## 与乔鑫宝工作的关系

乔鑫宝的 ICML 2026 工作研究选择偏差、低资源验证和数据孤岛条件下的合成数据。核心问题并非数据是否由模型生成，而是生成数据是否嵌入了重复训练循环。当每一代都从前一代有偏选择的输出中学习时，合成分布可能偏离原始分布，低资源社区尤其容易遭遇尾部模式损失。该项目连接 [数据选择](./Data_Selection_zh.md)、[模型坍缩](./Model_Collapse_zh.md) 和 [协作评估](./Collaborative_Evaluation_zh.md)。

## 参见

- [合成数据](./Synthetic_Data_and_Model_Collapse_zh.md)
- [递归合成数据训练](./Recursive_Synthetic_Data_Training_zh.md)
- [样本选择偏差](./Sample_Selection_Bias_zh.md)
- [样本选择偏差何以促成模型坍缩](./When_Sample_Selection_Bias_Precipitates_Model_Collapse_zh.md)
