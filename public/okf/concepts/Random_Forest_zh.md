---
type: 模型族
title: 随机森林
description: 随机化决策树集成模型及其在 DynFrs 中的高效维护。
tags:
  - zh
  - research
  - model
  - 模型族
timestamp: '2026-05-05T23:25:14+08:00'
modified: '2026-10-07T07:07:23.933Z'
content_hash: 'sha256:e98384a8ad5a5aeb0d2009ccd0bcd9f8af7874eb942245997d6bf60699a8aae3'
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
  document_id: 'wiki:Random_Forest_zh'
  chunking: markdown-heading-v1
source_ids: []
source_path: wiki/Random_Forest_zh.md
---
**随机森林** 是由多棵决策树组成的集成模型，训练中通常对样本、特征或划分候选引入随机性。它在表格数据上表现强、相对稳健，并且比许多神经模型更容易检查。[^breiman]

## 研究背景

随机森林对机器遗忘很重要，因为其结构是离散的：删除一个训练点可能影响路径、叶节点统计，甚至多棵树的划分决策。朴素重新训练基线清晰但昂贵；有用的遗忘框架必须在保持森林分布的同时减少不必要重算。

## 与乔鑫宝工作的关系

DynFrs 研究动态环境下随机森林的机器遗忘。论文核心设计使用 lazy tags 和更新逻辑，避免每次删除或修改请求后重建整个森林。这项工作将模型维护与 [机器遗忘](./Machine_Unlearning_zh.md)、[AI 与网络](./AI_and_Networks_zh.md) 联系起来：当数据持续变化时，如何以较低延迟更新已部署模型。

## 参见

- [DynFrs](./DynFrs_zh.md)
- [机器遗忘](./Machine_Unlearning_zh.md)
- [认证数据删除](./Certified_Data_Removal_zh.md)
- [数据中心 ML](./Data_Centric_Machine_Learning_zh.md)

[^breiman]: Leo Breiman 2001 年发表在 Machine Learning 的 “Random Forests” 是该模型族的标准参考。
