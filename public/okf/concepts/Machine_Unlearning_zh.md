---
type: 研究专题
title: 机器遗忘
description: 研究如何从已训练模型中删除、降低或纠正数据影响。
tags:
  - zh
  - research
  - topic
  - 研究专题
  - machine-unlearning
timestamp: '2026-05-05T23:25:14+08:00'
language: zh
lifecycle:
  status: active
  confidence: 0.9
  review: periodic
  retention: semantic memory
source_path: wiki/Machine_Unlearning_zh.md
---
**机器遗忘** 研究模型训练完成后，如何删除、降低或纠正特定训练数据对模型的影响。在本 wiki 中，它既是隐私问题，也是数据中心系统问题：一个遗忘算法需要说明删除了什么、与重新训练的结果有多接近，以及节省了多少计算和延迟成本。[^unlearning]

## 引言

本专题覆盖训练后的数据操作，包括认证删除、树模型中的精确删除，以及用于公平性和鲁棒性修正的连续加权。共同问题是：当数据记录发生变化时，能否在不从头重新训练的情况下修正已部署模型。

## 在本 wiki 中的作用

本页组织乔鑫宝关于训练后数据操作的论文脉络。该脉络包括认证删除、软加权修正和随机森林更新。它与 [数据中心 ML](./Data_Centric_Machine_Learning_zh.md) 紧密相关，因为核心对象不是新的模型结构，而是能够改变模型行为的数据操作；它也连接 [可信 AI](./Trustworthy_AI_zh.md)，因为删除请求、公平性修正和鲁棒性干预都属于对已训练系统的治理。

## 论文

| 论文 | 会议/状态 |
| --- | --- |
| [无 Hessian 在线认证遗忘](./Hessian_Free_Online_Certified_Unlearning_zh.md) | ICLR 2025，2025年4月24日至28日，新加坡。 |
| [DynFrs：随机森林机器遗忘高效框架](./DynFrs_zh.md) | ICLR 2025，2025年4月24日至28日，新加坡。 |
| [超越二元擦除：用于公平性与鲁棒性的软加权遗忘](./Soft_Weighted_Machine_Unlearning_zh.md) | AAAI 2026，2026年1月20日至27日，新加坡。 |

## 与乔鑫宝工作的关系

乔鑫宝的机器遗忘论文覆盖互补设置。[无 Hessian 在线认证遗忘](./Hessian_Free_Online_Certified_Unlearning_zh.md) 面向可微模型，在避免显式 Hessian 求逆的同时给出认证式近似；[超越二元擦除](./Soft_Weighted_Machine_Unlearning_zh.md) 将删除从二元保留/移除推广为连续权重，用于公平性和鲁棒性修正；[DynFrs](./DynFrs_zh.md) 则研究随机森林中的精确、低延迟更新机制。三者共同构成从数学认证到实用模型维护的研究线。

## 参见

- [认证数据删除](./Certified_Data_Removal_zh.md)
- [影响函数](./Influence_Functions_zh.md)
- [公平性与鲁棒性](./Fairness_and_Robustness_zh.md)
- [随机森林](./Random_Forest_zh.md)
- [论文](./Publications_zh.md)

[^unlearning]: 机器遗忘领域的常见起点包括 Bourtoule 等人在 IEEE S&P 2021 的 “Machine Unlearning”，该文提出用分片、隔离、切片和聚合训练作为删除数据的一种实用途径。
