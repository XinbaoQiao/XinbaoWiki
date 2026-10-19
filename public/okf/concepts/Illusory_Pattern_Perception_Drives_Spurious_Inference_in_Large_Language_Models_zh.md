---
type: publication
title: Illusory Pattern Perception Drives Spurious Inference in Large Language Models
description: NeurIPS 2026 论文，通过三个心理任务比较大语言模型与人类的错觉模式感知，并用稀疏自编码器分析相关特征。
tags:
  - zh
  - publication
  - paper
  - accepted
  - neurips-2026
  - llm-reliability
timestamp: '2026-09-25T13:49:35+09:00'
modified: '2026-10-19T12:56:48.831Z'
content_hash: 'sha256:419846454cc15b95d45b6caf287f072c3c7009aa9b4b78293d943dcb36f89639'
reviewed_at: '2026-10-19T12:58:04.614Z'
review_due: '2027-10-19'
language: zh
lifecycle:
  status: confirmed
  confidence: 0.95
  review: on venue/status change
  retention: long-lived semantic memory
  reviewedAt: '2026-10-19T12:58:04.614Z'
  reviewDue: '2027-10-19'
  pendingReview: false
  overdue: false
retrieval:
  document_id: >-
    wiki:Illusory_Pattern_Perception_Drives_Spurious_Inference_in_Large_Language_Models_zh
  chunking: markdown-heading-v1
source_ids:
  - src-19ed8d8ac2a744f7
  - src-2d7834852d5a70ca
  - src-af06ca5886446072
  - src-b005562340a1c871
  - src-d48b0fa9ae43a703
source_path: >-
  wiki/Illusory_Pattern_Perception_Drives_Spurious_Inference_in_Large_Language_Models_zh.md
---
**Illusory Pattern Perception Drives Spurious Inference in Large Language Models** 是 麦佩华\*、邵卓妍\*、**[乔鑫宝](./Qiao_Xinbao_zh.md)**\*、张萌、周欣悅 和 庞严 的论文，已获 NeurIPS 2026 录用。论文研究大语言模型如何从随机、无关或不足以支持关系的证据中推断出关联。[^paper]

\* 共同第一作者。

## 概述

研究改编经典心理实验，设置社群关联（community correlation）、投资关联（investment correlation）和阴谋信念（conspiracy belief）三个任务，并直接比较大语言模型与人类参与者的行为。

在两个关联任务中，正负信息的比例相同，但不同群体或公司的信息数量不同；阴谋信念任务考察对模糊事件之间因果联系的判断。受测模型经常表现出更强的错觉模式感知，但结果随模型与任务而变化。

论文使用稀疏自编码器（SAE）分析成对提示下的内部特征变化，发现整体频率感知与分析性认知取向相关特征与错觉推理有关。[^paper]

## 关键启示

- **信息数量不等于关联证据。** 更常出现的群体或公司可能获得缺乏证据支持的正面关联。
- **推理可靠性也取决于关系判断。** 准确的单条信息仍可能被组合成缺乏支持的因果解释。
- **特征分析提供机制线索。** SAE 结果揭示与错觉推理相关的内部信号，结论应限于受测模型与任务。

[^paper]: [arXiv:2610.07791](https://arxiv.org/abs/2610.07791).

## 定位

这篇论文属于 [大语言模型可靠性](./LLM_Reliability_zh.md) 与 [可信 AI](./Trustworthy_AI_zh.md) 方向，也延续了乔鑫宝对有限或误导性证据如何影响 AI 系统的研究关注。
