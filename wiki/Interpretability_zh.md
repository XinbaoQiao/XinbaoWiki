---
type: 研究概念
title: 可解释性
description: 解释模型行为和数据影响的概念页。
tags:
  - zh
  - research
  - concept
  - 研究概念
  - llm
timestamp: '2026-05-05T23:25:14+08:00'
name: 可解释性
language: zh
summary: 解释模型行为和数据影响的概念页。
occupation: 研究概念
translation_of: Interpretability
---
**可解释性** 指帮助人理解模型为何产生某种行为的方法。在本 wiki 中，重点比整个可解释性领域更窄，主要关注数据影响、错误诊断，以及支持可信决策的解释。

## 在本 wiki 中的作用

可解释性是 [[Trustworthy_AI|可信 AI]] 和 [[Data_Centric_Machine_Learning|数据中心 ML]] 的支撑主题。模型可以准确但难以审计；如果研究者能说明哪些样本、群体或合成数据过程导致了某种行为，下一步就可以是数据选择、遗忘、修正或协作评估。可解释性因此把解释连接到干预。

## 与乔鑫宝工作的关系

本 wiki 主要通过 [[Influence_Functions|影响函数]] 和机器遗忘把可解释性连接到乔鑫宝的工作。[[Hessian_Free_Online_Certified_Unlearning|无 Hessian 在线认证遗忘]] 与 [[Soft_Weighted_Machine_Unlearning|超越二元擦除]] 都依赖对数据变化如何影响模型参数或预测的理解。合成数据研究也需要更广义的可解释性：当模型坍缩发生时，研究问题是退化由何种数据过程引起、分布式参与方如何发现它。

## 参见

- [[Influence_Functions|影响函数]]
- [[Trustworthy_AI|可信 AI]]
- [[Machine_Unlearning|机器遗忘]]
- [[Data_Centric_Machine_Learning|数据中心 ML]]
