---
type: 研究概念
title: 认证数据删除
description: 解释机器遗忘中删除保证的概念页。
tags:
  - zh
  - research
  - concept
  - 研究概念
  - machine-unlearning
timestamp: '2026-05-05T23:25:14+08:00'
modified: '2026-07-02T20:03:20+08:00'
content_hash: 'sha256:cf9f22c358563c9ded7edfa0b84c15a2ddc531896671859e2ef14dc1edf907be'
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
  document_id: 'wiki:Certified_Data_Removal_zh'
  chunking: markdown-heading-v1
source_ids: []
source_path: wiki/Certified_Data_Removal_zh.md
---
**认证数据删除** 指机器学习方法对“删除某些数据后模型应如何变化”给出明确可检验保证。在本 wiki 中，它主要用于解释 [机器遗忘](./Machine_Unlearning_zh.md) 的数学侧面：目标不仅是快速更新模型，还要约束更新模型与“真正不含被删数据重新训练模型”之间的差距。[^certified]

## 在本 wiki 中的作用

本页服务于读者理解 [无 Hessian 在线认证遗忘](./Hessian_Free_Online_Certified_Unlearning_zh.md)。“认证”并不意味着模型整体安全或公平，而是指方法陈述了一个可度量的删除标准，例如参数、损失、预测或分布在删除前后的差异。这个限定使结论更窄，也更容易测试。

## 与乔鑫宝工作的关系

乔鑫宝的 Hessian-free 工作围绕在线更新约束下的认证删除展开。论文避免显式 Hessian 求逆，这一点对已部署系统很重要，因为精确二阶操作可能昂贵且不稳定。认证数据删除因此把数学遗忘保证连接到 [AI 与网络](./AI_and_Networks_zh.md) 的系统关切：只有当保证能以现实计算和延迟成本交付时，它才真正有用。

## 参见

- [机器遗忘](./Machine_Unlearning_zh.md)
- [无 Hessian 在线认证遗忘](./Hessian_Free_Online_Certified_Unlearning_zh.md)
- [影响函数](./Influence_Functions_zh.md)
- [可信 AI](./Trustworthy_AI_zh.md)

[^certified]: Guo 等人在 ICML 2020 的 “Certified Data Removal from Machine Learning Models” 是将删除视为认证式近似重新训练的代表性参考之一。
