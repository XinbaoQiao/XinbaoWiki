---
type: 研究概念
title: 分布式 Wasserstein Barycenter
description: 解释乔鑫宝关于从分布式局部测度计算 Wasserstein barycenter 的相关工作。
tags:
  - zh
  - research
  - concept
  - 研究概念
  - wasserstein
timestamp: '2026-06-13T20:46:02+08:00'
modified: '2026-07-02T20:03:20+08:00'
content_hash: 'sha256:07336e6f8ccb466caccf4710fad348230218dd8bbb1f5f57f389f28f285757a9'
reviewed_at: '2026-07-02T20:03:20+08:00'
review_due: '2026-12-29'
name: 分布式 Wasserstein Barycenter
language: zh
summary: 解释乔鑫宝关于从分布式局部测度计算 Wasserstein barycenter 的相关工作。
aliases:
  - 分布式 Wasserstein barycenter
  - Wasserstein barycenter
  - 分布式最优传输 barycenter
occupation: 研究概念
translation_of: Distributed_Wasserstein_Barycenter
---
**分布式 Wasserstein Barycenter** 是 [[Xinbao_Qiao|乔鑫宝]] 在 [[AI_and_Networks|AI 与网络]] 和 [[Data_Centric_Machine_Learning|数据中心 ML]] 方向下的相关概念页。Wasserstein barycenter 是在最优传输距离下对多个输入分布进行概括的概率测度。在分布式设置中，输入测度由不同参与方持有，因此问题不仅是统计问题，也是网络化计算问题：系统需要在通信和数据访问约束下计算或近似共同参考分布。[^barycenter]

## 定义

给定局部概率测度 $\mu_1,\ldots,\mu_K$，权重 $\lambda_k \geq 0$ 且 $\sum_k \lambda_k = 1$，一个 $p$-Wasserstein barycenter 可写作

$$
\nu^\star \in \arg\min_{\nu \in \mathcal{P}(\mathcal{X})}
\sum_{k=1}^{K} \lambda_k W_p^p(\nu, \mu_k).
$$

在中心化数学表述中，所有 $\mu_k$ 都可以被求解器直接访问。在本 wiki 关心的分布式版本中，每个 $\mu_k$ 可能对应一个本地数据集、客户端、机构或设备。因此，研究问题还包括哪些信息需要跨网络传输、哪些信息可以被压缩，以及所得 barycenter 是否能作为有效的全局分布代理。

## 在本 wiki 中的作用

本页位于 [[Wasserstein_Geometry|Wasserstein 几何]]、[[Distributed_Learning|分布式学习]] 和 [[Collaborative_Evaluation|协作评估]] 之间。它解释为什么一个几何概念会出现在乔鑫宝的 AI 与网络研究线中：当没有任何单一参与方拥有完整数据分布时，barycenter 可以作为共享参考分布，用于模型评估、合成数据验证、样本打分或非独立同分布客户端之间的比较。

本页也遵循 Xinbaopedia 使用的 LLM-wiki 维护方式：与其让“Wasserstein barycenter”只作为传记中的临时短语出现，不如把它整理成独立节点。后续论文、笔记或项目更新可以继续链接回本页，并在已有综合上修订。

## 与乔鑫宝工作的关系

乔鑫宝的 ICML 2026 工作 [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|样本选择偏差何以促成模型坍缩]] 已经使用协作 Wasserstein 风格信号分析低资源数据孤岛下的合成数据失效。分布式 Wasserstein barycenter 在基础设施层面延续这一方向：当证据被切分在网络中时，如何计算可靠参考分布，而不是默认先汇总评估数据。

该问题连接 [[AI_and_Networks|AI 与网络]]，因为计算对象会被通信模式塑造；也连接 [[Synthetic_Data_and_Model_Collapse|合成数据]]，因为递归生成需要分布检查；同时连接 [[Data_Centric_Machine_Learning|数据中心 ML]]，因为 barycenter 可以成为跨参与方判断数据或样本重要性的工具。

## 参见

- [[AI_and_Networks|AI 与网络]]
- [[Wasserstein_Geometry|Wasserstein 几何]]
- [[Distributed_Learning|分布式学习]]
- [[Collaborative_Evaluation|协作评估]]
- [[Data_Silos|数据孤岛]]

[^barycenter]: Agueh 和 Carlier 在 SIAM 论文 [Barycenters in the Wasserstein Space](https://epubs.siam.org/doi/10.1137/100805741) 中引入 Wasserstein 空间中的 barycenter；Cuturi 和 Doucet 的 ICML 2014 论文 [Fast Computation of Wasserstein Barycenters](https://proceedings.mlr.press/v32/cuturi14.html) 是常用计算参考。
