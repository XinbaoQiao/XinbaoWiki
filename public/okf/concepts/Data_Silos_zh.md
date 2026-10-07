---
type: 研究概念
title: 数据孤岛
description: 数据共享受限时的跨机构学习与评估。
tags:
  - zh
  - research
  - concept
  - 研究概念
timestamp: '2026-05-27T17:56:27+08:00'
modified: '2026-10-07T07:07:23.837Z'
content_hash: 'sha256:0709d7516ccb1151356300f405ce288cd94f86c0d49a17db3ae04512c9b556cd'
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
  document_id: 'wiki:Data_Silos_zh'
  chunking: markdown-heading-v1
source_ids: []
source_path: wiki/Data_Silos_zh.md
---
**数据孤岛** 是组织、法律、技术或地理隔离造成的状态，使所有训练数据无法被汇集到一个地方。各机构、设备或客户端只持有目标分布的局部视角。

## 研究背景

数据孤岛是 [AI 与网络](./AI_and_Networks_zh.md) 区别于普通中心化机器学习的关键原因。当每一方只看到本地数据时，训练和评估必须面对通信、隐私和代表性约束。孤岛能保护数据所有权，但也会让全局诊断更困难：偏差可能在本地不可见，只有比较多方证据时才显现。对于低资源数据持有者，这一点尤其关键，因为其本地数据可能从一开始就缺少尾部区域。

## 与乔鑫宝工作的关系

数据孤岛是 [样本选择偏差何以促成模型坍缩](./When_Sample_Selection_Bias_Precipitates_Model_Collapse_zh.md) 的核心设置，论文研究低资源局部样本选择偏差下的递归合成数据训练。在这一设置中，问题不是单纯模型精度，而是多方如何在不假定完整数据访问的情况下协调。

## 参见

- [AI 与网络](./AI_and_Networks_zh.md)
- [分布式学习](./Distributed_Learning_zh.md)
- [协作评估](./Collaborative_Evaluation_zh.md)
- [样本选择偏差](./Sample_Selection_Bias_zh.md)
