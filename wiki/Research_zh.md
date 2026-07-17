---
type: 研究概览
title: 研究
description: 乔鑫宝研究方向与相关专题页面概览。
tags:
  - zh
  - research
  - overview
  - 研究概览
timestamp: '2026-06-13T20:46:02+08:00'
modified: '2026-07-11T07:28:06+08:00'
content_hash: 'sha256:0b3775a6da8240e7a8826285d93d76a8f51202552c6969c4c028ff60fb890bcf'
reviewed_at: '2026-07-11T07:28:06+08:00'
review_due: '2026-10-08'
name: 研究
language: zh
summary: 乔鑫宝研究方向与相关专题页面概览。
occupation: 研究概览
translation_of: Research
---
本页总结乔鑫宝学术 wiki 中的主要研究方向。它不是静态兴趣列表，而是由多个相互链接的专题页编译出的研究图谱。当前重心是[[Data_Centric_Machine_Learning|数据中心 ML]]和双向的 [[AI_and_Networks|AI 与网络]]问题。

## 研究主线

乔鑫宝主要围绕 AI 模型中数据的全生命周期管理开展研究，关注数据从生成、使用到删除过程中的理论方法与实际问题。相关工作致力于提升 AI 模型在异质、计算和通信受限环境下的可靠性、可解释性与可控性。

1. 在数据生成方面，研究合成数据及其质量、隐私与泛化影响；
2. 在数据使用方面，关注分布式/联邦学习、AI for Networks 与 Networks for AI 等场景下的数据建模、协同优化与系统设计；
3. 在数据删除方面，研究机器遗忘与数据影响评估，探索如何在保护隐私和满足删除需求的同时维持模型性能。

## AI 与网络

[[AI_and_Networks|AI 与网络]] 覆盖 AI 与网络通信系统的交叉：AI for Networks、Networks for AI、去中心化学习、数据剪枝和协作评估。在当前 CUHK 博士阶段，这条主线与[[Data_Centric_Machine_Learning|数据中心 ML]]相结合，并包括[[Distributed_Wasserstein_Barycenter|Wasserstein barycenter 的分布式计算]]等工具，即在不默认汇总原始数据的前提下，把多方局部分布组合成共享的分布参考。

## 机器遗忘

[[Machine_Unlearning|机器遗忘]] 研究删除请求后的认证数据删除和低成本更新机制。相关页面包括 [[Hessian_Free_Online_Certified_Unlearning|无 Hessian 在线认证遗忘]]、[[Soft_Weighted_Machine_Unlearning|超越二元擦除]]、[[DynFrs|DynFrs]]、[[Influence_Functions|影响函数]] 和 [[Certified_Data_Removal|认证数据删除]]。

## 合成数据

[[Synthetic_Data_and_Model_Collapse|合成数据]] 研究递归合成数据训练、[[Data_Selection|数据选择]]、[[Sample_Selection_Bias|样本选择偏差]]、[[Model_Collapse|模型坍缩]]，以及低资源 [[Data_Silos|数据孤岛]] 中的协作缓解。中心论文是 [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|样本选择偏差何以促成模型坍缩]]，其核心表述是：当真实数据覆盖稀缺或碎片化时，模型坍缩风险尤其高。

## 数据中心 ML 与可信 AI

[[Data_Centric_Machine_Learning|数据中心 ML]] 覆盖数据选择、估值、过滤和评估。[[Trustworthy_AI|可信 AI]] 连接机器遗忘、公平性、鲁棒性、隐私、安全、可解释性和可靠性。

## 几何与分布式学习

[[Wasserstein_Geometry|Wasserstein 几何]]、[[Distributed_Wasserstein_Barycenter|分布式 Wasserstein barycenter]] 与 [[Distributed_Learning|分布式学习]] 为协作评估、最优传输代理、去中心化数据访问，以及网络化 AI 系统中的分布参考提供工具。
