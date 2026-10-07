---
type: 项目概览
title: 项目
description: AI 与网络、机器遗忘、合成数据及语言模型可靠性研究项目。
tags:
  - zh
  - project
  - overview
  - 项目概览
timestamp: '2026-06-13T20:46:02+08:00'
modified: '2026-10-07T07:07:23.928Z'
content_hash: 'sha256:c979c5302e1791e3ca0d502436ed0d586e1458aa78b7d050c6acebd22b614ffa'
reviewed_at: '2026-10-07T07:07:51.129Z'
review_due: '2027-01-05'
language: zh
lifecycle:
  status: active
  confidence: 0.9
  review: periodic
  retention: semantic memory
  reviewedAt: '2026-10-07T07:07:51.129Z'
  reviewDue: '2027-01-05'
  pendingReview: false
  overdue: false
retrieval:
  document_id: 'wiki:Projects_zh'
  chunking: markdown-heading-v1
source_ids: []
source_path: wiki/Projects_zh.md
---
## 研究项目

### AI 与网络

[AI 与网络](./AI_and_Networks_zh.md) 是当前主要研究方向。它包括 AI for Networks、Networks for AI、去中心化学习的数据剪枝、通信感知评估、跨数据孤岛的可靠性，以及基于 Wasserstein 几何的参考分布计算。

### 分布式 Wasserstein barycenter

[分布式 Wasserstein barycenter](./Distributed_Wasserstein_Barycenter_zh.md) 是 AI 与网络方向的研究项目之一。它研究多方如何从局部经验分布计算或近似共享的分布参考，并服务于协作评估、样本打分和合成数据验证。

### 机器遗忘

[机器遗忘](./Machine_Unlearning_zh.md) 包括可微模型的近似认证遗忘，以及树集成的精确或高效遗忘。相关工作包括 [无 Hessian 在线认证遗忘](./Hessian_Free_Online_Certified_Unlearning_zh.md)、[超越二元擦除](./Soft_Weighted_Machine_Unlearning_zh.md) 和 [DynFrs](./DynFrs_zh.md)。

### 协作评估

[协作评估](./Collaborative_Evaluation_zh.md) 研究不交换原始数据的验证。它在 ICML 2026 模型坍缩工作中用于以多方 Wasserstein 几何代理替代单一低资源、有偏验证器。

### 合成数据

[合成数据](./Synthetic_Data_and_Model_Collapse_zh.md) 追问生成数据何时能够安全替代或增强真实数据，以及递归训练何时放大偏差或侵蚀多样性。当前重点是低资源社区：当真实数据覆盖碎片化时，本地过滤更容易剪掉有效尾部模式。代表性论文是 [样本选择偏差何以促成模型坍缩](./When_Sample_Selection_Bias_Precipitates_Model_Collapse_zh.md)。

### 可信大语言模型系统

[大语言模型可靠性](./LLM_Reliability_zh.md) 研究提示中出现误导性模式时，语言模型能否恰当地使用证据。获 NeurIPS 2026 录用的[《Illusory Pattern Perception Drives Spurious Inference in Large Language Models》](./Illusory_Pattern_Perception_Drives_Spurious_Inference_in_Large_Language_Models_zh.md)研究感知到的提示模式如何诱发缺乏证据支持的推理。
