---
type: publication
title: 无 Hessian 在线认证遗忘
description: ICLR 2025 论文，研究无显式 Hessian 求逆的高效认证机器遗忘。
tags:
  - zh
  - publication
  - paper
  - iclr-2025-poster
  - iclr-2025
timestamp: '2026-05-05T23:25:14+08:00'
modified: '2026-07-16T20:08:42+08:00'
content_hash: 'sha256:61f88b28567cc8c89e63a8e28760d7e18e12868069d2aefb90848e7b9a92ba72'
reviewed_at: '2026-07-16T20:08:42+08:00'
review_due: '2026-10-14'
name: 无 Hessian 在线认证遗忘
language: zh
summary: ICLR 2025 论文，研究无显式 Hessian 求逆的高效认证机器遗忘。
authors:
  - Xinbao Qiao
  - 张萌
  - Ming Tang
  - Ermin Wei
venue: ICLR 2025
location: 'Singapore EXPO, Singapore'
year: 2025
status: ICLR 2025 poster
publication_type: 会议论文
links:
  - label: OpenReview
    url: 'https://openreview.net/forum?id=C3TrHWanh5'
  - label: arXiv
    url: 'https://arxiv.org/abs/2404.01712'
  - label: Code
    url: 'https://github.com/XinbaoQiao/Hessian-Free-Certified-Unlearning'
translation_of: Hessian_Free_Online_Certified_Unlearning
---
**无 Hessian 在线认证遗忘** 是 **[[Xinbao_Qiao|乔鑫宝]]**、张萌、Ming Tang 和 Ermin Wei 的 ICLR 2025 会议论文。论文提出一种面向随机训练流程的认证机器遗忘方法，目标是在显式存储 Hessian、求逆 Hessian 或反复重新训练代价过高时，仍能把删除请求转化为在线向量更新。

![无 Hessian 在线认证遗忘 ICLR 2025 poster](/papers/hessian-free/poster.png)

## 概述

论文研究 [[Certified_Data_Removal|认证数据删除]]。早期认证遗忘方法常使用基于二阶统计量的 Newton 式校正，但在高维或过参数化模型中，构造、存储或求逆 Hessian 都可能不可承受。本文的关键转变是把训练视为一条随机优化轨迹，而不是只看最终最优点。

具体来说，算法为每个样本记录轨迹统计，近似“若该样本在随机训练过程中缺席，模型会如何变化”。这种视角弱化了严格凸经验风险最小化假设，也避免了直接处理完整 Hessian 矩阵。

## 方法

方法通过仿射随机递推为每个训练点 recollect 一个近似向量。该向量跟踪完整数据训练模型与删除某样本后反事实模型之间的差异。由于更新可以通过 Hessian-vector product 计算，算法无需显式物化 Hessian，同时保留认证式近似保证。

预计算完成后，在线删除具有加性结构：一批删除请求可以通过求和已存储的逐样本近似向量，并对当前模型施加一次向量更新来处理。

## 关键启示

- **机器遗忘需要可执行的系统模型，而不只是法律理想。** 论文把删除请求视为具体的系统事件：它必须在不完整重训、也不存储巨大二阶对象的情况下被处理。
- **训练轨迹本身包含可复用的删除信息。** 方法不是让最终模型独自解释未来所有删除，而是在训练过程中保留足够的轨迹级信息，使之后的更新更便宜。
- **认证性和效率需要一起设计。** 贡献不只是更快的遗忘，而是在避免显式 Hessian 物化的同时，保留与重训结果之间的证书式联系。
- **更宏观的启示是模型生命周期准备。** 面向监管或用户请求的模型，应当在训练阶段就考虑未来删除，而不是上线后再临时修补。

## 结果

论文报告毫秒级遗忘执行时间，并相对于基于 Hessian 的认证遗忘基线显著降低时间和存储成本。在大规模应用实验中，该方法通过向量加法删除样本，同时保持接近重新训练的测试精度。

论文还包含 membership inference 分析，强调认证遗忘不能只看近似重新训练和模型效用，也应检查多次模型发布下的隐私泄漏风险。

## 定位

该工作属于 [[Machine_Unlearning|机器遗忘]]、[[Certified_Data_Removal|认证数据删除]] 和 [[Trustworthy_AI|可信 AI]]。在乔鑫宝的论文记录中，它是可微模型方向的遗忘工作；[[DynFrs|DynFrs]] 则是树模型方向的精确遗忘工作。
