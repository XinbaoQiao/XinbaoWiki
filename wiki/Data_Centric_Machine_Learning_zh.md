---
type: 研究专题
title: 数据中心 ML
description: 关注数据质量、选择、估值、修正和治理的研究专题。
tags:
  - zh
  - research
  - topic
  - 研究专题
timestamp: '2026-05-27T17:56:27+08:00'
modified: '2026-07-02T20:03:20+08:00'
content_hash: 'sha256:b5ed150616b6bc664087f36dc9e5d5cdb8b191aa624cf0ed96b40dce31f72b12'
reviewed_at: '2026-07-02T20:03:20+08:00'
review_due: '2026-12-29'
name: 数据中心 ML
language: zh
summary: 关注数据质量、选择、估值、修正和治理的研究专题。
aliases:
  - Data-Centric Machine Learning
occupation: 研究专题
image: /topics/data-centric-ml.png
image_caption: 数据中心 ML 主题图
translation_of: Data_Centric_Machine_Learning
---
**数据中心 ML** 是本 wiki 对 data-centric machine learning 的简称。它指的是把数据变化本身作为一阶干预对象的研究，而不仅仅通过修改模型结构来提升性能。相关操作包括选择、剪枝、加权、删除、合成和跨方评估。

## 引言

本页把主要干预来自数据操作的项目放在一起。有些操作发生在训练之后，例如删除和重加权；有些发生在训练前或训练中，例如剪枝、合成数据筛选和跨孤岛评估。该专题连接了乔鑫宝早期机器遗忘工作与当前 AI 与网络方向。

## 在本 wiki 中的作用

本页解释为什么 [[Data_Selection|数据选择]]、[[Sample_Selection_Bias|样本选择偏差]]、[[Synthetic_Data|合成数据]]、[[Machine_Unlearning|机器遗忘]] 和 [[Collaborative_Evaluation|协作评估]] 属于同一研究图谱。它们都在追问：当数据过程发生变化时，模型行为如何变化，哪些数据重要，哪些数据会伤害可靠性，以及哪些数据可以在现实成本约束下被忽略。

## 论文

| 论文 | 会议/状态 |
| --- | --- |
| [[Hessian_Free_Online_Certified_Unlearning|无 Hessian 在线认证遗忘]] | ICLR 2025，2025年4月24日至28日，新加坡。 |
| [[DynFrs|DynFrs：随机森林机器遗忘高效框架]] | ICLR 2025，2025年4月24日至28日，新加坡。 |
| [[Soft_Weighted_Machine_Unlearning|超越二元擦除：用于公平性与鲁棒性的软加权遗忘]] | AAAI 2026，2026年1月20日至27日，新加坡。 |
| [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|样本选择偏差何以促成模型坍缩]] | ICML 2026，2026年7月6日至11日，首尔。 |

## 与乔鑫宝工作的关系

在乔鑫宝的论文记录中，数据中心 ML 以多种形式出现。机器遗忘中，数据操作是训练后的删除或重加权；模型坍缩工作中，数据操作是递归训练前对真实或合成样本的选择，其中低资源验证场景暴露了本地过滤器可能把稀有有效模式误认为低质量样本的问题。共同主题是让学习系统在真实成本约束下识别“哪些数据重要”。

## 参见

- [[Data_Selection|数据选择]]
- [[Sample_Selection_Bias|样本选择偏差]]
- [[Synthetic_Data_and_Model_Collapse|合成数据]]
- [[Machine_Unlearning|机器遗忘]]
- [[AI_and_Networks|AI 与网络]]
