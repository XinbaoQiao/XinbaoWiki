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
language: zh
lifecycle:
  status: active
  confidence: 0.9
  review: periodic
  retention: semantic memory
source_path: wiki/Hessian_Free_Online_Certified_Unlearning_zh.md
---
**无 Hessian 在线认证遗忘** 是 **[乔鑫宝](./Qiao_Xinbao_zh.md)**、张萌、Ming Tang 和 Ermin Wei 的 ICLR 2025 会议论文。论文提出一种认证机器遗忘过程，面向显式存储或求逆 Hessian 代价过高的模型。

## 概述

论文研究 [认证数据删除](./Certified_Data_Removal_zh.md)。早期认证遗忘方法常使用基于二阶统计量的 Newton 式校正，但在高维或过参数化模型中，构造、存储或求逆 Hessian 都可能不可承受。本文的关键转变是把训练视为一条随机优化轨迹，而不是只看最终最优点。

具体来说，算法为每个样本记录轨迹统计，近似“若该样本在随机训练过程中缺席，模型会如何变化”。这种视角弱化了严格凸经验风险最小化假设，也避免了直接处理完整 Hessian 矩阵。

## 方法

方法通过仿射随机递推为每个训练点 recollect 一个近似向量。该向量跟踪完整数据训练模型与删除某样本后反事实模型之间的差异。由于更新可以通过 Hessian-vector product 计算，算法无需显式物化 Hessian，同时保留认证式近似保证。

预计算完成后，在线删除具有加性结构：一批删除请求可以通过求和已存储的逐样本近似向量，并对当前模型施加一次向量更新来处理。

![无 Hessian 在线认证遗忘流程](/papers/hessian-free/ours.png)

![无 Hessian 在线认证遗忘 ICLR 2025 poster](/papers/hessian-free/poster.png)

## 关键公式

设 $a^{-u}_{E,B}$ 为删除样本 $u$ 的 recollected trajectory approximator，$\widehat{H}$ 为沿后续训练轨迹累积的 Hessian-vector-product 算子。存储近似量可写为：

$$
a^{-u}_{E,B}
\approx
\sum_{e=0}^{E}
\frac{\eta_{e,b(u)}}{\lvert B_{e,b(u)}\rvert}
\widehat{H}_{E,B-1\rightarrow e,b(u)+1}
\nabla \ell(w_{e,b(u)};u).
$$

对删除集合 $U$，在线遗忘更新为：

$$
\bar{w}^{-U}_{E,B}
=w_{E,B}+\sum_{u\in U}a^{-u}_{E,B}.
$$

加性结构解释了在线阶段为何高效：预计算之后，删除请求不需要重新求解线性系统，也不需要 Hessian 求逆。

## 结果

论文报告毫秒级遗忘执行时间，并相对于基于 Hessian 的认证遗忘基线显著降低时间和存储成本。在大规模应用实验中，该方法通过向量加法删除样本，同时保持接近重新训练的测试精度。

论文还包含 membership inference 分析，强调认证遗忘不能只看近似重新训练和模型效用，也应检查多次模型发布下的隐私泄漏风险。

## 定位

该工作属于 [机器遗忘](./Machine_Unlearning_zh.md)、[认证数据删除](./Certified_Data_Removal_zh.md) 和 [可信 AI](./Trustworthy_AI_zh.md)。在乔鑫宝的论文记录中，它是可微模型方向的遗忘工作；[DynFrs](./DynFrs_zh.md) 则是树模型方向的精确遗忘工作。
