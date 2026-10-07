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
language: zh
lifecycle:
  status: confirmed
  confidence: 0.95
  review: on venue/status change
  retention: long-lived semantic memory
  reviewedAt: '2026-10-07T07:07:51.129Z'
  reviewDue: '2027-10-07'
  pendingReview: false
  overdue: false
retrieval:
  document_id: >-
    wiki:Illusory_Pattern_Perception_Drives_Spurious_Inference_in_Large_Language_Models_zh
  chunking: markdown-heading-v1
source_ids:
  - src-b005562340a1c871
  - src-d48b0fa9ae43a703
source_path: >-
  wiki/Illusory_Pattern_Perception_Drives_Spurious_Inference_in_Large_Language_Models_zh.md
---
**《Illusory Pattern Perception Drives Spurious Inference in Large Language Models》** 是 Peihua Mai\*、Zhuoyan Shao\*、**[乔鑫宝](./Qiao_Xinbao_zh.md)**\*、张萌、Xinyue Zhou 和 Yan Pang 的论文，已获 NeurIPS 2026 录用。论文研究提示中被感知到的模式如何使大语言模型作出缺乏充分证据支持的推理。

\* 共同第一作者。

## 概述

提示中看似存在的规律，未必足以支持所要求的结论。论文考察模型如何沿着这种表面规律作答，而未充分评估与问题相关的证据。

## 关键启示

- **表面规律不等于证据。** 提示所暗示的模式本身不能决定模型的结论。
- **可靠推理需要证据支撑。** 当提示诱导模式补全时，应检查回答是否真正由可用证据支持。
- **提示理解关系到大模型可靠性。** 这一失效模式把模型如何解读输入与输出是否可信联系起来。

## 定位

这篇论文属于 [大语言模型可靠性](./LLM_Reliability_zh.md) 与 [可信 AI](./Trustworthy_AI_zh.md) 方向，也延续了乔鑫宝对有限或误导性证据如何影响 AI 系统的研究关注。
