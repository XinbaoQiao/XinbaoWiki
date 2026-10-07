---
type: 研究专题
title: AI 与网络
description: 乔鑫宝当前主要研究专题，涵盖网络化数据与通信约束下的 AI 系统。
tags:
  - zh
  - research
  - topic
  - 研究专题
  - ai-and-networks
timestamp: '2026-06-13T20:46:02+08:00'
modified: '2026-10-07T07:07:23.799Z'
content_hash: 'sha256:73e53146e74ce51d89671ab211abd86aae4388f24da57bdec6355a60c92d767a'
reviewed_at: '2026-10-07T07:07:51.129Z'
review_due: '2027-04-05'
language: zh
lifecycle:
  status: active
  confidence: 0.9
  review: periodic
  retention: semantic memory
  reviewedAt: '2026-10-07T07:07:51.129Z'
  reviewDue: '2027-04-05'
  pendingReview: false
  overdue: false
retrieval:
  document_id: 'wiki:AI_and_Networks_zh'
  chunking: markdown-heading-v1
source_ids:
  - src-5ffca2a581311c27
  - src-766234e11681dad2
source_path: wiki/AI_and_Networks_zh.md
---
**AI 与网络** 是 [乔鑫宝](./Qiao_Xinbao_zh.md) 当前的主要研究方向。这里的“网络”并不只指通信网络本身，也包括数据所在位置、信息如何流动、哪些机构可以评估模型，以及学习系统在通信、隐私和数据孤岛约束下如何保持可靠。[^sources]

## 引言

AI 与网络研究关注学习过程如何被数据分布、通信成本、边缘设备、去中心化协作和跨机构评估所塑造。相关问题包括 AI for Networks、Networks for AI、分布式计算、去中心化学习中的数据剪枝、低资源或数据孤岛中的协作评估，以及合成数据在有限访问条件下的验证。

## 研究背景

乔鑫宝的本科通信工程背景、硕士阶段的数据中心机器学习工作与博士阶段的信息工程研究相互衔接。若模型性能受数据位置和信息流动方式影响，那么算法设计就不能只看中心化训练精度，也要同时考虑通信延迟、局部偏差、隐私和部署代价。相关问题包括 [分布式学习](./Distributed_Learning_zh.md)、[数据孤岛](./Data_Silos_zh.md)、[协作评估](./Collaborative_Evaluation_zh.md)、[分布式 Wasserstein barycenter](./Distributed_Wasserstein_Barycenter_zh.md) 和去中心化训练的数据剪枝。

## 当前博士阶段关注点

在 CUHK 博士阶段，乔鑫宝近期在该方向下关注[数据中心 ML](./Data_Centric_Machine_Learning_zh.md)、AI for Networks 和 Networks for AI。重点是通信、网络基础设施和去中心化访问如何影响学习系统的数据与评估，而不只关注中心化训练中的统计目标。

## 论文

| 论文 | 会议/状态 |
| --- | --- |
| [样本选择偏差何以促成模型坍缩](./When_Sample_Selection_Bias_Precipitates_Model_Collapse_zh.md) | ICML 2026，2026年7月6日至11日，首尔。 |

## 在审稿件

在审稿件 [Decentralized Free-Support Wasserstein Barycenter](./Decentralized_Free_Support_Wasserstein_Barycenter_zh.md) 将这一方向具体化为自由支撑重心计算：通过学习支撑点位置，让共享参考适应分布几何，同时区分重心质量与网络一致性的通信需求。

## 与乔鑫宝工作的关系

[样本选择偏差何以促成模型坍缩](./When_Sample_Selection_Bias_Precipitates_Model_Collapse_zh.md) 把问题放在合成数据与数据孤岛中，研究低资源参与方只有碎片化本地证据时，单个本地验证者如何造成递归训练分布变窄。分布式 [Wasserstein barycenter](./Distributed_Wasserstein_Barycenter_zh.md) 方法仍是这一脉络中的技术路径之一：参考分布不是默认集中存在的对象，而可能需要跨网络计算出来。早期 [机器遗忘](./Machine_Unlearning_zh.md) 工作也体现同一系统视角：算法不仅要准确，还要在删除、更新、通信和延迟成本上可用。

## 参见

- [分布式学习](./Distributed_Learning_zh.md)
- [数据孤岛](./Data_Silos_zh.md)
- [协作评估](./Collaborative_Evaluation_zh.md)
- [分布式 Wasserstein barycenter](./Distributed_Wasserstein_Barycenter_zh.md)
- [数据中心 ML](./Data_Centric_Machine_Learning_zh.md)
- [香港中文大学](./The_Chinese_University_of_Hong_Kong_zh.md)

[^sources]: 该专题名称与 CUHK IE 的[官方系所介绍](https://www.ie.cuhk.edu.hk/about-the-department/)相一致：信息工程同时处理信息的生成、传输、存储、处理与应用；ICML 2026 的会议时间来自[官方会议页面](https://icml.cc/Conferences/2026)。
