---
type: publication
title: 错觉模式感知驱动大语言模型的虚假推理
description: NeurIPS 2026 论文，研究错觉模式感知与大语言模型的虚假推理。
tags:
  - zh
  - publication
  - paper
  - accepted
  - neurips-2026
  - llm-reliability
timestamp: '2026-09-25T13:49:35+09:00'
modified: '2026-09-25T04:53:27.237Z'
content_hash: 'sha256:f4c790a4291c9ec7cf40078711cf0c8a08559b37f22ed15fc5fb7a7f7d2164f8'
reviewed_at: '2026-09-25T04:54:14.029Z'
review_due: '2027-09-25'
name: 错觉模式感知驱动大语言模型的虚假推理
language: zh
summary: NeurIPS 2026 论文，研究错觉模式感知与大语言模型的虚假推理。
authors:
  - Peihua Mai
  - Zhuoyan Shao
  - 乔鑫宝
  - 张萌
  - Xinyue Zhou
  - Yan Pang
venue: NeurIPS 2026
year: 2026
status: accepted
publication_type: 会议论文
translation_of: Illusory_Pattern_Perception_Drives_Spurious_Inference_in_Large_Language_Models
---
**《Illusory Pattern Perception Drives Spurious Inference in Large Language Models》** 是 Peihua Mai、Zhuoyan Shao、**[[Xinbao_Qiao|乔鑫宝]]**、张萌、Xinyue Zhou 和 Yan Pang 的论文，已获 NeurIPS 2026 录用。论文研究提示中被感知到的模式如何使大语言模型作出缺乏充分证据支持的推理。

## 概述

论文将错觉模式感知放在大语言模型可靠性问题中考察。提示可能看起来存在规律，但这种规律未必足以支持所要求的结论。相应的风险是，模型沿着表面模式作答，而没有充分评估与问题相关的证据。

## 关键启示

- **表面规律不等于证据。** 提示所暗示的模式本身不能决定模型的结论。
- **可靠推理需要证据支撑。** 当提示诱导模式补全时，应检查回答是否真正由可用证据支持。
- **提示理解关系到大模型可靠性。** 这一失效模式把模型如何解读输入与输出是否可信联系起来。

## 定位

这篇论文属于 [[LLM_Reliability|大语言模型可靠性]] 与 [[Trustworthy_AI|可信 AI]] 方向，也延续了乔鑫宝对有限或误导性证据如何影响 AI 系统的研究关注。
