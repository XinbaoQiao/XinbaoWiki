---
type: 项目概览
title: 项目
description: 研究项目与项目簇。
tags:
  - zh
  - project
  - overview
  - 项目概览
timestamp: '2026-06-13T20:46:02+08:00'
language: zh
lifecycle:
  status: active
  confidence: 0.9
  review: periodic
  retention: semantic memory
source_path: wiki/Projects_zh.md
---
## 研究项目簇

### AI 与网络

[AI 与网络](./AI_and_Networks_zh.md) 是当前主要项目簇。它包括 AI for Networks、Networks for AI、去中心化学习的数据剪枝、通信感知评估、跨孤岛可靠性，以及 Wasserstein 风格分布参考的分布式计算。

### 分布式 Wasserstein barycenter

[分布式 Wasserstein barycenter](./Distributed_Wasserstein_Barycenter_zh.md) 是 AI 与网络项目簇中的一个技术项目。它研究多方如何从局部经验分布计算或近似共享的分布参考，并服务于协作评估、样本打分和合成数据验证。

### 机器遗忘

[机器遗忘](./Machine_Unlearning_zh.md) 包括可微模型的近似认证遗忘，以及树集成的精确或高效遗忘。项目页面包括 [无 Hessian 在线认证遗忘](./Hessian_Free_Online_Certified_Unlearning_zh.md)、[超越二元擦除](./Soft_Weighted_Machine_Unlearning_zh.md) 和 [DynFrs](./DynFrs_zh.md)。

### 协作评估

[协作评估](./Collaborative_Evaluation_zh.md) 研究不交换原始数据的验证。它在 ICML 2026 模型坍缩工作中用于以多方 Wasserstein 几何代理替代单一低资源、有偏验证器。

### 合成数据

[合成数据](./Synthetic_Data_and_Model_Collapse_zh.md) 追问生成数据何时能够安全替代或增强真实数据，以及递归训练何时放大偏差或侵蚀多样性。当前重点是低资源社区：当真实数据覆盖碎片化时，本地过滤更容易剪掉有效尾部模式。主论文页是 [样本选择偏差何以促成模型坍缩](./When_Sample_Selection_Bias_Precipitates_Model_Collapse_zh.md)。
