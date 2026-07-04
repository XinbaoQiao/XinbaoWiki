---
type: publication
title: 超越二元擦除：用于公平性与鲁棒性的软加权遗忘
description: AAAI 2026 论文，研究用于公平性与鲁棒性修正的软加权机器遗忘。
tags:
  - zh
  - publication
  - paper
  - accepted
  - aaai-2026
  - machine-unlearning
timestamp: '2026-05-05T23:25:14+08:00'
name: 超越二元擦除：用于公平性与鲁棒性的软加权遗忘
language: zh
summary: AAAI 2026 论文，研究用于公平性与鲁棒性修正的软加权机器遗忘。
authors:
  - Xinbao Qiao
  - Ningning Ding
  - Yushi Cheng
  - Meng Zhang
venue: AAAI 2026
location: 'Singapore EXPO, Singapore'
year: 2026
status: accepted
publication_type: 会议论文
links:
  - label: arXiv
    url: 'https://arxiv.org/abs/2505.18783'
  - label: AAAI 2026 lecture page
    url: >-
      https://underline.io/lecture/139759-beyond-binary-erasure-soft-weighted-unlearning-for-fairness-and-robustness
translation_of: Soft_Weighted_Machine_Unlearning
---
**超越二元擦除：用于公平性与鲁棒性的软加权遗忘** 是 **[[Xinbao_Qiao|乔鑫宝]]**、Ningning Ding、Yushi Cheng 和张萌的 AAAI 2026 会议论文。它把机器遗忘重新表述为连续的数据影响修正问题，而不是只能执行“删除或保留”的二元操作。论文关注的是在改善公平性或鲁棒性时，每个样本应保留多少影响，才能避免不必要的效用损失。

## 概述

论文研究隐私驱动遗忘与修正驱动遗忘之间的差异。在“被遗忘权”场景中，二元删除很自然：一个样本要么保留，要么移除。但在公平性和鲁棒性修正中，目标往往是降低有害影响，同时保留仍然有用的信号。

论文把硬删除带来的失败模式称为 **over-unlearning**：直接删除可能改善目标公平性或鲁棒性指标，却损害效用、把偏差推向相反方向，或把边界样本当作极端有害样本处理。

## 方法

方法用连续样本权重替代二元删除权重。它首先估计每个样本对目标指标与效用的影响，然后求解一个凸二次规划得到定制化权重向量。所得权重被用于影响函数式遗忘或相关校正方法，使有害样本能够被下调权重，而不是被统一视为可完全删除。

![软加权机器遗忘框架](/papers/soft-weighted/framework.png)

三阶段流程为：

1. 估计每个样本对公平性或鲁棒性目标以及效用的影响；
2. 求解连续权重，使目标指标改善，同时约束效用损失；
3. 应用加权模型校正，而不是删除固定 top-k 样本集合。

## 关键公式

设 $I_{\mathrm{metric}}(z_i)$ 表示样本对公平性或鲁棒性目标的影响，$I_{\mathrm{util}}(z_i)$ 表示其对效用的影响。软删除权重可通过正则化修正问题得到：

$$
\epsilon^\star
=
\arg\min_{\epsilon}
\sum_i \epsilon_i I_{\mathrm{metric}}(z_i)
+\lambda\lVert\epsilon\rVert_2^2
$$

并满足：

$$
\sum_i \epsilon_i I_{\mathrm{metric}}(z_i)\le -\Delta,
\qquad
\sum_i \epsilon_i I_{\mathrm{util}}(z_i)\le 0,
\qquad
0\le \epsilon_i\le 1 .
$$

随后模型修正采用影响函数更新：

$$
\theta_{\mathrm{soft}}
=
\widehat{\theta}
-H_{\widehat{\theta}}^{-1}
\sum_i \epsilon_i^\star\nabla_\theta \ell(z_i;\widehat{\theta}) .
$$

这些约束把该方法与硬 top-k 删除区分开：目标指标必须改善，但不能用不必要的效用退化来换取改善。

## 结果

实验覆盖表格、图像和文本数据集，包括 Adult、Bank、Jigsaw、CelebA 以及 CIFAR 鲁棒性评估。论文报告软加权方法比硬加权方案更稳定地改善公平性或鲁棒性指标，同时降低效用损失。

诊断实验也支持方法动机：leave-one-out 和影响式分析显示，对目标指标有害的样本并不总是对效用有害。因此，“删除或保留”的二元规则对修正驱动遗忘而言过于粗糙。

## 定位

该工作属于 [[Machine_Unlearning|机器遗忘]]、[[Fairness_and_Robustness|公平性与鲁棒性]]、[[Influence_Functions|影响函数]] 和 [[Trustworthy_AI|可信 AI]]。它补充了 [[Hessian_Free_Online_Certified_Unlearning|无 Hessian 在线认证遗忘]]：问题从隐私删除转向细粒度模型修正。
