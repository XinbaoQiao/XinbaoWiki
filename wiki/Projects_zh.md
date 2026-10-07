---
type: 项目概览
title: 项目
description: AI 与网络、机器遗忘、合成数据及语言模型可靠性研究项目。
tags:
  - zh
  - project
  - overview
  - 项目概览
timestamp: '2026-06-13T20:46:02+08:00'
modified: '2026-10-07T07:07:23.928Z'
content_hash: 'sha256:c979c5302e1791e3ca0d502436ed0d586e1458aa78b7d050c6acebd22b614ffa'
reviewed_at: '2026-10-07T07:07:51.129Z'
review_due: '2027-01-05'
name: 项目
language: zh
summary: AI 与网络、机器遗忘、合成数据及语言模型可靠性研究项目。
occupation: 项目概览
translation_of: Projects
---
## 研究项目

### AI 与网络

[[AI_and_Networks|AI 与网络]] 是当前主要研究方向。它包括 AI for Networks、Networks for AI、去中心化学习的数据剪枝、通信感知评估、跨数据孤岛的可靠性，以及基于 Wasserstein 几何的参考分布计算。

### 分布式 Wasserstein barycenter

[[Distributed_Wasserstein_Barycenter|分布式 Wasserstein barycenter]] 是 AI 与网络方向的研究项目之一。它研究多方如何从局部经验分布计算或近似共享的分布参考，并服务于协作评估、样本打分和合成数据验证。

### 机器遗忘

[[Machine_Unlearning|机器遗忘]] 包括可微模型的近似认证遗忘，以及树集成的精确或高效遗忘。相关工作包括 [[Hessian_Free_Online_Certified_Unlearning|无 Hessian 在线认证遗忘]]、[[Soft_Weighted_Machine_Unlearning|超越二元擦除]] 和 [[DynFrs|DynFrs]]。

### 协作评估

[[Collaborative_Evaluation|协作评估]] 研究不交换原始数据的验证。它在 ICML 2026 模型坍缩工作中用于以多方 Wasserstein 几何代理替代单一低资源、有偏验证器。

### 合成数据

[[Synthetic_Data_and_Model_Collapse|合成数据]] 追问生成数据何时能够安全替代或增强真实数据，以及递归训练何时放大偏差或侵蚀多样性。当前重点是低资源社区：当真实数据覆盖碎片化时，本地过滤更容易剪掉有效尾部模式。代表性论文是 [[When_Sample_Selection_Bias_Precipitates_Model_Collapse|样本选择偏差何以促成模型坍缩]]。

### 可信大语言模型系统

[[LLM_Reliability|大语言模型可靠性]] 研究提示中出现误导性模式时，语言模型能否恰当地使用证据。获 NeurIPS 2026 录用的[[Illusory_Pattern_Perception_Drives_Spurious_Inference_in_Large_Language_Models|《Illusory Pattern Perception Drives Spurious Inference in Large Language Models》]]研究感知到的提示模式如何诱发缺乏证据支持的推理。
