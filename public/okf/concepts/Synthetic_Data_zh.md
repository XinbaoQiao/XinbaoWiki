---
type: 研究概念
title: 合成数据（概念）
description: 用于训练、评估与协作的生成数据。
tags:
  - zh
  - research
  - concept
  - 研究概念
  - synthetic-data
timestamp: '2026-05-27T17:56:27+08:00'
modified: '2026-10-07T07:07:23.975Z'
content_hash: 'sha256:588592e73953a10a6c1634b5c4faa0ac881b88131b22827b1072096d683aef75'
reviewed_at: '2026-10-07T07:07:51.129Z'
review_due: '2027-04-05'
language: zh
lifecycle:
  status: active
  confidence: 0.8
  review: periodic or when linked evidence changes
  retention: semantic memory with quality warnings
  reviewedAt: '2026-10-07T07:07:51.129Z'
  reviewDue: '2027-04-05'
  pendingReview: false
  overdue: false
retrieval:
  document_id: 'wiki:Synthetic_Data_zh'
  chunking: markdown-heading-v1
source_ids: []
source_path: wiki/Synthetic_Data_zh.md
---
**合成数据** 指被用来替代、补充或代理真实数据的生成样本。在机器学习中，合成数据可以扩大覆盖面、降低标注成本、保护隐私，或在真实数据稀缺时支持评估；但如果缺乏真实数据锚点并被递归复用，也会引入失效模式。

## 研究背景

合成数据可以用于数据增强等应用，而递归复用会引入额外风险。乔鑫宝的 [合成数据研究](./Synthetic_Data_and_Model_Collapse_zh.md) 关注这些风险如何受到样本选择与真实数据访问条件的影响。

## 与乔鑫宝工作的关系

乔鑫宝的 ICML 2026 工作研究选择偏差、低资源验证和数据孤岛条件下的合成数据。核心问题并非数据是否由模型生成，而是生成数据是否嵌入了重复训练循环。当每一代都从前一代有偏选择的输出中学习时，合成分布可能偏离原始分布，低资源社区尤其容易遭遇尾部模式损失。该项目连接 [数据选择](./Data_Selection_zh.md)、[模型坍缩](./Model_Collapse_zh.md) 和 [协作评估](./Collaborative_Evaluation_zh.md)。

## 参见

- [合成数据](./Synthetic_Data_and_Model_Collapse_zh.md)
- [递归合成数据训练](./Recursive_Synthetic_Data_Training_zh.md)
- [样本选择偏差](./Sample_Selection_Bias_zh.md)
- [样本选择偏差何以促成模型坍缩](./When_Sample_Selection_Bias_Precipitates_Model_Collapse_zh.md)
