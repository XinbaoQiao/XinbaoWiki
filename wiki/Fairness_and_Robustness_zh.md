---
type: 研究概念
title: 公平性与鲁棒性
description: 解释公平性与鲁棒性作为数据中心修正目标的概念页。
tags:
  - zh
  - research
  - concept
  - 研究概念
timestamp: '2026-05-05T23:25:14+08:00'
name: 公平性与鲁棒性
language: zh
summary: 解释公平性与鲁棒性作为数据中心修正目标的概念页。
occupation: 研究概念
translation_of: Fairness_and_Robustness
---
**公平性与鲁棒性** 在本 wiki 中被视为可通过数据或数据权重修正的可靠性目标。公平性关注不同群体之间系统性的表现或待遇差异；鲁棒性关注模型在扰动、腐败、对抗输入或分布偏移下的稳定性。

## 在本 wiki 中的作用

本页存在的原因是乔鑫宝的机器遗忘工作并不把删除仅仅视为法律或隐私操作。在 [[Soft_Weighted_Machine_Unlearning|超越二元擦除]] 中，操作从二元擦除推广为连续加权，使某些数据可以被部分删除、修正或强调。这样，公平性与鲁棒性成为数据操作层的一部分，而不是训练后的独立后处理。

## 与乔鑫宝工作的关系

乔鑫宝的 AAAI 2026 论文把软加权遗忘定义为非二元修正问题：它不只问某个点是否应该消失，而是问不同数据应保留多少影响，以同时改善公平性、鲁棒性和效用。这连接 [[Data_Centric_Machine_Learning|数据中心 ML]]，因为干预被编码为数据权重；也连接 [[Trustworthy_AI|可信 AI]]，因为目标是在社会或对抗约束下提高模型行为可靠性。

## 参见

- [[Soft_Weighted_Machine_Unlearning|超越二元擦除]]
- [[Machine_Unlearning|机器遗忘]]
- [[Trustworthy_AI|可信 AI]]
- [[Influence_Functions|影响函数]]
