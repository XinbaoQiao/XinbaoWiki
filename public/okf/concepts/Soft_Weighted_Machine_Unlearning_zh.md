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
modified: '2026-07-16T20:08:42+08:00'
content_hash: 'sha256:0081860c702601e108aa2ca1ae0519b8f89ecba44dd3585e716f6dc0198efa1c'
reviewed_at: '2026-07-16T20:08:42+08:00'
review_due: '2027-07-16'
language: zh
lifecycle:
  status: confirmed
  confidence: 0.95
  review: on venue/status change
  retention: long-lived semantic memory
  reviewedAt: '2026-07-16T20:08:42+08:00'
  reviewDue: '2027-07-16'
  pendingReview: false
  overdue: false
retrieval:
  document_id: 'wiki:Soft_Weighted_Machine_Unlearning_zh'
  chunking: markdown-heading-v1
source_ids:
  - src-0642a11373a83c47
  - src-22eeced7ebe7a0c5
  - src-53e1199f272a4df4
source_path: wiki/Soft_Weighted_Machine_Unlearning_zh.md
---
**超越二元擦除：用于公平性与鲁棒性的软加权遗忘** 是 **[乔鑫宝](./Qiao_Xinbao_zh.md)**、Ningning Ding、Yushi Cheng 和张萌的 AAAI 2026 会议论文。它把机器遗忘重新表述为连续的数据影响修正问题，而不是只能执行“删除或保留”的二元操作。论文关注的是在改善公平性或鲁棒性时，每个样本应保留多少影响，才能避免不必要的效用损失。

![超越二元擦除：用于公平性与鲁棒性的软加权遗忘 AAAI 2026 poster](/papers/soft-weighted/poster.png)

## 概述

论文研究隐私驱动遗忘与修正驱动遗忘之间的差异。在“被遗忘权”场景中，二元删除很自然：一个样本要么保留，要么移除。但在公平性和鲁棒性修正中，目标往往是降低有害影响，同时保留仍然有用的信号。

论文把硬删除带来的失败模式称为 **over-unlearning**：直接删除可能改善目标公平性或鲁棒性指标，却损害效用、把偏差推向相反方向，或把边界样本当作极端有害样本处理。

## 方法

方法用连续样本权重替代二元删除权重。它首先估计每个样本对目标指标与效用的影响，然后求解一个凸二次规划得到定制化权重向量。所得权重被用于影响函数式遗忘或相关校正方法，使有害样本能够被下调权重，而不是被统一视为可完全删除。

三阶段流程为：

1. 估计每个样本对公平性或鲁棒性目标以及效用的影响；
2. 求解连续权重，使目标指标改善，同时约束效用损失；
3. 应用加权模型校正，而不是删除固定 top-k 样本集合。

![软加权机器遗忘框架](/papers/soft-weighted/framework.png)

## 关键启示

- **并非所有修正都应该表现为删除。** 论文区分了隐私式移除与公平性、鲁棒性修正：后者往往需要降低有害影响，同时保留仍然有用的信号。
- **二元遗忘可能反应过度。** 硬删除把所有被选中的样本都当作同样可移除，即使其中一部分仍包含模型需要的信息。
- **数据影响应当像旋钮，而不是开关。** 软权重让维护过程回答“每个样本之后还应有多少影响”，而不是只回答“是否完全消失”。
- **更宏观的启示是机器遗忘也可以成为模型改进接口。** 当删除机制被设计成校准式影响控制时，它可以支持公平性和鲁棒性干预。

## 结果

实验覆盖表格、图像和文本数据集，包括 Adult、Bank、Jigsaw、CelebA 以及 CIFAR 鲁棒性评估。论文报告软加权方法比硬加权方案更稳定地改善公平性或鲁棒性指标，同时降低效用损失。

诊断实验也支持方法动机：leave-one-out 和影响式分析显示，对目标指标有害的样本并不总是对效用有害。因此，“删除或保留”的二元规则对修正驱动遗忘而言过于粗糙。

## 定位

该工作属于 [机器遗忘](./Machine_Unlearning_zh.md)、[公平性与鲁棒性](./Fairness_and_Robustness_zh.md)、[影响函数](./Influence_Functions_zh.md) 和 [可信 AI](./Trustworthy_AI_zh.md)。它补充了 [无 Hessian 在线认证遗忘](./Hessian_Free_Online_Certified_Unlearning_zh.md)：问题从隐私删除转向细粒度模型修正。
