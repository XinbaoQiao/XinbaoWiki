---
type: publication
title: 错觉模式感知驱动大语言模型的虚假推理
description: NeurIPS 2026 论文，通过三个心理任务比较大语言模型与人类的错觉模式感知，并用稀疏自编码器分析相关特征。
tags:
  - zh
  - publication
  - paper
  - accepted
  - neurips-2026
  - llm-reliability
timestamp: '2026-09-25T13:49:35+09:00'
modified: '2026-10-11T14:22:08.131Z'
content_hash: 'sha256:6248b4d648481ac2ca59b50d984755a2510b7422b9359c59499eb38fc09a8167'
reviewed_at: '2026-10-11T14:22:50.689Z'
review_due: '2027-10-11'
name: 错觉模式感知驱动大语言模型的虚假推理
language: zh
summary: NeurIPS 2026 论文，通过三个心理任务比较大语言模型与人类的错觉模式感知，并用稀疏自编码器分析相关特征。
dates: 2026年12月6日至12日
authors:
  - Peihua Mai
  - Zhuoyan Shao
  - 乔鑫宝
  - 张萌
  - Xinyue Zhou
  - Yan Pang
venue: NeurIPS 2026
location: 澳大利亚悉尼（主会场）
year: 2026
status: accepted
publication_type: 会议论文
links:
  - label: NeurIPS 2026 会议官网
    url: 'https://neurips.cc/Conferences/2026'
  - label: OpenReview
    url: 'https://openreview.net/forum?id=VLcmdFfRQc'
  - label: arXiv
    url: 'https://arxiv.org/abs/2610.07791'
  - label: PDF
    url: 'https://arxiv.org/pdf/2610.07791'
  - label: Code
    url: 'https://github.com/NusIoraPrivacy/illusory'
translation_of: Illusory_Pattern_Perception_Drives_Spurious_Inference_in_Large_Language_Models
---
**《Illusory Pattern Perception Drives Spurious Inference in Large Language Models》** 是 Peihua Mai\*、Zhuoyan Shao\*、**[[Xinbao_Qiao|乔鑫宝]]**\*、张萌、Xinyue Zhou 和 Yan Pang 的论文，已获 NeurIPS 2026 录用。论文研究大语言模型如何从随机、无关或不足以支持关系的证据中推断出关联。[^paper]

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

这篇论文属于 [[LLM_Reliability|大语言模型可靠性]] 与 [[Trustworthy_AI|可信 AI]] 方向，也延续了乔鑫宝对有限或误导性证据如何影响 AI 系统的研究关注。
