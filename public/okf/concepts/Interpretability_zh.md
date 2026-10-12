---
type: 研究概念
title: 可解释性
description: 理解模型行为及训练数据的影响。
tags:
  - zh
  - research
  - concept
  - 研究概念
  - llm
timestamp: '2026-05-05T23:25:14+08:00'
modified: '2026-10-12T04:54:44.388Z'
content_hash: 'sha256:e59946df922bb29e2bbc3fac6253a3e9964165e98e897bc9e51a70added21001'
reviewed_at: '2026-10-12T04:55:39.589Z'
review_due: '2027-04-10'
language: zh
lifecycle:
  status: active
  confidence: 0.8
  review: periodic or when linked evidence changes
  retention: semantic memory with quality warnings
  reviewedAt: '2026-10-12T04:55:39.589Z'
  reviewDue: '2027-04-10'
  pendingReview: false
  overdue: false
retrieval:
  document_id: 'wiki:Interpretability_zh'
  chunking: markdown-heading-v1
source_ids: []
source_path: wiki/Interpretability_zh.md
---
**可解释性** 指帮助人理解模型为何产生某种行为的方法。乔鑫宝的相关研究主要关注数据影响、错误诊断，以及支持可信决策的解释。

## 研究背景

可解释性是 [可信 AI](./Trustworthy_AI_zh.md) 和 [数据中心 ML](./Data_Centric_Machine_Learning_zh.md) 的支撑主题。模型可以准确但难以审计；如果研究者能说明哪些样本、群体或合成数据过程导致了某种行为，下一步就可以是数据选择、遗忘、修正或协作评估。可解释性因此把解释连接到干预。

## 与乔鑫宝工作的关系

乔鑫宝通过 [影响函数](./Influence_Functions_zh.md) 和机器遗忘研究数据变化对模型行为的影响。[无 Hessian 在线认证遗忘](./Hessian_Free_Online_Certified_Unlearning_zh.md) 与 [超越二元擦除](./Soft_Weighted_Machine_Unlearning_zh.md) 都依赖对数据变化如何影响模型参数或预测的理解。合成数据研究也需要更广义的可解释性：当模型坍缩发生时，研究问题是退化由何种数据过程引起、分布式参与方如何发现它。获 NeurIPS 2026 录用的[《Illusory Pattern Perception Drives Spurious Inference in Large Language Models》](./Illusory_Pattern_Perception_Drives_Spurious_Inference_in_Large_Language_Models_zh.md)通过稀疏自编码器分析与错觉模式感知和无依据关系推断相关的内部特征。

## 参见

- [错觉模式感知论文](./Illusory_Pattern_Perception_Drives_Spurious_Inference_in_Large_Language_Models_zh.md)
- [影响函数](./Influence_Functions_zh.md)
- [可信 AI](./Trustworthy_AI_zh.md)
- [机器遗忘](./Machine_Unlearning_zh.md)
- [数据中心 ML](./Data_Centric_Machine_Learning_zh.md)
