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
modified: '2026-09-26T08:09:04.309Z'
content_hash: 'sha256:835e399ecf6b3cc8a1bc3d3ef9c97168487ca5f2876220f6b446f62b9db65166'
reviewed_at: '2026-09-26T08:09:37.000Z'
review_due: '2027-09-26'
language: zh
lifecycle:
  status: confirmed
  confidence: 0.95
  review: on venue/status change
  retention: long-lived semantic memory
  reviewedAt: '2026-09-26T08:09:37.000Z'
  reviewDue: '2027-09-26'
  pendingReview: false
  overdue: false
retrieval:
  document_id: >-
    wiki:Illusory_Pattern_Perception_Drives_Spurious_Inference_in_Large_Language_Models_zh
  chunking: markdown-heading-v1
source_ids: []
source_path: >-
  wiki/Illusory_Pattern_Perception_Drives_Spurious_Inference_in_Large_Language_Models_zh.md
---
**《Illusory Pattern Perception Drives Spurious Inference in Large Language Models》** 是 Peihua Mai、Zhuoyan Shao、**[乔鑫宝](./Qiao_Xinbao_zh.md)**、张萌、Xinyue Zhou 和 Yan Pang 的论文，已获 NeurIPS 2026 录用。论文研究提示中被感知到的模式如何使大语言模型作出缺乏充分证据支持的推理。

*作者说明：Peihua Mai、Zhuoyan Shao 和乔鑫宝贡献相同，均为共同第一作者。*

## 概述

论文将错觉模式感知放在大语言模型可靠性问题中考察。提示可能看起来存在规律，但这种规律未必足以支持所要求的结论。相应的风险是，模型沿着表面模式作答，而没有充分评估与问题相关的证据。

## 关键启示

- **表面规律不等于证据。** 提示所暗示的模式本身不能决定模型的结论。
- **可靠推理需要证据支撑。** 当提示诱导模式补全时，应检查回答是否真正由可用证据支持。
- **提示理解关系到大模型可靠性。** 这一失效模式把模型如何解读输入与输出是否可信联系起来。

## 定位

这篇论文属于 [大语言模型可靠性](./LLM_Reliability_zh.md) 与 [可信 AI](./Trustworthy_AI_zh.md) 方向，也延续了乔鑫宝对有限或误导性证据如何影响 AI 系统的研究关注。
