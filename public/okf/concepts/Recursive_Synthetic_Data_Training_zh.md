---
type: 研究概念
title: 递归合成数据训练
description: 解释模型反复使用早期模型生成数据进行训练的过程。
tags:
  - zh
  - research
  - concept
  - 研究概念
  - synthetic-data
timestamp: '2026-05-27T17:56:27+08:00'
modified: '2026-07-02T20:03:20+08:00'
content_hash: 'sha256:2346ed0d127d9a8c6e84bfdf8fa967e3118ad2ae6adc8383c56cf69a8724c12a'
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
  document_id: 'wiki:Recursive_Synthetic_Data_Training_zh'
  chunking: markdown-heading-v1
source_ids: []
source_path: wiki/Recursive_Synthetic_Data_Training_zh.md
---
**递归合成数据训练** 是指某一代模型生成的数据进入后一代模型训练集的过程。它可能是有意设计的，例如自训练或合成数据自举；也可能是偶然发生的，例如生成内容进入未来训练语料。[^recursive]

## 在本 wiki 中的作用

本页解释 [模型坍缩](./Model_Collapse_zh.md) 背后的过程。它与一般合成数据不同：一次性的合成增强可能有益，但重复复用会放大分布误差。本 wiki 用该页区分机制和结果：递归训练是循环，坍缩是可能的退化结果之一。

## 与乔鑫宝工作的关系

[样本选择偏差何以促成模型坍缩](./When_Sample_Selection_Bias_Precipitates_Model_Collapse_zh.md) 研究局部样本选择偏差下的递归训练。该设置与 [AI 与网络](./AI_and_Networks_zh.md) 尤其相关，因为数据过程是分布式且常常低资源的：不同参与方看到不同数据、选择不同样本，并且只共享有限信号。递归合成数据训练因此成为跨孤岛可靠性问题，而不仅是生成模型问题。

## 参见

- [合成数据（概念）](./Synthetic_Data_zh.md)
- [模型坍缩](./Model_Collapse_zh.md)
- [样本选择偏差](./Sample_Selection_Bias_zh.md)
- [数据孤岛](./Data_Silos_zh.md)

[^recursive]: 2024 年 Nature 论文 “AI models collapse when trained on recursively generated data” 使递归生成数据导致模型坍缩的表述广为人知。
