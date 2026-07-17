---
type: 模型族
title: 随机森林
description: 解释 DynFrs 所研究的随机森林模型类别。
tags:
  - zh
  - research
  - model
  - 模型族
timestamp: '2026-05-05T23:25:14+08:00'
modified: '2026-07-02T20:03:20+08:00'
content_hash: 'sha256:6d257e9e58d7a5cdcb995d7953ef20d0399f947e387488808ee5cc005c98eec8'
reviewed_at: '2026-07-02T20:03:20+08:00'
review_due: '2026-12-29'
name: 随机森林
language: zh
summary: 解释 DynFrs 所研究的随机森林模型类别。
occupation: 模型族
translation_of: Random_Forest
---
**随机森林** 是由多棵决策树组成的集成模型，训练中通常对样本、特征或划分候选引入随机性。它在表格数据上表现强、相对稳健，并且比许多神经模型更容易检查。[^breiman]

## 在本 wiki 中的作用

本页为 [[DynFrs|DynFrs：随机森林机器遗忘高效框架]] 提供模型背景。随机森林对机器遗忘很重要，因为其结构是离散的：删除一个训练点可能影响路径、叶节点统计，甚至多棵树的划分决策。朴素重新训练基线清晰但昂贵；有用的遗忘框架必须在保持森林分布的同时减少不必要重算。

## 与乔鑫宝工作的关系

DynFrs 研究动态环境下随机森林的机器遗忘。论文核心设计使用 lazy tags 和更新逻辑，避免每次删除或修改请求后重建整个森林。在乔鑫宝的 wiki 中，随机森林页把实际模型维护连接到 [[Machine_Unlearning|机器遗忘]] 与 [[AI_and_Networks|AI 与网络]]：核心问题是当数据不断变化且延迟重要时，如何维护已部署模型。

## 参见

- [[DynFrs|DynFrs]]
- [[Machine_Unlearning|机器遗忘]]
- [[Certified_Data_Removal|认证数据删除]]
- [[Data_Centric_Machine_Learning|数据中心 ML]]

[^breiman]: Leo Breiman 2001 年发表在 Machine Learning 的 “Random Forests” 是该模型族的标准参考。
