---
type: 研究概念
title: 分布式 Wasserstein Barycenter
description: 根据各方本地数据计算共享的 Wasserstein 参考分布。
tags:
  - zh
  - research
  - concept
  - 研究概念
  - wasserstein
timestamp: '2026-06-13T20:46:02+08:00'
modified: '2026-10-07T07:07:23.864Z'
content_hash: 'sha256:a4dc1740e7975be08dc9b74f2e88194e15c1cfdfff93cae3380ed116ae99ce12'
reviewed_at: '2026-10-07T07:07:51.129Z'
review_due: '2027-04-05'
language: zh
aliases:
  - 分布式 Wasserstein barycenter
  - Wasserstein barycenter
  - 分布式最优传输 barycenter
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
  document_id: 'wiki:Distributed_Wasserstein_Barycenter_zh'
  chunking: markdown-heading-v1
source_ids:
  - src-0d6548913a8c228f
  - src-3157a848b3737221
source_path: wiki/Distributed_Wasserstein_Barycenter_zh.md
---
**分布式 Wasserstein barycenter** 是在最优传输距离下概括多个参与方所持分布的概率测度。计算或近似这一共同参考分布，需要考虑通信和数据访问约束。[^barycenter] [乔鑫宝](./Qiao_Xinbao_zh.md) 在 [AI 与网络](./AI_and_Networks_zh.md) 和 [数据中心 ML](./Data_Centric_Machine_Learning_zh.md) 方向的研究涉及这一问题。

## 定义

给定局部概率测度 $\mu_1,\ldots,\mu_K$，权重 $\lambda_k \geq 0$ 且 $\sum_k \lambda_k = 1$，一个 $p$-Wasserstein barycenter 可写作

$$
\nu^\star \in \arg\min_{\nu \in \mathcal{P}(\mathcal{X})}
\sum_{k=1}^{K} \lambda_k W_p^p(\nu, \mu_k).
$$

在中心化数学表述中，所有 $\mu_k$ 都可以被求解器直接访问。在分布式设置中，每个 $\mu_k$ 可能对应一个本地数据集、客户端、机构或设备。因此，研究问题还包括哪些信息需要跨网络传输、哪些信息可以被压缩，以及所得 barycenter 是否能作为有效的全局分布代理。

## 研究背景

分布式 barycenter 结合了 [Wasserstein 几何](./Wasserstein_Geometry_zh.md)、[分布式学习](./Distributed_Learning_zh.md) 和 [协作评估](./Collaborative_Evaluation_zh.md)：当没有任何单一参与方拥有完整数据分布时，barycenter 可以作为共享参考分布，用于模型评估、合成数据验证、样本打分或非独立同分布客户端之间的比较。

## 与乔鑫宝工作的关系

乔鑫宝的 ICML 2026 工作 [样本选择偏差何以促成模型坍缩](./When_Sample_Selection_Bias_Precipitates_Model_Collapse_zh.md) 已经使用协作计算的 Wasserstein 几何信息分析低资源数据孤岛下的合成数据失效。分布式 Wasserstein barycenter 在基础设施层面延续这一方向：当证据被切分在网络中时，如何计算可靠参考分布，而不是默认先汇总评估数据。

该问题连接 [AI 与网络](./AI_and_Networks_zh.md)，因为计算对象会被通信模式塑造；也连接 [合成数据](./Synthetic_Data_and_Model_Collapse_zh.md)，因为递归生成需要分布检查；同时连接 [数据中心 ML](./Data_Centric_Machine_Learning_zh.md)，因为 barycenter 可以成为跨参与方判断数据或样本重要性的工具。

在审稿件 [Decentralized Free-Support Wasserstein Barycenter](./Decentralized_Free_Support_Wasserstein_Barycenter_zh.md) 将这一方向具体化为自由支撑重心计算：通过学习支撑点位置，让共享参考适应分布几何，同时区分重心质量与网络一致性的通信需求。

## 参见

- [AI 与网络](./AI_and_Networks_zh.md)
- [Wasserstein 几何](./Wasserstein_Geometry_zh.md)
- [分布式学习](./Distributed_Learning_zh.md)
- [协作评估](./Collaborative_Evaluation_zh.md)
- [数据孤岛](./Data_Silos_zh.md)

[^barycenter]: Agueh 和 Carlier 在 SIAM 论文 [Barycenters in the Wasserstein Space](https://epubs.siam.org/doi/10.1137/100805741) 中引入 Wasserstein 空间中的 barycenter；Cuturi 和 Doucet 的 ICML 2014 论文 [Fast Computation of Wasserstein Barycenters](https://proceedings.mlr.press/v32/cuturi14.html) 是常用计算参考。
