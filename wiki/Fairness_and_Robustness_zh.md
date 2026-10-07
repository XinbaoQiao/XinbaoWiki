---
type: 研究概念
title: 公平性与鲁棒性
description: 以公平性与鲁棒性为目标的数据驱动模型修正。
tags:
  - zh
  - research
  - concept
  - 研究概念
timestamp: '2026-05-05T23:25:14+08:00'
modified: '2026-10-07T07:11:31.523Z'
content_hash: 'sha256:95aadf13b2c49d124e6f6d199a6a44ad4b847e2aa4a3a14a887817f6f342bea1'
reviewed_at: '2026-10-07T07:11:31.730Z'
review_due: '2027-04-05'
name: 公平性与鲁棒性
language: zh
summary: 以公平性与鲁棒性为目标的数据驱动模型修正。
occupation: 研究概念
translation_of: Fairness_and_Robustness
---
**公平性与鲁棒性** 是在一定条件下可通过调整数据或数据权重来改善的可靠性目标。公平性关注不同群体之间系统性的表现或待遇差异；鲁棒性关注模型在扰动、数据损坏、对抗输入或分布偏移下的稳定性。

## 研究背景

乔鑫宝的机器遗忘工作也关注删除操作对公平性与鲁棒性的影响。在 [[Soft_Weighted_Machine_Unlearning|超越二元擦除]] 中，操作从二元擦除推广为连续加权，使某些数据可以被部分删除、修正或强调。这样，公平性与鲁棒性成为数据操作层的一部分，而不是训练后的独立后处理。

## 与乔鑫宝工作的关系

乔鑫宝的 AAAI 2026 论文研究非二元的软加权遗忘：通过调整每个样本保留的影响，在改善公平性或鲁棒性的同时限制效用损失。它以数据权重作为 [[Data_Centric_Machine_Learning|数据中心 ML]] 的干预手段，也服务于 [[Trustworthy_AI|可信 AI]] 在社会或对抗约束下提高模型可靠性的目标。

## 参见

- [[Soft_Weighted_Machine_Unlearning|超越二元擦除]]
- [[Machine_Unlearning|机器遗忘]]
- [[Trustworthy_AI|可信 AI]]
- [[Influence_Functions|影响函数]]
