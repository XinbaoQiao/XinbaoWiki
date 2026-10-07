---
type: 研究概念
title: 认证数据删除
description: 机器遗忘中的数据删除保证。
tags:
  - zh
  - research
  - concept
  - 研究概念
  - machine-unlearning
timestamp: '2026-05-05T23:25:14+08:00'
modified: '2026-10-07T07:07:23.805Z'
content_hash: 'sha256:162f4178318d09c46918ee17539661a9c8f5880cbee839f5b518cbfdfcb8b146'
reviewed_at: '2026-10-07T07:07:51.129Z'
review_due: '2027-04-05'
name: 认证数据删除
language: zh
summary: 机器遗忘中的数据删除保证。
occupation: 研究概念
translation_of: Certified_Data_Removal
---
**认证数据删除** 指机器学习方法对“删除某些数据后模型应如何变化”给出明确可检验保证。在 [[Machine_Unlearning|机器遗忘]] 中，认证保证约束更新后的模型与去除相应数据后重新训练所得模型之间的差距。[^certified]

## 研究背景

“认证”并不意味着模型整体安全或公平，而是指方法陈述了一个可度量的删除标准，例如参数、损失、预测或分布在删除前后的差异。

## 与乔鑫宝工作的关系

乔鑫宝的 Hessian-free 工作围绕在线更新约束下的认证删除展开。论文避免显式 Hessian 求逆，这一点对已部署系统很重要，因为精确二阶操作可能昂贵且不稳定。认证数据删除也涉及 [[AI_and_Networks|AI 与网络]] 中的系统问题：如何在可接受的计算成本和延迟下提供删除保证。

## 参见

- [[Machine_Unlearning|机器遗忘]]
- [[Hessian_Free_Online_Certified_Unlearning|无 Hessian 在线认证遗忘]]
- [[Influence_Functions|影响函数]]
- [[Trustworthy_AI|可信 AI]]

[^certified]: Guo 等人在 ICML 2020 的 “Certified Data Removal from Machine Learning Models” 是将删除视为认证式近似重新训练的代表性参考之一。
