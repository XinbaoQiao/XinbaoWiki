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
modified: '2026-10-07T07:07:23.888Z'
content_hash: 'sha256:9f5b1aba471881db05fbe70afb44b584137bbb00b9cd7b37fc9362d35de3540b'
reviewed_at: '2026-10-07T07:07:51.129Z'
review_due: '2027-10-07'
name: 错觉模式感知驱动大语言模型的虚假推理
language: zh
summary: NeurIPS 2026 论文，研究错觉模式感知与大语言模型的虚假推理。
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
translation_of: Illusory_Pattern_Perception_Drives_Spurious_Inference_in_Large_Language_Models
---
**《Illusory Pattern Perception Drives Spurious Inference in Large Language Models》** 是 Peihua Mai\*、Zhuoyan Shao\*、**[[Xinbao_Qiao|乔鑫宝]]**\*、张萌、Xinyue Zhou 和 Yan Pang 的论文，已获 NeurIPS 2026 录用。论文研究提示中被感知到的模式如何使大语言模型作出缺乏充分证据支持的推理。

\* 共同第一作者。

## 概述

提示中看似存在的规律，未必足以支持所要求的结论。论文考察模型如何沿着这种表面规律作答，而未充分评估与问题相关的证据。

## 关键启示

- **表面规律不等于证据。** 提示所暗示的模式本身不能决定模型的结论。
- **可靠推理需要证据支撑。** 当提示诱导模式补全时，应检查回答是否真正由可用证据支持。
- **提示理解关系到大模型可靠性。** 这一失效模式把模型如何解读输入与输出是否可信联系起来。

## 定位

这篇论文属于 [[LLM_Reliability|大语言模型可靠性]] 与 [[Trustworthy_AI|可信 AI]] 方向，也延续了乔鑫宝对有限或误导性证据如何影响 AI 系统的研究关注。
