---
type: publication
title: Decentralized Free-Support Wasserstein Barycenter
description: 在审稿件，研究可移动支撑点如何在去中心化通信约束下构建共享几何参考。
tags:
  - zh
  - publication
  - paper
  - under-review
  - wasserstein
timestamp: '2026-08-20T00:00:00+09:00'
modified: '2026-10-07T07:07:23.845Z'
content_hash: 'sha256:04fdfda05e4b744c34a59465d5eee0fd05d53e9e2afdbecb953280812647b6ce'
reviewed_at: '2026-10-07T07:07:51.129Z'
review_due: '2026-11-06'
language: zh
lifecycle:
  status: active
  confidence: 0.8
  review: periodic or when linked evidence changes
  retention: semantic memory with quality warnings
  reviewedAt: '2026-10-07T07:07:51.129Z'
  reviewDue: '2026-11-06'
  pendingReview: false
  overdue: false
retrieval:
  document_id: 'wiki:Decentralized_Free_Support_Wasserstein_Barycenter_zh'
  chunking: markdown-heading-v1
source_ids: []
source_path: wiki/Decentralized_Free_Support_Wasserstein_Barycenter_zh.md
---
**Decentralized Free-Support Wasserstein Barycenter（去中心化自由支撑 Wasserstein 重心）** 是 **[乔鑫宝](./Qiao_Xinbao_zh.md)**、Bokai Hou、Peihua Mai、Wenqian Li、Wenjing Yan 和 Ying-Jun Angela Zhang 的稿件，目前**在审（under review）**。论文研究网络中的多个参与方如何构建共享分布参考，并让这一参考适应各方本地数据的几何结构。[^manuscript]

## 概览

许多去中心化 Wasserstein 重心算法预先规定一套共同网格，只优化各位置上的质量。共同网格便于节点达成一致，却可能限制几何表达，或需要较大的表示规模。该稿件固定各原子的等量质量，仅连续优化位置，使支撑点能够随分布几何调整。

每个节点根据本地最优传输计划构造重心支撑点的更新目标，再通过邻居 gossip 通信，在 majorization–minimization 框架内聚合与支撑规模相应的更新变量。本地测度和传输计划保留在各自节点；这种数据访问边界本身并不构成形式化隐私保证。

## 关键启示

- **表示方式也是通信设计的一部分。** 紧凑且可移动的支撑点有望保留分布几何，同时减少对稠密共同网格的依赖。
- **重心质量与节点一致性具有不同的时间尺度。** 稿件报告，较浅的 gossip 可以形成质量较好的网络平均重心，后续通信主要改善各节点局部副本的一致性。
- **通信预算会改变理论保证。** 固定通信深度控制节点分歧和平均更新；更强的驻点结论需要额外条件和递增通信。
- **共享几何参考可以服务于平均之外的决策。** 论文将重心用于协作式分布鲁棒优化的名义分布构建。

## 证据与适用边界

稿件在合成测度、图像分布和三维点云上，与代表性固定支撑去中心化算法进行比较，报告了较低的重心目标值、较好的几何保真度，以及所测设置中的显著计算和通信节省；同时评估了协作式分布鲁棒优化应用。

在二次代价和精确本地最优传输计划的分析中，精确聚合给出单调下降与最佳迭代的 Clarke 驻点保证。固定 gossip 深度给出的则是依赖拓扑的节点分歧和网络平均运动界，不能据此推出驻点。满足稿件中的紧支撑和混合假设，并充分递增 gossip 深度使混合误差可求和时，节点分歧趋于零，聚点满足 Clarke 驻点条件。驻点结论不等于全局最优。正则化分析要求熵正则子问题被精确求解，不能直接用于证明有限次 Sinkhorn 迭代的保证。

## 研究定位

该工作连接 [AI 与网络](./AI_and_Networks_zh.md)、[分布式 Wasserstein 重心](./Distributed_Wasserstein_Barycenter_zh.md)、[Wasserstein 几何](./Wasserstein_Geometry_zh.md)与[数据中心 ML](./Data_Centric_Machine_Learning_zh.md)。它把乔鑫宝关于协作分布参考的研究，从使用参考进行评估，延伸到在去中心化访问与通信约束下计算参考本身。

## 审稿状态

该稿件目前在审（under review）。

[^manuscript]: 作者提供的稿件，包括摘要、引言、方法、理论、实验与结论；论文元数据由作者于 2026 年 10 月 7 日提供。
