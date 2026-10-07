---
type: 研究概念
title: 影响函数
description: 估计训练样本对已训练模型影响的方法。
tags:
  - zh
  - research
  - concept
  - 研究概念
timestamp: '2026-05-05T23:25:14+08:00'
modified: '2026-10-07T07:07:23.896Z'
content_hash: 'sha256:c7fed546c9e8d06cd97aad2a3e901fcf3dcb18362b2c81347d7f5bc28ba79301'
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
  document_id: 'wiki:Influence_Functions_zh'
  chunking: markdown-heading-v1
source_ids: []
source_path: wiki/Influence_Functions_zh.md
---
**影响函数** 是估计某个训练样本如何影响拟合模型或下游预测的分析工具。在现代机器学习中，它经常作为近似方法使用：与其在每次改变样本后重新训练，不如通过梯度和曲率信息估计影响。[^influence]

## 研究背景

如果研究者能够估计一个点、一组样本或一个加权子集的影响，就可以判断哪些数据应删除、下调权重、保留或检查。影响函数因此连接 [数据选择](./Data_Selection_zh.md)、[机器遗忘](./Machine_Unlearning_zh.md)、公平性修正和鲁棒性分析。

## 与乔鑫宝工作的关系

乔鑫宝的机器遗忘工作通过分析数据对模型的影响来设计更新方法。[无 Hessian 在线认证遗忘](./Hessian_Free_Online_Certified_Unlearning_zh.md) 依赖避免显式 Hessian 求逆的高效更新；[超越二元擦除](./Soft_Weighted_Machine_Unlearning_zh.md) 用加权影响把删除问题转化为公平性和鲁棒性修正问题。影响函数为这些数据操作提供局部敏感性分析工具。

## 参见

- [机器遗忘](./Machine_Unlearning_zh.md)
- [数据中心 ML](./Data_Centric_Machine_Learning_zh.md)
- [公平性与鲁棒性](./Fairness_and_Robustness_zh.md)
- [无 Hessian 在线认证遗忘](./Hessian_Free_Online_Certified_Unlearning_zh.md)

[^influence]: Koh 和 Liang 的 “Understanding Black-box Predictions via Influence Functions”（ICML 2017）把经典影响函数思想重新引入现代机器学习预测解释。
